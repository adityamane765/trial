"use client";

import { useEffect, useRef } from "react";

import { LandingHeroCopy } from "@/components/landing/hero-copy";

function PerspectiveGrid() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const DPR = window.devicePixelRatio || 1;

    const resize = () => {
      const w = canvas.parentElement?.offsetWidth ?? window.innerWidth;
      const h = 180;
      canvas.width = w * DPR;
      canvas.height = h * DPR;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      draw(w, h);
    };

    function draw(w: number, h: number) {
      ctx.clearRect(0, 0, w, h);

      const vpX = w / 2;
      const vpY = 0;
      const LINE_COUNT = 18;
      // origin row: 1px above canvas bottom so lines sit on top of the section border
      const originY = h - 1;

      // horizontal line at the origin — merges visually with the section's border-b
      ctx.beginPath();
      ctx.moveTo(0, originY);
      ctx.lineTo(w, originY);
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 1;
      ctx.stroke();

      for (let i = 0; i <= LINE_COUNT; i++) {
        const t = i / LINE_COUNT;
        const baseX = t * w;

        const grad = ctx.createLinearGradient(baseX, originY, vpX, vpY);
        grad.addColorStop(0,    "rgba(255,255,255,0.15)");
        grad.addColorStop(0.25, "rgba(255,255,255,0.06)");
        grad.addColorStop(0.65, "rgba(255,255,255,0)");
        grad.addColorStop(1,    "rgba(255,255,255,0)");

        ctx.beginPath();
        ctx.moveTo(baseX, originY);
        ctx.lineTo(vpX, vpY);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 0.8;
        ctx.stroke();
      }
    }

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none block w-full"
      style={{ display: "block" }}
    />
  );
}

function ScrollDownButton() {
  return (
    <button
      onClick={() => {
        document.getElementById("landing-content")?.scrollIntoView({ behavior: "smooth" });
      }}
      aria-label="Scroll down"
      className="flex items-center justify-center transition-opacity hover:opacity-70"
      style={{
        width: 40,
        height: 40,
        borderRadius: "50%",
        border: "1px solid oklch(0.62 0.14 260 / 0.45)",
        background: "var(--nyx-accent-soft)",
        color: "var(--nyx-accent)",
        cursor: "pointer",
      }}
    >
      <svg width="16" height="22" viewBox="0 0 16 22" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="scroll-btn-trail" x1="8" y1="0" x2="8" y2="14" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="var(--nyx-accent)" stopOpacity="0" />
            <stop offset="100%" stopColor="var(--nyx-accent)" stopOpacity="1" />
          </linearGradient>
        </defs>
        <line x1="8" y1="0" x2="8" y2="14" stroke="url(#scroll-btn-trail)" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M3 12l5 6 5-6" stroke="var(--nyx-accent)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </svg>
    </button>
  );
}

export function LandingHero() {
  return (
    <section
      className="relative isolate border-b"
      style={{ borderColor: "rgba(255,255,255,0.06)", height: "calc(100dvh - 44px)", display: "flex", flexDirection: "column" }}
    >

      {/* Hero copy — replaces ASCII banner */}
      <div className="nyx-rise nyx-rise-delay-1 relative flex w-full flex-1 min-h-0 flex-col justify-center pr-5 pl-12 sm:pr-7 sm:pl-16 lg:pr-12 lg:pl-24 xl:pl-32">
        <div
          className="pointer-events-none absolute inset-0 nyx-grid opacity-60"
          aria-hidden
        />
        <div className="relative pt-8 pb-24 sm:pt-12">
          <LandingHeroCopy />
        </div>
      </div>

      {/* Perspective grid — sits at the very bottom of the hero, lines radiate from the border */}
      <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
        <PerspectiveGrid />
      </div>

      {/* Scroll-down button */}
      <div className="absolute bottom-17 left-0 right-0 flex justify-center">
        <ScrollDownButton />
      </div>
    </section>
  );
}
