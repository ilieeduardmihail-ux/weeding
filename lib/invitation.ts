/**
 * Shared "open the invitation" action. The hero listens for this event and
 * plays its zoom transition before scrolling to the first content section.
 */
export const OPEN_INVITATION_EVENT = "open-invitation";

export function requestOpenInvitation() {
  window.dispatchEvent(new Event(OPEN_INVITATION_EVENT));
}
