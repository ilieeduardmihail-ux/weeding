"use client";

/**
 * The one contact link used by the marketing pages.
 *
 * A phone gets a `mailto:` link: the system then opens the compose screen of the
 * default mail app, or lets the visitor choose between Gmail, Outlook and Mail.
 * The Gmail web compose URL is only used on a computer, where it is the most
 * reliable target — a `mailto:` with no mail app registered would do nothing.
 *
 * The link is rendered as `mailto:` from the server, so it still works without
 * JavaScript; the click handler only swaps to Gmail for a mouse.
 */
import type { ComponentPropsWithRef, MouseEvent } from "react";
import { CONTACT_COMPOSE, CONTACT_MAILTO } from "@/lib/marketing";

const DESKTOP_POINTER = "(hover: hover) and (pointer: fine)";

export function ContactLink({ onClick, ...props }: ComponentPropsWithRef<"a">) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (event.defaultPrevented) return;

    // Leave the browser's own behaviour alone for middle clicks and shortcuts.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    if (!window.matchMedia(DESKTOP_POINTER).matches) return;

    event.preventDefault();
    window.open(CONTACT_COMPOSE, "_blank", "noopener,noreferrer");
  }

  return <a {...props} href={CONTACT_MAILTO} onClick={handleClick} />;
}
