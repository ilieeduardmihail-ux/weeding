"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  radius: number;
  speed: number;
  drift: number;
  phase: number;
  twinkle: number;
  gold: boolean;
};

/**
 * Slow golden and violet particles behind the page. Canvas instead of dozens of
 * DOM nodes, and it starts only when the browser is actually painting frames.
 */
export function Particles({ count = 70 }: { count?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let frame = 0;
    let cancelled = false;

    const make = (): Particle => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 0.6 + Math.random() * 1.9,
      speed: 6 + Math.random() * 18, // px per second, upwards
      drift: 4 + Math.random() * 14,
      phase: Math.random() * Math.PI * 2,
      twinkle: 0.4 + Math.random() * 0.9,
      gold: Math.random() < 0.55,
    });

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      particles = Array.from({ length: count }, make);
    };

    const paint = (time: number) => {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        if (!reduced) {
          const seconds = time / 1000;
          p.y -= p.speed * (1 / 60);
          p.x += Math.sin(seconds * 0.4 + p.phase) * 0.12;
          if (p.y < -6) {
            p.y = height + 6;
            p.x = Math.random() * width;
          }
          if (p.x < -6) p.x = width + 6;
          if (p.x > width + 6) p.x = -6;
        }
        const alpha = reduced ? 0.45 : 0.18 + 0.42 * (0.5 + 0.5 * Math.sin(time / 1400 * p.twinkle + p.phase));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = p.gold
          ? `rgba(217, 180, 106, ${alpha})`
          : `rgba(186, 142, 214, ${alpha * 0.85})`;
        if (p.radius > 1.9) {
          ctx.shadowBlur = 10;
          ctx.shadowColor = p.gold ? "rgba(217, 180, 106, 0.55)" : "rgba(186, 142, 214, 0.45)";
        } else {
          ctx.shadowBlur = 0;
        }
        ctx.fill();
      }
      ctx.shadowBlur = 0;
    };

    const loop = (time: number) => {
      if (cancelled) return;
      paint(time);
      frame = requestAnimationFrame(loop);
    };

    resize();
    window.addEventListener("resize", resize);

    if (reduced) {
      paint(0); // a static starfield, no motion
    } else {
      // Start on the first painted frame: if the tab opens in the background,
      // the motion waits instead of running off-screen.
      frame = requestAnimationFrame(loop);
    }

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, [count]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 opacity-80"
    />
  );
}
