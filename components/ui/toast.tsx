"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

export type ToastTone = "error" | "success";
export type ToastState = { id: number; message: string; tone: ToastTone } | null;

/**
 * Tiny non-blocking notification used when an optimistic update is rolled back.
 * It never blocks the page and disappears on its own after four seconds.
 */
export function useToast() {
  const [toast, setToast] = useState<ToastState>(null);
  const idRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    setToast(null);
  }, []);

  const show = useCallback((message: string, tone: ToastTone = "error") => {
    if (timerRef.current) clearTimeout(timerRef.current);
    idRef.current += 1;
    setToast({ id: idRef.current, message, tone });
    timerRef.current = setTimeout(() => setToast(null), 4000);
  }, []);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  return { toast, show, dismiss };
}

export function Toast({ toast, onDismiss }: { toast: ToastState; onDismiss: () => void }) {
  if (!toast) return null;
  const error = toast.tone === "error";
  return (
    <div
      key={toast.id}
      role={error ? "alert" : "status"}
      aria-live={error ? "assertive" : "polite"}
      className={`glass-bar fixed bottom-4 right-4 z-50 flex max-w-sm items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-xl ${
        error ? "border-red-700/35 text-red-800" : "border-gold/45 text-ink"
      }`}
    >
      <p className="flex-1">{toast.message}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Închide notificarea"
        className="-mr-1 rounded p-1 text-ink/60 transition-colors duration-150 hover:bg-ink/10 hover:text-ink"
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
