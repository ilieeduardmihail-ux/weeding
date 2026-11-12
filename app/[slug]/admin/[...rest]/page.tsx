import { PanelNotFound } from "@/components/panel-not-found";

/**
 * Any `/<slug>/admin/<ceva>` that matches no section lands here instead of the
 * guest 404. The proxy has already decided who may be inside this panel, so
 * this page only has to say what happened and offer the way back.
 *
 * The link goes to the bare `/admin` resolver, so it works for a couple (their
 * own panel) and for the platform owner (the client list) alike.
 */
export default function AdminUnknownPath() {
  return (
    <PanelNotFound
      title="Pagina nu există în panou"
      body="Adresa din bara de sus nu duce către o secțiune a panoului. Verifică linkul sau întoarce-te la panoul tău."
      href="/admin"
      label="Înapoi la panou"
    />
  );
}
