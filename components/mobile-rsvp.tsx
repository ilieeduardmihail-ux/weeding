export function MobileRsvp() {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-ink/15 bg-sea/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur sm:hidden">
      <a
        href="#rsvp"
        className="flex min-h-11 w-full items-center justify-center rounded-full bg-ink px-6 py-3 text-sm font-medium text-sea transition hover:bg-ink/85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
      >
        Invitat
      </a>
    </div>
  );
}
