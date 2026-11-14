"use client";

import { useSyncExternalStore } from "react";
import { Monitor, Moon, Sun } from "lucide-react";

type Mode = "auto" | "light" | "dark";

const MODES: Mode[] = ["auto", "light", "dark"];

const LABEL: Record<Mode, string> = {
  auto: "Automată",
  light: "Luminoasă",
  dark: "Întunecată",
};

const ICON = { auto: Monitor, light: Sun, dark: Moon } as const;

const STORAGE_KEY = "theme";

/** Same rule the anti-flash script in the root layout uses. */
function isDark(mode: Mode) {
  return (
    mode === "dark" ||
    (mode === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches)
  );
}

function apply(mode: Mode) {
  document.documentElement.dataset.theme = isDark(mode) ? "dark" : "light";
}

function readStored(): Mode {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === "light" || stored === "dark" || stored === "auto") return stored;
  } catch {
    // Private mode can refuse the read; the system setting still works.
  }
  return "auto";
}

const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

/**
 * The choice lives in localStorage, which React does not see. `storage` covers
 * other tabs; the media query covers a system switch while on "auto"; the
 * toggle emits for the tab it happened in.
 */
function subscribe(listener: () => void) {
  const query = window.matchMedia("(prefers-color-scheme: dark)");
  const onSystemChange = () => {
    apply(readStored());
    listener();
  };

  listeners.add(listener);
  window.addEventListener("storage", listener);
  query.addEventListener("change", onSystemChange);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
    query.removeEventListener("change", onSystemChange);
  };
}

/**
 * Light / dark / follow-the-system switch for the marketing pages. The choice
 * is remembered and written on <html data-theme>, where the CSS only reacts
 * inside `.marketing` — invitations and admin panels stay exactly as designed.
 */
export function ThemeToggle({ className = "" }: { className?: string }) {
  const mode = useSyncExternalStore(subscribe, readStored, () => "auto" as Mode);

  const cycle = () => {
    const next = MODES[(MODES.indexOf(mode) + 1) % MODES.length];
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Not being able to remember the choice is not a reason to fail.
    }
    apply(next);
    emit();
  };

  const Icon = ICON[mode];
  const label = `Tema: ${LABEL[mode]}. Apasă pentru a schimba.`;

  return (
    <button
      type="button"
      onClick={cycle}
      aria-label={label}
      title={label}
      className={`inline-flex size-9 items-center justify-center rounded-full border border-ink/15 text-ink/70 transition-colors duration-200 ease-out hover:border-gold/50 hover:text-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${className}`}
    >
      <Icon className="size-4" aria-hidden />
    </button>
  );
}
