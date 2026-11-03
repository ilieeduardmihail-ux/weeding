/**
 * Shared "open the invitation" action. The hero plays the zoom transition and
 * this module owns the anchor target, so both the hero and the mobile CTA behave
 * identically.
 */
export const OPEN_INVITATION_EVENT = "open-invitation";
export const INVITATION_ZOOM_MS = 520;

export function requestOpenInvitation() {
  window.dispatchEvent(new Event(OPEN_INVITATION_EVENT));
}

export function scrollToInvitation(behavior: ScrollBehavior = "smooth") {
  const target = document.getElementById("locatii");
  if (!target) return;
  target.scrollIntoView({ behavior, block: "start" });
}
