"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";

import { AsciiHeroBanner } from "@/components/landing/ascii-hero-banner";

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
        border: "1px solid rgba(217,104,32,0.45)",
        background: "rgba(217,104,32,0.08)",
        color: "#FA7E23",
        cursor: "pointer",
      }}
    >
      <svg width="16" height="22" viewBox="0 0 16 22" fill="none" aria-hidden="true">
        <defs>
          <linearGradient id="scroll-btn-trail" x1="8" y1="0" x2="8" y2="14" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FA7E23" stopOpacity="0" />
            <stop offset="100%" stopColor="#FA7E23" stopOpacity="1" />
          </linearGradient>
        </defs>
        <line x1="8" y1="0" x2="8" y2="14" stroke="url(#scroll-btn-trail)" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M3 12l5 6 5-6" stroke="#FA7E23" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" fill="none" />
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

      {/* ASCII banner — true full-bleed, no horizontal padding */}
      <div className="nyx-rise nyx-rise-delay-1 w-full mt-16 flex-1 min-h-0">
        <AsciiHeroBanner contained />
      </div>

      {/* Bottom row — centered */}
      <div className="nyx-rise nyx-rise-delay-2 w-full px-5 sm:px-7 pt-10 pb-16 flex justify-center">
        <div className="text-center">

          {/* Centered text block */}
          {/* <div className="min-w-0">
            <h1 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "clamp(22px, 3vw, 36px)", fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 1.5 }}>
              <span style={{ display: "block", color: "#FA7E23" }}>Settle in the dark</span>
              <span style={{ display: "block", color: "rgba(174,172,176,0.45)", marginTop: "6px" }}>Prove in the light</span>
            </h1>
            <p className="mt-3"
              style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11.5px", lineHeight: 1.8, color: "rgba(174,172,176,0.5)" }}>
              Private orderbook on Solana
            </p>
          </div> */}

          {/* buttons removed */}
          <div className="flex flex-col gap-2 shrink-0 sm:items-end self-end">
            <Link
              href="/landing"
              className="inline-flex items-center justify-center px-6 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] transition"
            >
            </Link>
            {/* <Link
              href="/architecture"
              className="inline-flex items-center justify-center px-6 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] transition"
              style={{ fontFamily: "'JetBrains Mono', monospace", border: "1px solid rgba(255,255,255,0.1)", color: "#aeacb0", borderRadius: "2px", minWidth: "160px" }}
            >
              Architecture
            </Link> */}
          </div>

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
