import { readFile } from "node:fs/promises";
import path from "node:path";
import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, type PDFFont } from "pdf-lib";
import { formatMoney, type Invoice, type IssuerSettings } from "@/lib/platform-types";
import { invoiceDate } from "@/lib/invoice-email";

/**
 * The invoice as a one-page A4 PDF, for the email attachment and for the
 * download button. It mirrors the printed note, with the same wording.
 *
 * The fonts are bundled because the PDF standard fonts have no Romanian
 * diacritics (ă, â, î, ș, ț). They are subset on embed, so a note is tens of
 * kilobytes, not hundreds.
 */
const FONT_DIR = path.join(process.cwd(), "assets", "fonts");

type FontBytes = { regular: Uint8Array; bold: Uint8Array };

let fontCache: Promise<FontBytes> | null = null;

function loadFonts(): Promise<FontBytes> {
  fontCache ??= Promise.all([
    readFile(path.join(FONT_DIR, "NotoSans-Regular.ttf")),
    readFile(path.join(FONT_DIR, "NotoSans-Bold.ttf")),
  ])
    .then(([regular, bold]) => ({ regular, bold }))
    .catch((error: unknown) => {
      // Do not cache a failure: a later request may still succeed.
      fontCache = null;
      throw error;
    });
  return fontCache;
}

const PAGE = { width: 595.28, height: 841.89 }; // A4, in points
const MARGIN = 56;
const INK = rgb(0.11, 0.12, 0.11);
const MUTED = rgb(0.42, 0.43, 0.42);
const LINE = rgb(0.8, 0.81, 0.78);

/** Greedy word wrap; long words are left over the edge rather than cut. */
function wrap(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    const words = paragraph.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      lines.push("");
      continue;
    }
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        line = candidate;
        continue;
      }
      if (line) lines.push(line);
      line = word;
    }
    if (line) lines.push(line);
  }
  return lines;
}

export function invoicePdfFileName(invoice: Invoice): string {
  const raw = invoice.clientSlug || invoice.clientName || "client";
  const slug = raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 40)
    .replace(/^-+|-+$/g, "");
  return `nota-de-plata-${invoice.number}${slug ? `-${slug}` : ""}.pdf`;
}

