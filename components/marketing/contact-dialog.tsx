"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { X } from "lucide-react";
import { Button, type ButtonProps } from "@/components/ui/button";
import { ContactForm } from "@/components/marketing/contact-form";

/**
 * The offer request lives in a dialog, not in a block on the page.
 *
 * The form used to sit below the price and took most of a screen on a phone.
 * Now every "Cere ofertă" button on the page opens the same dialog, so the
 * fields exist once in the DOM: the same labels, one honeypot, one copy of the
 * text. The dialog is a native <dialog>, so Escape closes it and the rest of the
 * page cannot be scrolled or clicked behind it.
 */

const OpenContactDialog = createContext<(() => void) | null>(null);

export function ContactDialogProvider({ children }: { children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  // The demo panel's bar sends visitors to /?oferta=1: the request form starts
  // open, so the click after „Vreau invitația mea" lands on the first field.
  // Read during the first render rather than in an effect, so nothing flashes.
  const [open, setOpen] = useState(
    () => typeof window !== "undefined" && new URLSearchParams(window.location.search).has("oferta")
  );

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  return (
    <OpenContactDialog.Provider value={() => setOpen(true)}>
      {children}
      <dialog
        ref={dialog}
        onClose={() => setOpen(false)}
        aria-labelledby="contact-dialog-title"
        className="m-auto max-h-[92svh] w-[min(94vw,34rem)] overflow-y-auto rounded-2xl bg-sea p-5 text-ink shadow-[0_40px_90px_-40px_rgba(0,0,0,0.55)] backdrop:bg-ink/60 sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-gold">
              Cererea voastră
            </p>
            <h2 id="contact-dialog-title" className="mt-2 font-display text-2xl leading-snug">
              Spuneți-ne ce invitație aveți în minte.
            </h2>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Închide"
            onClick={() => setOpen(false)}
            className="-mt-1 shrink-0"
          >
            <X aria-hidden />
          </Button>
        </div>
        <div className="mt-4">
          <ContactForm framed={false} />
        </div>
      </dialog>
    </OpenContactDialog.Provider>
  );
}

/** Any button on the page that opens the shared request dialog. */
export function ContactTrigger({ children, onClick, ...props }: ButtonProps) {
  const open = useContext(OpenContactDialog);

  return (
    <Button
      type="button"
      {...props}
      onClick={(event) => {
        onClick?.(event);
        if (event.defaultPrevented) return;
        open?.();
      }}
    >
      {children}
    </Button>
  );
}
