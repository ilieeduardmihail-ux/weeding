import { describe, expect, it } from "vitest";
import {
  invoiceDate,
  invoiceEmailBody,
  invoiceEmailCopy,
  invoiceEmailSubject,
  invoiceMailto,
  isEmailLike,
} from "@/lib/invoice-email";
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
  footerNote: "Mulțumim!",
};

const invoice = (overrides: Partial<Invoice> = {}): Invoice => ({
  id: "00000000-0000-4000-8000-000000000001",
  number: 12,
  issuedAt: "2026-11-12",
  clientName: "Ana & Ștefan",
  clientEmail: null,
  clientSlug: "ana-si-stefan",
  tenantId: null,
  description: "Acces site invitație nuntă",
  amount: 500,
  currency: "RON",
  paid: false,
  paidAt: null,
  notes: null,
  ...overrides,
});

describe("invoice email", () => {
  it("names the note and the issuer in the subject", () => {
    expect(invoiceEmailSubject(invoice(), issuer)).toBe("Notă de plată nr. 12 — Ilie Eduard");
    expect(invoiceEmailSubject(invoice(), { ...issuer, issuerName: "" })).toBe("Notă de plată nr. 12");
  });

  it("writes a whole note: greeting, amount, unpaid state and the IBAN", () => {
    const body = invoiceEmailBody(invoice(), issuer);

    expect(body).toContain("Bună ziua, Ana & Ștefan,");
    expect(body).toContain("nota de plată nr. 12 din 12 noiembrie 2026");
    expect(body).toContain("Total de plată: 500,00 RON");
    expect(body).toContain("Stare: neplătită");
    expect(body).toContain("Banca Transilvania, IBAN RO49AAAA1B31007593840000");
    expect(body).toContain("Mulțumim!");
    expect(body).toContain("CUI/CNP: 1234567890123");
    expect(body).toContain("contact@exemplu.ro · 0721 234 567");
  });

  it("says it was paid, without the IBAN, once the note is settled", () => {
    const body = invoiceEmailBody(
      invoice({ paid: true, paidAt: "2026-11-20T10:00:00Z" }),
      issuer
    );

    expect(body).toContain("Stare: plătită la 20 noiembrie 2026.");
    expect(body).not.toContain("IBAN");
  });

  it("drops the bank and the signature when the owner has not filled them in", () => {
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
    const body = invoiceEmailBody(invoice(), empty);

    expect(body).toContain("Stare: neplătită.");
    expect(body).not.toContain("IBAN");
    expect(body.trim().endsWith("Stare: neplătită.")).toBe(true);
  });

  it("keeps the notes and leaves out a blank greeting name", () => {
    const body = invoiceEmailBody(
      invoice({ clientName: "  ", notes: "Plata se face până la 1 decembrie." }),
      issuer
    );

    expect(body.startsWith("Bună ziua,")).toBe(true);
    expect(body).toContain("Plata se face până la 1 decembrie.");
  });

  it("opens the mail app with subject and body, using CRLF line breaks", () => {
    const href = invoiceMailto(invoice(), issuer, " client@exemplu.ro ");

    expect(href.startsWith("mailto:client@exemplu.ro?subject=")).toBe(true);
    expect(href).toContain(encodeURIComponent("Notă de plată nr. 12 — Ilie Eduard"));
    expect(href).toContain("%0D%0A");
    expect(href).not.toContain("%0A%0A");
    expect(decodeURIComponent(href.split("&body=")[1].replace(/%0D/g, ""))).toBe(
      invoiceEmailBody(invoice(), issuer)
    );
  });

  it("puts the subject above the body when copied", () => {
    const text = invoiceEmailCopy(invoice(), issuer);
    expect(text.startsWith("Notă de plată nr. 12 — Ilie Eduard\n\nBună ziua")).toBe(true);
  });

  it("rejects addresses a mail client cannot use", () => {
    expect(isEmailLike("client@exemplu.ro")).toBe(true);
    expect(isEmailLike("  client@exemplu.ro ")).toBe(true);
    expect(isEmailLike("client")).toBe(false);
    expect(isEmailLike("client@exemplu")).toBe(false);
    expect(isEmailLike("client @exemplu.ro")).toBe(false);
    expect(isEmailLike("a@b.ro, c@d.ro")).toBe(false);
    expect(isEmailLike("")).toBe(false);
  });

  it("formats both plain dates and timestamps, and gives up on nonsense", () => {
    expect(invoiceDate("2026-11-12")).toBe("12 noiembrie 2026");
    expect(invoiceDate("2026-11-20T10:00:00Z")).toBe("20 noiembrie 2026");
    expect(invoiceDate(null)).toBe("");
    expect(invoiceDate("nu-i-o-data")).toBe("");
  });
});
