import { describe, expect, it } from "vitest";
import { PDFDocument } from "pdf-lib";
import { buildInvoicePdf, invoicePdfFileName } from "@/lib/invoice-pdf";
import type { Invoice, IssuerSettings } from "@/lib/platform-types";

const issuer: IssuerSettings = {
  issuerName: "Ilie Eduard",
  issuerAddress: "Str. Florilor 1, București",
  issuerEmail: "contact@exemplu.ro",
  issuerPhone: "0721 234 567",
  issuerTaxId: "1234567890123",
  issuerBank: "Banca Transilvania",
  issuerIban: "RO49AAAA1B31007593840000",
  currency: "RON",
  footerNote: "Mulțumim! Emisă fără TVA.",
};

const invoice = (overrides: Partial<Invoice> = {}): Invoice => ({
  id: "00000000-0000-4000-8000-000000000001",
  number: 12,
  issuedAt: "2026-11-12",
  clientName: "Ana & Ștefan",
  clientEmail: "client@exemplu.ro",
  clientSlug: "ana-si-stefan",
  tenantId: null,
  description: "Acces site invitație nuntă — pachet complet, țărm și măsuri",
  amount: 500,
  currency: "RON",
  paid: false,
  paidAt: null,
  notes: "Plata se face până la 1 decembrie. Mulțumim frumos!",
  ...overrides,
});

describe("invoice PDF", () => {
  it("names the file after the number and the client's site", () => {
    expect(invoicePdfFileName(invoice())).toBe("nota-de-plata-12-ana-si-stefan.pdf");
    expect(invoicePdfFileName(invoice({ clientSlug: null }))).toBe("nota-de-plata-12-ana-stefan.pdf");
    expect(invoicePdfFileName(invoice({ clientSlug: null, clientName: "" }))).toBe(
      "nota-de-plata-12-client.pdf"
    );
    // Nothing that would be unsafe in a filename survives.
    expect(invoicePdfFileName(invoice({ number: 7, clientSlug: "Ünïcode / ../ etc" }))).toBe(
      "nota-de-plata-7-unicode-etc.pdf"
    );
  });

  it("builds one A4 page with a real PDF body", async () => {
    const bytes = await buildInvoicePdf(invoice(), issuer);

    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-");
    expect(bytes.byteLength).toBeGreaterThan(2_000);

    const doc = await PDFDocument.load(bytes);
    expect(doc.getPageCount()).toBe(1);
    const { width, height } = doc.getPage(0).getSize();
    expect(Math.round(width)).toBe(595);
    expect(Math.round(height)).toBe(842);
    expect(doc.getTitle()).toBe("Notă de plată nr. 12");
    expect(doc.getAuthor()).toBe("Ilie Eduard");
  });

  it("embeds a subset, not the whole font", async () => {
    const bytes = await buildInvoicePdf(invoice(), issuer);
    // Two full Noto Sans faces are ~1.1 MB; a subset of one note is far smaller.
    expect(bytes.byteLength).toBeLessThan(150_000);
  });

  it("keeps the Romanian diacritics (a missing glyph would throw while drawing)", async () => {
    const bytes = await buildInvoicePdf(
      invoice({
        clientName: "Țăran Ștefan",
        description: "Invitație cu ă, â, î, ș și ț — „ghilimele”",
        notes: "Ține cont de diacritice: ș, ț, ă, â, î.",
      }),
      { ...issuer, issuerAddress: "Str. Ștefan cel Mare 1, Târgu Mureș" }
    );

    expect(bytes.byteLength).toBeGreaterThan(2_000);
  });

  it("switches the message when the note is paid, and survives an empty issuer", async () => {
    const empty: IssuerSettings = {
      issuerName: "",
      issuerAddress: "",
      issuerEmail: "",
      issuerPhone: "",
      issuerTaxId: "",
      issuerBank: "",
      issuerIban: "",
      currency: "RON",
      footerNote: "",
    };

    const paid = await buildInvoicePdf(
      invoice({ paid: true, paidAt: "2026-11-20T10:00:00Z", notes: null }),
      issuer
    );
    const bare = await buildInvoicePdf(invoice({ amount: 0, notes: null }), empty);

    expect((await PDFDocument.load(paid)).getPageCount()).toBe(1);
    expect((await PDFDocument.load(bare)).getPageCount()).toBe(1);
  });
});
