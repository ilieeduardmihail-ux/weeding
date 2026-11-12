import { connection } from "next/server";
import { isOwnerRequest, platformIsConfigured } from "@/lib/platform";
import { loadInvoice } from "@/lib/platform-data";
import { buildInvoicePdf, invoicePdfFileName } from "@/lib/invoice-pdf";

/**
 * The invoice as a PDF: what the email attaches and what the download button
 * fetches. Owner only — the note carries the client's name and the owner's
 * bank details, so it is never public.
 */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  await connection();
  if (!(await isOwnerRequest())) return new Response("Neautorizat", { status: 401 });
  if (!platformIsConfigured()) return new Response("Indisponibil", { status: 503 });

  const { id } = await params;
  const loaded = await loadInvoice(id);
  if (!loaded) return new Response("Factura nu există", { status: 404 });

  const bytes = await buildInvoicePdf(loaded.invoice, loaded.issuer);
  // Copy into a plain ArrayBuffer: `Response` does not take a shared buffer.
  const body = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;

  return new Response(body, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${invoicePdfFileName(loaded.invoice)}"`,
      "Cache-Control": "no-store",
    },
  });
}
