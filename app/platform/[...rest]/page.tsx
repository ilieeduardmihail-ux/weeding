import { PanelNotFound } from "@/components/panel-not-found";

/**
 * Any `/platform/<ceva>` that matches no section. Same reasoning as the admin
 * catch-all: without it the platform owner would get the guest 404, which talks
 * about an invitation.
 */
export default function PlatformUnknownPath() {
  return (
    <PanelNotFound
      title="Pagina nu există în platformă"
      body="Adresa din bara de sus nu duce către o secțiune a platformei. Verifică linkul sau întoarce-te la lista de clienți."
      href="/platform"
      label="Înapoi la platformă"
    />
  );
}
