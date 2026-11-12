"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { Copy, Download, ImagePlus, MessageCircle, Search, Trash2 } from "lucide-react";
import type { AdminData } from "@/lib/admin-data";
import { notifyAdminDataChanged } from "@/lib/admin-data";
import { useAdminData } from "@/components/admin/admin-data";
import { AdminSectionSkeleton } from "@/components/admin/admin-section-skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Toast, useToast } from "@/components/ui/toast";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import {
  DEFAULT_INVITE_MESSAGE,
  MESSAGE_PLACEHOLDERS,
  PUBLIC_SITE_URL,
  renderInviteMessage,
  whatsappHref,
} from "@/lib/message-template";
import { saveInviteMessage, savePhones, uploadInvitationImage, removeInvitationImage, type PhoneEntry } from "@/app/admin/messages/actions";

type Source = "all" | "rsvp" | "guest";

type Recipient = {
  key: string;
  kind: "rsvp" | "guest";
  id: string;
  name: string;
  phone: string | null;
};

const SOURCE_LABEL: Record<Recipient["kind"], string> = {
  rsvp: "RSVP",
  guest: "Importat",
};

const normalize = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

/** Only phones can hand a file to WhatsApp; desktop share sheets just ask to install it. */
function isPhone() {
  if (typeof navigator === "undefined") return false;
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export default function MessagesPage() {
  const { data } = useAdminData();
  if (!data) return <AdminSectionSkeleton />;
  return <Messages data={data} />;
}

function Messages({ data }: { data: AdminData }) {
  const { toast, show, dismiss } = useToast();
  const textarea = useRef<HTMLTextAreaElement>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const [template, setTemplate] = useState(data.settings.invite_message || DEFAULT_INVITE_MESSAGE);
  const [query, setQuery] = useState("");
  const q = useDebouncedValue(query);
  const [source, setSource] = useState<Source>("all");
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [phones, setPhones] = useState<Record<string, string>>({});
  const [savingMessage, startMessage] = useTransition();
  const [savingPhones, startPhones] = useTransition();
  const [savingPhoto, startPhoto] = useTransition();
  const [photo, setPhoto] = useState<File | null>(null);
  // Instant feedback after upload, before the admin dataset refreshes.
  const [photoOverride, setPhotoOverride] = useState<string | null | undefined>(undefined);

  const photoUrl =
    photoOverride === undefined ? data.settings.invitation_image_url : photoOverride;

  // The proxy streams the file with an attachment header, so "Descarcă" really
  // saves it instead of opening a new tab (bucket URLs are cross-origin).
  const downloadHref =
    photoUrl && photoUrl.startsWith("http") ? "/invitatia-poza?download=1" : photoUrl;

  // Load the photo once, so the mobile share sheet opens instantly with the
  // file attached (awaiting a fetch inside the tap would lose the gesture).
  useEffect(() => {
    if (!photoUrl) return;
    let alive = true;
    const source = photoUrl.startsWith("data:") ? photoUrl : "/invitatia-poza";
    fetch(source, { cache: "no-store" })
      .then((response) => (response.ok ? response.blob() : null))
      .then((blob) => {
        if (!alive || !blob || blob.size === 0) return;
        const type = blob.type || "image/jpeg";
        const extension = type.includes("png") ? "png" : type.includes("webp") ? "webp" : "jpg";
        setPhoto(new File([blob], `invitatie.${extension}`, { type }));
      })
      .catch(() => {
        // Sharing still works without the file: the text opens in WhatsApp.
      });
    return () => {
      alive = false;
    };
  }, [photoUrl]);

  const recipients = useMemo<Recipient[]>(
    () =>
      [
        ...data.rsvps.map((row) => ({
          key: `rsvp:${row.id}`,
          kind: "rsvp" as const,
          id: row.id,
          name: row.name,
          phone: row.phone ?? null,
        })),
        ...data.importedGuests.map((row) => ({
          key: `guest:${row.id}`,
          kind: "guest" as const,
          id: row.id,
          name: row.name,
          phone: row.phone,
        })),
      ].sort((a, b) => a.name.localeCompare(b.name, "ro")),
    [data.rsvps, data.importedGuests],
  );

  const filtered = useMemo(() => {
    const needle = normalize(q);
    return recipients.filter(
      (row) =>
        (source === "all" || row.kind === source) &&
        (needle === "" || normalize(row.name).includes(needle)),
    );
  }, [recipients, source, q]);

  const selectedList = useMemo(
    () => recipients.filter((row) => selected.has(row.key)),
    [recipients, selected],
  );

  const phoneOf = (row: Recipient) => phones[row.key] ?? row.phone ?? "";

  const dirtyPhones = useMemo<PhoneEntry[]>(
    () =>
      recipients.flatMap((row) => {
        const value = phones[row.key];
        if (value === undefined || value.trim() === (row.phone ?? "").trim()) return [];
        return [{ kind: row.kind, id: row.id, phone: value.trim() } as PhoneEntry];
      }),
    [recipients, phones],
  );

  const setPhone = (key: string, value: string) =>
    setPhones((prev) => ({ ...prev, [key]: value }));

  const toggle = (key: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  const selectAllFiltered = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      const allSelected = filtered.length > 0 && filtered.every((row) => next.has(row.key));
      for (const row of filtered) {
        if (allSelected) next.delete(row.key);
        else next.add(row.key);
      }
      return next;
    });

  const insertToken = (token: string) => {
    const el = textarea.current;
    if (!el) {
      setTemplate((value) => value + token);
      return;
    }
    const start = el.selectionStart ?? template.length;
    const end = el.selectionEnd ?? start;
    setTemplate(template.slice(0, start) + token + template.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + token.length, start + token.length);
    });
  };

  const previewName = selectedList[0]?.name ?? "Ana Popescu";

  const saveMessage = () =>
    startMessage(async () => {
      const result = await saveInviteMessage(template);
      if (result.ok) {
        notifyAdminDataChanged();
        show("Mesajul a fost salvat.", "success");
      } else {
        show(result.error, "error");
      }
    });

  const saveNumbers = () =>
    startPhones(async () => {
      if (dirtyPhones.length === 0) return;
      const result = await savePhones(dirtyPhones);
      if (result.ok) {
        setPhones({});
        notifyAdminDataChanged();
        show("Numerele de telefon au fost salvate.", "success");
      } else {
        show(result.error, "error");
      }
    });

  const copy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      show(label, "success");
    } catch {
      show("Nu am putut copia. Selectează textul și copiază-l manual.", "error");
    }
  };

  const pickPhoto = (file: File | null) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      show("Poza trebuie să fie JPG, PNG sau WebP.", "error");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      show("Poza e prea mare. Alege una sub 8 MB.", "error");
      return;
    }
    startPhoto(async () => {
      const body = new FormData();
      body.append("file", file);
      const result = await uploadInvitationImage(body);
      if (result.ok) {
        setPhotoOverride(result.url);
        notifyAdminDataChanged();
        show("Poza invitației a fost salvată.", "success");
      } else {
        show(result.error, "error");
      }
      if (fileInput.current) fileInput.current.value = "";
    });
  };

  const removePhoto = () =>
    startPhoto(async () => {
      const result = await removeInvitationImage();
      if (result.ok) {
        setPhotoOverride(null);
        notifyAdminDataChanged();
        show("Poza a fost ștearsă.", "success");
      } else {
        show(result.error, "error");
      }
    });

  /**
   * WhatsApp drops the caption when an image is shared through the system share
   * sheet, so on phones we copy the text and ask the guest to paste it. Desktops
   * skip that sheet (it only offers to install WhatsApp) and open wa.me with the
   * text, where the downloaded photo can be dragged into the same message.
   */
  const sendMessage = async (row: Recipient, text: string) => {
    const href = whatsappHref(phoneOf(row), text);
    if (!href) {
      show("Adaugă un număr de telefon ca să trimiți mesajul.", "error");
      return;
    }

    const attachment = photoUrl ? photo : null;
    let canShareFile = false;
    if (attachment && isPhone()) {
      try {
        canShareFile = navigator.canShare?.({ files: [attachment] }) === true;
      } catch {
        canShareFile = false;
      }
    }

    if (attachment && canShareFile) {
      try {
        await navigator.clipboard.writeText(text);
      } catch {
        // Sharing still works; the text stays visible in the list.
      }
      try {
        await navigator.share({ files: [attachment], text });
        show("Poza a plecat spre WhatsApp. Textul e copiat — lipește-l ca descriere.", "success");
        return;
      } catch (error) {
        if ((error as Error).name === "AbortError") return;
      }
    }

    window.open(href, "_blank", "noreferrer");
    show(
      attachment
        ? "WhatsApp s-a deschis cu textul. Adaugă poza descărcată (butonul Descarcă poza)."
        : "Mesajul s-a deschis în WhatsApp.",
      "success",
    );
  };

  const withPhoto = (fullName: string) =>
    renderInviteMessage(template || DEFAULT_INVITE_MESSAGE, {
      fullName,
      settings: data.settings,
      siteUrl: `${PUBLIC_SITE_URL}/${data.slug}`,
      imageUrl: photoUrl?.startsWith("http")
        ? new URL(`/${data.slug}/invitatia-poza`, PUBLIC_SITE_URL).toString()
        : null,
    });

  const preview = withPhoto(previewName);

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="font-display text-4xl">Mesaje</h1>
      <p className="mt-2 max-w-2xl text-ink/70">
        Scrie o dată textul invitației, alege invitații și trimite fiecăruia mesajul
        personalizat pe WhatsApp. Numele, linkul de confirmare și poza invitației se
        completează singure.
      </p>

      <section className="glass mt-8 rounded-xl p-5">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-2xl">Poza invitației</h2>
            <p className="mt-1 max-w-md text-sm text-ink/60">
              Încarcă fotografia invitației tipărite. Ea apare ca previzualizare când
              trimiți linkul pe WhatsApp, iar butonul de trimitere o atașează direct pe
              telefon, acolo unde partajarea cu fișiere este disponibilă.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <input
                ref={fileInput}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="sr-only"
                aria-label="Alege poza invitației"
                onChange={(event) => pickPhoto(event.target.files?.[0] ?? null)}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInput.current?.click()}
                disabled={savingPhoto}
              >
                <ImagePlus className="size-4" />
                {savingPhoto ? "Se încarcă…" : photoUrl ? "Schimbă poza" : "Încarcă poza"}
              </Button>
              {photoUrl && (
                <>
                  <Button asChild variant="ghost" size="sm">
                    <a href={downloadHref ?? undefined} download="invitatie.jpg">
                      <Download className="size-4" /> Descarcă
                    </a>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removePhoto}
                    disabled={savingPhoto}
                  >
                    <Trash2 className="size-4" /> Șterge
                  </Button>
                </>
              )}
            </div>
            <p className="mt-3 text-xs text-ink/45">JPG, PNG sau WebP, până la 8 MB.</p>
          </div>

          {photoUrl ? (
            <a
              href={photoUrl}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 transition-transform duration-200 hover:-translate-y-0.5"
              aria-label="Deschide poza invitației"
            >
              <Image
                src={photoUrl}
                alt="Poza invitației"
                width={220}
                height={275}
                unoptimized
                className="max-h-56 w-auto rounded-lg border border-gold/40 object-contain shadow-lg shadow-black/15"
              />
            </a>
          ) : (
            <div className="flex h-40 w-32 shrink-0 items-center justify-center rounded-lg border border-dashed border-ink/25 text-ink/30">
              <ImagePlus className="size-6" aria-hidden />
            </div>
          )}
        </div>
      </section>

      <section className="glass mt-8 rounded-xl p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-2xl">Textul mesajului</h2>
          <span className="text-xs text-ink/50">{template.length} / 2000</span>
        </div>
        <p className="mt-1 text-sm text-ink/60">
          Poți folosi aceste etichete — se înlocuiesc automat pentru fiecare invitat.
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {MESSAGE_PLACEHOLDERS.map((placeholder) => (
            <button
              key={placeholder.token}
              type="button"
              onClick={() => insertToken(placeholder.token)}
              title={placeholder.label}
              className="rounded-full border border-ink/20 bg-ink/5 px-3 py-1 text-xs font-medium transition-colors duration-200 hover:border-gold/60 hover:bg-gold/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              {placeholder.token}
            </button>
          ))}
        </div>

        <textarea
          ref={textarea}
          value={template}
          onChange={(event) => setTemplate(event.target.value)}
          rows={6}
          maxLength={2000}
          aria-label="Textul mesajului"
          className="mt-4 w-full resize-y rounded-md border border-ink/20 bg-ink/5 px-3 py-2 text-base leading-relaxed text-ink transition-[border-color,box-shadow] duration-200 placeholder:text-ink/40 hover:border-ink/35 focus-visible:border-gold/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/30"
        />

        <div className="mt-4 rounded-lg border border-ink/10 bg-paper/60 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-ink/50">
            Previzualizare {selectedList.length > 0 ? `— ${selectedList[0].name}` : "— nume de exemplu"}
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink/85">{preview}</p>
        </div>

        <div className="mt-4 flex items-center justify-end">
          <Button type="button" onClick={saveMessage} disabled={savingMessage}>
            {savingMessage ? "Se salvează…" : "Salvează textul"}
          </Button>
        </div>
      </section>

      <section className="glass mt-8 rounded-xl p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl">Invitați</h2>
            <p className="mt-1 text-sm text-ink/60">
              {recipients.length} persoane cu nume în RSVP sau în lista importată.
            </p>
          </div>
          <span className="text-sm text-ink/70">{selected.size} selectați</span>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink/40" aria-hidden />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Caută un nume…"
              aria-label="Caută un invitat"
              className="pl-9"
            />
          </div>
          <div className="flex gap-1">
            {(["all", "rsvp", "guest"] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => setSource(value)}
                aria-pressed={source === value}
                className={`rounded-full px-3 py-1.5 text-sm transition-colors duration-200 ${
                  source === value
                    ? "bg-ink text-sea shadow-sm"
                    : "bg-ink/5 text-ink/70 hover:bg-ink/10"
                }`}
              >
                {value === "all" ? "Toți" : value === "rsvp" ? "RSVP" : "Importați"}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={selectAllFiltered}
            disabled={filtered.length === 0}
            className="text-sm text-ink/70 underline decoration-ink/30 underline-offset-4 transition-colors hover:text-ink disabled:opacity-50"
          >
            {filtered.length > 0 && filtered.every((row) => selected.has(row.key))
              ? "Deselectează rezultatele"
              : "Selectează rezultatele"}
          </button>
          {selected.size > 0 && (
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="text-sm text-ink/60 underline decoration-ink/30 underline-offset-4 transition-colors hover:text-ink"
            >
              Golește selecția
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <p className="mt-8 text-sm text-ink/60">Niciun invitat nu corespunde căutării.</p>
        ) : (
          <ul className="mt-3 max-h-[28rem] divide-y divide-ink/10 overflow-y-auto rounded-lg border border-ink/10">
            {filtered.map((row) => {
              const checked = selected.has(row.key);
              const phone = phoneOf(row);
              return (
                <li
                  key={row.key}
                  className={`flex flex-col gap-2 px-3 py-2.5 transition-colors duration-150 sm:flex-row sm:items-center sm:gap-4 ${
                    checked ? "bg-gold/10" : "hover:bg-ink/5"
                  }`}
                >
                  <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggle(row.key)}
                      className="size-4 shrink-0 accent-ink"
                    />
                    <span className="min-w-0">
                      <span className="block truncate">{row.name}</span>
                      <span className="text-[11px] uppercase tracking-wide text-ink/45">
                        {SOURCE_LABEL[row.kind]}
                      </span>
                    </span>
                  </label>
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(row.key, event.target.value)}
                    placeholder="+40 721 234 567"
                    aria-label={`Telefon pentru ${row.name}`}
                    className="h-9 w-full bg-paper/70 sm:w-52"
                  />
                </li>
              );
            })}
          </ul>
        )}

        {dirtyPhones.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-gold/10 px-4 py-3">
            <p className="text-sm text-ink/75">
              {dirtyPhones.length === 1
                ? "Un număr de telefon nesalvat."
                : `${dirtyPhones.length} numere de telefon nesalvate.`}
            </p>
            <Button type="button" onClick={saveNumbers} disabled={savingPhones}>
              {savingPhones ? "Se salvează…" : "Salvează telefoanele"}
            </Button>
          </div>
        )}
      </section>

      {selectedList.length > 0 && (
        <section className="glass mt-8 rounded-xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <h2 className="font-display text-2xl">Mesaje gata de trimis</h2>
              {photoUrl && (
                <p className="mt-1 max-w-xl text-xs text-ink/50">
                  Pe telefon, butonul copiază textul și trimite poza; lipești textul ca
                  descriere. Pe calculator, WhatsApp se deschide cu textul, iar poza o
                  adaugi din fișierul descărcat.
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              {photoUrl && (
                <a
                  href={downloadHref ?? undefined}
                  download="invitatie.jpg"
                  className="inline-flex items-center gap-1.5 text-sm text-ink/70 underline decoration-ink/30 underline-offset-4 transition-colors hover:text-ink"
                >
                  <Download className="size-4" /> Descarcă poza
                </a>
              )}
              <button
                type="button"
                onClick={() =>
                  copy(
                    selectedList
                      .map((row) => `${row.name}\n${withPhoto(row.name)}`)
                      .join("\n\n"),
                    "Toate mesajele au fost copiate.",
                  )
                }
                className="text-sm text-ink/70 underline decoration-ink/30 underline-offset-4 transition-colors hover:text-ink"
              >
                Copiază toate
              </button>
            </div>
          </div>

          <ul className="mt-4 space-y-3">
            {selectedList.map((row) => {
              const text = withPhoto(row.name);
              const href = whatsappHref(phoneOf(row), text);
              return (
                <li key={row.key} className="rounded-lg border border-ink/10 bg-paper/60 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-medium">{row.name}</p>
                      <p className="text-xs text-ink/50">
                        {phoneOf(row) || "Fără telefon — adaugă numărul mai sus."}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => copy(text, `Mesajul pentru ${row.name} a fost copiat.`)}
                      >
                        <Copy className="size-4" /> Copiază
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={() => sendMessage(row, text)}
                        disabled={!href}
                      >
                        <MessageCircle className="size-4" />
                        Trimite pe WhatsApp
                      </Button>
                    </div>
                  </div>
                  <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-ink/75">{text}</p>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <Toast toast={toast} onDismiss={dismiss} />
    </main>
  );
}