export async function buildInvoicePdf(invoice: Invoice, issuer: IssuerSettings): Promise<Uint8Array> {
  const { regular, bold } = await loadFonts();
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);

  const font = await doc.embedFont(regular, { subset: true });
  const strong = await doc.embedFont(bold, { subset: true });

  doc.setTitle(`Notă de plată nr. ${invoice.number}`);
  if (issuer.issuerName) doc.setAuthor(issuer.issuerName);
  doc.setCreator("Ne căsătorim");

  const page = doc.addPage([PAGE.width, PAGE.height]);
  const left = MARGIN;
  const right = PAGE.width - MARGIN;
  const contentWidth = right - left;
  const money = formatMoney(invoice.amount, invoice.currency).replace(/\u00a0/g, " ");

  const text = (
    value: string,
    x: number,
    y: number,
    size: number,
    color = INK,
    weight: "regular" | "bold" = "regular"
  ) =>
    page.drawText(value, {
      x,
      y,
      size,
      font: weight === "bold" ? strong : font,
      color,
    });

  const rightAligned = (value: string, size: number, weight: "regular" | "bold", y: number) => {
    const used = weight === "bold" ? strong : font;
    page.drawText(value, {
      x: right - used.widthOfTextAtSize(value, size),
      y,
      size,
      font: used,
      color: INK,
    });
  };

  let y = PAGE.height - MARGIN;

  // Header -------------------------------------------------------------------
  text("Notă de plată", left, y - 16, 20, INK, "bold");
  text("Fără TVA", left, y - 31, 9, MUTED);
  rightAligned(`Nr. ${invoice.number}`, 11, "bold", y - 14);
  const dateText = `Data: ${invoiceDate(invoice.issuedAt) || "—"}`;
  rightAligned(dateText, 9, "regular", y - 27);

  y -= 46;
  page.drawLine({ start: { x: left, y }, end: { x: right, y }, thickness: 0.8, color: LINE });

  // Emitent / Client ---------------------------------------------------------
  y -= 20;
  const columnWidth = (contentWidth - 24) / 2;
  const columnTop = y;

  const block = (x: number, title: string, lines: string[]) => {
    text(title.toUpperCase(), x, columnTop, 7.5, MUTED, "bold");
    let cursor = columnTop - 15;
    for (const line of lines.filter(Boolean)) {
      for (const part of wrap(line, font, 9.5, columnWidth)) {
        text(part, x, cursor, 9.5);
        cursor -= 13;
      }
    }
    return cursor;
  };

  const issuerEnd = block(
    left,
    "Emitent",
    [
      issuer.issuerName,
      issuer.issuerAddress,
      issuer.issuerTaxId ? `CUI/CNP: ${issuer.issuerTaxId}` : "",
      issuer.issuerEmail,
      issuer.issuerPhone,
      issuer.issuerIban
        ? `${issuer.issuerBank ? `${issuer.issuerBank} · ` : ""}IBAN: ${issuer.issuerIban}`
        : "",
    ].filter(Boolean)
  );

  const clientEnd = block(
    left + columnWidth + 24,
    "Client",
    [
      invoice.clientName,
      invoice.clientSlug ? `Site: /${invoice.clientSlug}` : "",
      invoice.clientEmail ?? "",
    ].filter(Boolean)
  );

  y = Math.min(issuerEnd, clientEnd) - 16;

  // Table --------------------------------------------------------------------
  text("DESCRIERE", left, y, 7.5, MUTED, "bold");
  rightAligned("SUMĂ", 7.5, "bold", y);
  y -= 6;
  page.drawLine({ start: { x: left, y }, end: { x: right, y }, thickness: 0.8, color: LINE });

  y -= 17;
  const rowTop = y;
  let descriptionCursor = rowTop;
  for (const line of wrap(invoice.description, font, 10.5, contentWidth - 130)) {
    text(line, left, descriptionCursor, 10.5);
    descriptionCursor -= 15;
  }
  rightAligned(money, 10.5, "regular", rowTop);

  y = Math.min(descriptionCursor + 4, rowTop - 15);
  page.drawLine({ start: { x: left, y }, end: { x: right, y }, thickness: 0.6, color: LINE });

  // Total --------------------------------------------------------------------
  y -= 22;
  const totalLabel = "Total de plată";
  const moneyWidth = strong.widthOfTextAtSize(money, 14);
  // The label sits to the left of the amount, measured, so a long currency name
  // or a big number can never run into it.
  text(
    totalLabel,
    right - moneyWidth - 24 - font.widthOfTextAtSize(totalLabel, 10),
    y,
    10,
    MUTED
  );
  rightAligned(money, 14, "bold", y);

  // Stare, note, subsol ------------------------------------------------------
  y -= 30;
  const status = invoice.paid
    ? `Stare: plătită${invoice.paidAt ? ` la ${invoiceDate(invoice.paidAt)}` : ""}.`
    : issuer.issuerIban
      ? `Stare: neplătită · se poate achita în contul ${issuer.issuerBank ? `${issuer.issuerBank}, ` : ""}IBAN ${issuer.issuerIban}.`
      : "Stare: neplătită.";

  for (const line of wrap(status, font, 9.5, contentWidth)) {
    text(line, left, y, 9.5);
    y -= 13;
  }

  if (invoice.notes) {
    y -= 8;
    for (const line of wrap(invoice.notes, font, 9.5, contentWidth)) {
      text(line, left, y, 9.5, MUTED);
      y -= 13;
    }
  }

  if (issuer.footerNote) {
    const lines = wrap(issuer.footerNote, font, 8.5, contentWidth);
    let footerY = MARGIN + (lines.length - 1) * 11;
    page.drawLine({
      start: { x: left, y: footerY + 8 },
      end: { x: right, y: footerY + 8 },
      thickness: 0.6,
      color: LINE,
    });
    for (const line of lines) {
      text(line, left, footerY, 8.5, MUTED);
      footerY -= 11;
    }
  }

  return doc.save();
}
