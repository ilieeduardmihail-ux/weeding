"use client";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

/**
 * Fade-in-up on scroll, in plain CSS (see `.reveal` in globals.css). One
 * IntersectionObserver per block flips the class the first time the block gets
 * close to the viewport; the transition then does the rest. No animation
 * library is shipped for this, and a visitor who asks for reduced motion sees
 * the content immediately.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 24,
  x = 0,
  amount = 0.2,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  x?: number;
  amount?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (typeof IntersectionObserver === "undefined") {
      // Ancient browser: show the block straight away, imperatively, so no
      // state update happens inside the effect body.
      element.classList.add("is-visible");
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        setShown(true);
        observer.disconnect();
      },
      // A block taller than the screen would never reach a high threshold.
      { threshold: Math.min(amount, 0.5) },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [amount]);

  return (
    <div
      ref={ref}
      className={shown ? `reveal is-visible${className ? ` ${className}` : ""}` : `reveal${className ? ` ${className}` : ""}`}
      style={
        {
          "--reveal-x": `${x}px`,
          "--reveal-y": `${y}px`,
          "--reveal-delay": `${delay}s`,
        } as CSSProperties
      }
    >
      {children}
    </div>
  );
}
