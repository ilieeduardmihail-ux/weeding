/**
 * Shared "open the invitation" action. Both the hero and the mobile CTA fire the
 * same event; the screen swap itself lives in InvitationScreen.
 */
export const OPEN_INVITATION_EVENT = "open-invitation";

export function requestOpenInvitation() {
  window.dispatchEvent(new Event(OPEN_INVITATION_EVENT));
}
