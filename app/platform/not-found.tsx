import { PanelNotFound } from "@/components/panel-not-found";

/**
 * For the cases where a page *inside* the platform calls `notFound()` (an
 * invoice id that no longer exists, for instance). A URL that matches no route
 * at all is handled by `[...rest]/page.tsx` next to this file.
 */
export default function PlatformNotFound() {
  return (
    <PanelNotFound
      title="Pagina nu există în platformă"
      body="Adresa din bara de sus nu duce către o secțiune a platformei. Verifică linkul sau întoarce-te la lista de clienți."
      href="/platform"
      label="Înapoi la platformă"
    />
  );
}
