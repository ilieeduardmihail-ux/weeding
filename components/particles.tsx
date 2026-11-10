"use client";

import { useEffect, useRef } from "react";

type Particle = {
  x: number;
  y: number;
  radius: number;
  speed: number;
  phase: number;
  twinkle: number;
  gold: boolean;
};

const MAX_PARTICLES = 48;

/**
 * Slow gold and dusty-rose dust behind every page, echoing the foil and the
 * flowers on the printed invitation. Canvas instead of DOM nodes,
 * a hard cap on the particle budget, fewer particles on small screens, and the
 * loop pauses while the tab is hidden or the canvas is off-screen.
 */
export function Particles({ count = MAX_PARTICLES }: { count?: number }) {
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
    let running = false;
    let inView = true;

    const make = (): Particle => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 0.6 + Math.random() * 1.8,
      speed: 4 + Math.random() * 12, // px per second, upwards
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

      // Phones get a much lighter field so scrolling and the admin stay smooth.
      const density =
        width < 640 ? 12 : width < 1024 ? 24 : Math.min(count, MAX_PARTICLES);

      particles = Array.from({ length: density }, make);
      if (reduced) paint(0);
    };

    const paint = (time: number) => {
      ctx.clearRect(0, 0, width, height);
      for (const p of particles) {
        if (!reduced) {
          p.y -= p.speed * (1 / 60);
          p.x += Math.sin((time / 1000) * 0.35 + p.phase) * 0.1;
          if (p.y < -6) {
            p.y = height + 6;
            p.x = Math.random() * width;
          }
          if (p.x < -6) p.x = width + 6;
          if (p.x > width + 6) p.x = -6;
        }

        const alpha = reduced
          ? 0.42
          : 0.16 + 0.4 * (0.5 + 0.5 * Math.sin((time / 1600) * p.twinkle + p.phase));
        const color = p.gold
          ? `rgba(169, 133, 63, ${alpha})`
          : `rgba(176, 121, 132, ${alpha * 0.85})`;

        // A second, larger low-alpha circle reads as a soft glow and is far
        // cheaper than canvas shadowBlur on every frame.
        if (p.radius > 2.05) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
          ctx.fillStyle = p.gold
            ? `rgba(169, 133, 63, ${alpha * 0.14})`
            : `rgba(176, 121, 132, ${alpha * 0.12})`;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      }
    };

    const loop = (time: number) => {
      if (!running) return;
      paint(time);
      frame = requestAnimationFrame(loop);
    };

    const start = () => {
      if (reduced || running || document.hidden || !inView) return;
      running = true;
      frame = requestAnimationFrame(loop);
    };

    const stop = () => {
      running = false;
      cancelAnimationFrame(frame);
    };

    const onVisibility = () => {
      if (document.hidden) stop();
      else start();
    };

    const observer =
      typeof IntersectionObserver === "undefined"
        ? null
        : new IntersectionObserver((entries) => {
            inView = entries.some((entry) => entry.isIntersecting);
            if (inView) start();
            else stop();
          });
    observer?.observe(canvas);

    resize();
    window.addEventListener("resize", resize);
    document.addEventListener("visibilitychange", onVisibility);

    if (reduced) {
      paint(0); // a static starfield, no motion
    } else {
      // Start on the first painted frame: if the tab opens in the background,
      // the motion waits instead of running off-screen.
      frame = requestAnimationFrame(start);
    }

    return () => {
      stop();
      cancelAnimationFrame(frame);
      observer?.disconnect();
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVisibility);
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
