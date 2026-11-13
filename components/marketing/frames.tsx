import type { ReactNode } from "react";

/**
 * Presentational shells around the real product screenshots in public/previews.
 * The pictures are pre-cut AVIF/WebP at two widths, so plain <picture> beats an
 * image optimizer here: no extra request, no client JavaScript.
 */

type ScreenshotProps = {
  /** Basename in public/previews, including the size suffix in the script. */
  name: string;
  alt: string;
  sizes: string;
  className?: string;
  /** Loading hint for the hero image, which is above the fold. */
  eager?: boolean;
};

export function Screenshot({ name, alt, sizes, className = "", eager = false }: ScreenshotProps) {
  const phone = name.includes("telefon");
  const widths = phone ? [520, 780] : [1200, 2000];
  const base = `/previews/${name}`;

  return (
    <picture>
      <source
        type="image/avif"
        srcSet={widths.map((width) => `${base}-${width}.avif ${width}w`).join(", ")}
        sizes={sizes}
      />
      <source
        type="image/webp"
        srcSet={widths.map((width) => `${base}-${width}.webp ${width}w`).join(", ")}
        sizes={sizes}
      />
      <img
        src={`${base}-${widths[0]}.webp`}
        alt={alt}
        width={phone ? 390 : 1440}
        height={phone ? 844 : 900}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        fetchPriority={eager ? "high" : "auto"}
        className={`block h-auto w-full ${className}`}
      />
    </picture>
  );
}

/** A laptop browser window: the screenshot sits behind a thin fake chrome bar. */
export function BrowserFrame({
  url,
  children,
  className = "",
}: {
  url: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-[1.1rem] border border-ink/15 bg-paper shadow-[0_40px_90px_-50px_rgba(44,51,37,0.65)] sm:rounded-[1.4rem] ${className}`}
    >
      <div aria-hidden className="flex items-center gap-1.5 border-b border-ink/10 bg-mist/70 px-3 py-2 sm:px-4 sm:py-2.5">
        <span className="size-2 rounded-full bg-ink/15 sm:size-2.5" />
        <span className="size-2 rounded-full bg-ink/15 sm:size-2.5" />
        <span className="size-2 rounded-full bg-ink/15 sm:size-2.5" />
        <span className="mx-auto hidden max-w-[60%] truncate rounded-full bg-paper/80 px-3 py-0.5 text-[11px] text-ink/50 sm:block">
          {url}
        </span>
        <span aria-hidden className="ml-auto size-2 sm:hidden" />
      </div>
      <div className="bg-sea">{children}</div>
    </div>
  );
}

/** A phone outline, for the screens that are meant to be seen in hand. */
export function PhoneFrame({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`overflow-hidden rounded-[1.7rem] border border-ink/20 bg-ink/85 p-1.5 shadow-[0_30px_60px_-30px_rgba(44,51,37,0.7)] sm:rounded-[2rem] sm:p-2 ${className}`}
    >
      <div className="overflow-hidden rounded-[1.25rem] bg-sea sm:rounded-[1.5rem]">{children}</div>
    </div>
  );
}
