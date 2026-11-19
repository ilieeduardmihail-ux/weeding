/**
 * What a demo copy cannot do, and how that is said.
 *
 * The demo panel is a real panel: the visitor edits their own wedding, adds
 * guests, moves tables, writes the budget. The product's *output* stays locked
 * until they buy — the published site, the spreadsheet exports, the Excel
 * import, the invitation photo and the visual theme. The words live here so the
 * server actions and the screens that replace those tabs agree.
 */

export type SandboxLock = { title: string; body: string };

export const SANDBOX_LOCK: Record<"import" | "theme" | "photo", SandboxLock> = {
  import: {
    title: "Importul din Excel se deschide după rezervare",
    body: "În demo adaugi invitații unul câte unul, din lista de invitați. Importul listelor lungi, dintr-un fișier, face parte din invitația ta.",
  },
  theme: {
    title: "Paleta și florile se aleg după rezervare",
    body: "Demo-ul păstrează aspectul primei nunți. După rezervare alegi culorile, florile și poza invitației, iar schimbarea se vede imediat pe site.",
  },
  photo: {
    title: "Poza invitației se încarcă după rezervare",
    body: "Poza apare în previzualizarea de pe WhatsApp. În demo nu are rost să o încarci, pentru că demo-ul nu are pagină publică.",
  },
};

/** Errors returned by the server actions, when the UI is bypassed. */
export const SANDBOX_LOCK_ERROR = {
  import: "Importul din Excel este disponibil după rezervare. În demo, adaugă invitații unul câte unul.",
  theme: "Paleta se alege după rezervare. În demo, aspectul rămâne cel al nunții demonstrative.",
  photo: "Poza invitației se încarcă după rezervare.",
} as const;
