"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendContactRequest } from "@/app/contact/actions";
import { CONTACT_PERIODS } from "@/lib/contact-message";
import { CONTACT_EMAIL } from "@/lib/marketing";

/**
 * The offer request, filled in on the page instead of in a mail app.
 *
 * Everything is unauthenticated and there is no database write: the action
 * validates the fields and sends the text to the owner's Gmail, with the
 * visitor's address as Reply-To. If sending fails, the email address stays in
 * sight as a fallback.
 */

const field =
  "flex w-full rounded-md border border-ink/20 bg-ink/5 px-3 text-base text-ink placeholder:text-ink/40 transition-[border-color,box-shadow,background-color] duration-200 ease-out hover:border-ink/35 focus-visible:border-gold/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/30 disabled:cursor-not-allowed disabled:opacity-50";

export function ContactForm() {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const submit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);

    setError(null);
    start(async () => {
      const result = await sendContactRequest({
        name: String(data.get("name") ?? ""),
        email: String(data.get("email") ?? ""),
        phone: String(data.get("phone") ?? ""),
        period: String(data.get("period") ?? ""),
        message: String(data.get("message") ?? ""),
        website: String(data.get("website") ?? ""),
      });

      if (result.ok) {
        form.reset();
        setSent(true);
        return;
      }
      setError(result.error);
    });
  };

  if (sent) {
    return (
      <div className="rounded-2xl bg-paper p-7 text-ink shadow-[0_18px_40px_-32px_rgba(0,0,0,0.6)] sm:p-8">
        <p className="font-display text-2xl">Mulțumim!</p>
        <p className="mt-3 leading-relaxed text-ink/70">
          Am primit mesajul. Vă răspundem pe email în cel mult o zi lucrătoare.
        </p>
        <Button type="button" variant="outline" className="mt-6" onClick={() => setSent(false)}>
          Trimite alt mesaj
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-2xl bg-paper p-6 text-ink shadow-[0_18px_40px_-32px_rgba(0,0,0,0.6)] sm:p-8"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="contact-name">Nume</Label>
          <Input
            id="contact-name"
            name="name"
            required
            minLength={2}
            maxLength={80}
            autoComplete="name"
            placeholder="Ana și Ștefan"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-email">Email</Label>
          <Input
            id="contact-email"
            name="email"
            type="email"
            required
            maxLength={160}
            autoComplete="email"
            placeholder="ana@exemplu.ro"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-phone">
            Telefon <span className="font-normal text-ink/45">(opțional)</span>
          </Label>
          <Input
            id="contact-phone"
            name="phone"
            type="tel"
            maxLength={30}
            autoComplete="tel"
            placeholder="07xx xxx xxx"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contact-period">Perioada dorită</Label>
          <select id="contact-period" name="period" defaultValue="" className={`${field} h-10`}>
            <option value="">Alege o perioadă</option>
            {CONTACT_PERIODS.map((period) => (
              <option key={period} value={period}>
                {period}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <Label htmlFor="contact-message">Mesaj</Label>
        <textarea
          id="contact-message"
          name="message"
          required
          minLength={10}
          maxLength={2000}
          rows={5}
          placeholder="Ce invitație aveți în minte? Culori, decor, data nunții dacă ați stabilit-o."
          className={`${field} min-h-28 py-2.5 leading-relaxed`}
        />
      </div>

      {/* Bots fill this; people never see it. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label htmlFor="contact-website">Site</label>
        <input id="contact-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm leading-relaxed text-red-700">
          {error}
        </p>
      )}

      <Button
        type="submit"
        size="lg"
        disabled={pending}
        className="mt-5 w-full bg-ink text-sea"
      >
        <Send aria-hidden="true" /> {pending ? "Se trimite…" : "Trimite mesajul"}
      </Button>

      <p className="mt-4 text-xs leading-relaxed text-ink/55">
        Vă scriem doar despre cererea voastră. Detalii în{" "}
        <Link
          href="/confidentialitate"
          className="underline decoration-gold/40 underline-offset-4 transition-colors hover:text-ink"
        >
          politica de confidențialitate
        </Link>
        . Dacă preferați emailul direct:{" "}
        <span className="select-all text-ink/75">{CONTACT_EMAIL}</span>.
      </p>
    </form>
  );
}
