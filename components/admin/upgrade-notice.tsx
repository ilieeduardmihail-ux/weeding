"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Crown, Gift, Lock, PiggyBank, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContactLink } from "@/components/marketing/contact-link";
import { useAdminData } from "@/components/admin/admin-data";
import { CONTACT_COMPOSE, CONTACT_MAILTO, CONTACT_EMAIL, contactLinks } from "@/lib/marketing";
import { PUBLIC_SITE_URL } from "@/lib/message-template";
import { premiumBody, premiumRequest, premiumSubject } from "@/lib/premium-message";

const INCLUDED = [
  { icon: Wallet, title: "Buget & furnizori", text: "Avans, rest înainte de nuntă și rest în ziua nunții, pe fiecare cheltuială." },
  { icon: PiggyBank, title: "Planificator financiar", text: "Câte luni au rămas și cât trebuie economisit în fiecare lună." },
  { icon: Gift, title: "Calculator de dar", text: "Darul minim recomandat per persoană și per cuplu, pornind de la buget." },
];

/**
 * Shown instead of the Premium modules for a Standard wedding. The upgrade is
 * a conversation, not a checkout: the couple writes to us and we switch the plan.
 *
 * The email is written here, per wedding: names, date, city and the invitation
 * link come from this wedding's settings, so the draft in Gmail needs no
 * follow-up question about who is writing.
 */
export function UpgradeNotice() {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);

  const { data } = useAdminData();
  const links = useMemo(() => {
    if (!data) return { mailto: CONTACT_MAILTO, compose: CONTACT_COMPOSE };
    const request = premiumRequest(data.settings, data.slug, PUBLIC_SITE_URL);
    return contactLinks(premiumSubject(request), premiumBody(request));
  }, [data]);

  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    if (!open && element.open) element.close();
  }, [open]);

  return (
    <section className="glass mx-auto mt-10 max-w-3xl rounded-2xl p-6 sm:p-8" aria-labelledby="premium-title">
      <p className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.3em] text-gold">
        <Crown className="size-4" aria-hidden /> Pachetul Premium
      </p>
      <h1 id="premium-title" className="mt-3 font-display text-3xl text-ink sm:text-4xl">
        Bugetul, furnizorii și planificatorul sunt în Premium.
      </h1>
      <p className="mt-3 max-w-2xl leading-relaxed text-ink/70">
        Pachetul Standard acoperă tot ce ține de invitați: RSVP, meniul de pici, alergii, mese
        și exportul pentru restaurant. Premium adaugă partea financiară, ca să știți exact ce
        aveți de plătit și cât economisiți lunar.
      </p>

      <ul className="mt-6 grid gap-3 sm:grid-cols-3">
        {INCLUDED.map(({ icon: Icon, title, text }) => (
          <li key={title} className="rounded-lg border border-ink/10 bg-paper/40 p-4">
            <Icon className="size-5 text-gold" aria-hidden />
            <p className="mt-2 font-medium">{title}</p>
            <p className="mt-1 text-sm leading-relaxed text-ink/65">{text}</p>
          </li>
        ))}
      </ul>

      <div className="mt-7 flex flex-wrap items-center gap-3">
        <Button type="button" onClick={() => setOpen(true)} className="bg-ink text-sea hover:bg-ink/85">
          <Lock className="size-4" aria-hidden /> Activează Premium
        </Button>
        <ContactLink
          compose={links.compose}
          mailto={links.mailto}
          className="text-sm text-ink/70 underline decoration-gold/50 underline-offset-4 transition-colors hover:text-ink"
        >
          Scrie-ne la {CONTACT_EMAIL}
        </ContactLink>
      </div>

      <dialog
        ref={dialog}
        onClose={() => setOpen(false)}
        aria-labelledby="upgrade-title"
        className="glass-bar m-auto w-[min(92vw,30rem)] rounded-xl p-6 text-ink backdrop:bg-black/60"
      >
        <h2 id="upgrade-title" className="font-display text-2xl">Treci la Premium</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink/70">
          Scrie-ne pe email și activăm Premium pe nunta voastră. Datele și invitații rămân
          exact cum sunt; se deblochează doar modulele financiare.
        </p>
        <ul className="mt-4 space-y-2 text-sm text-ink/75">
          {INCLUDED.map(({ title }) => (
            <li key={title} className="flex items-center gap-2">
              <span aria-hidden className="size-1.5 rounded-full bg-gold" />
              {title}
            </li>
          ))}
        </ul>
        <div className="mt-6 flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Închide</Button>
          <Button asChild className="bg-ink text-sea hover:bg-ink/85">
            <ContactLink compose={links.compose} mailto={links.mailto}>
              Scrie-ne pe email
            </ContactLink>
          </Button>
        </div>
      </dialog>
    </section>
  );
}
