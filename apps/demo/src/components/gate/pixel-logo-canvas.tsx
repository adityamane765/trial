"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { NyxMark } from "@/components/brand/nyx-mark";

/* -------------------------------------------------------------------------- */
/* GRID DIMENSIONS                                                            */
/* -------------------------------------------------------------------------- */

const COLS = 30;
const ROWS = 20;

/* -------------------------------------------------------------------------- */
/* PIXEL FONT — 5×7 bitmap — COMMENTED OUT, replaced by typed wordmark       */
/* -------------------------------------------------------------------------- */

// const PIXEL_FONT: Record<string, number[]> = {
//   d: [0b00010, 0b00010, 0b01110, 0b10010, 0b10010, 0b10010, 0b01110],
//   a: [0b00000, 0b00000, 0b01110, 0b00010, 0b01110, 0b10010, 0b01110],
//   r: [0b00000, 0b00000, 0b10110, 0b11001, 0b10000, 0b10000, 0b10000],
//   k: [0b10000, 0b10000, 0b10100, 0b11000, 0b10100, 0b10010, 0b10001],
//   n: [0b00000, 0b00000, 0b11010, 0b10110, 0b10010, 0b10010, 0b10010],
//   y: [0b00000, 0b00000, 0b10010, 0b10010, 0b01110, 0b00010, 0b01100],
//   x: [0b00000, 0b00000, 0b10001, 0b01010, 0b00100, 0b01010, 0b10001],
// };
//
// function buildWordPixels(word: string, darkSplit: number): Array<{ x: number; y: number; dark: boolean }> {
//   const LETTER_W = 5;
//   const LETTER_H = 7;
//   const KERNING = 1;
//   const pixels: Array<{ x: number; y: number; dark: boolean }> = [];
//   let cursorX = 0;
//   for (let li = 0; li < word.length; li++) {
//     const ch = word[li];
//     const bitmap = PIXEL_FONT[ch];
//     if (!bitmap) { cursorX += LETTER_W + KERNING; continue; }
//     const isDark = li >= darkSplit;
//     for (let row = 0; row < LETTER_H; row++) {
//       for (let bit = 0; bit < LETTER_W; bit++) {
//         if (bitmap[row] & (1 << (LETTER_W - 1 - bit))) {
//           pixels.push({ x: cursorX + bit, y: row, dark: isDark });
//         }
//       }
//     }
//     cursorX += LETTER_W + KERNING;
//   }
//   return pixels;
// }
//
// const WORD_PIXELS = buildWordPixels("darknyx", 4);

/* -------------------------------------------------------------------------- */
/* STATIC SVG MARK — top-left header, no animation                           */
/* -------------------------------------------------------------------------- */

function NyxStaticMark() {
  const dots: [number, number][] = [
    [10,0],[12,0],[14,0],[16,0],
    [8,2],[10,2],[12,2],[14,2],[16,2],[18,2],
    [6,4],[8,4],[10,4],[12,4],[14,4],[16,4],[18,4],[20,4],
    [6,6],[8,6],[10,6],[12,6],[14,6],[16,6],[18,6],[20,6],
    [2,10],[4,10],[6,10],[8,10],[10,10],[12,10],[14,10],[16,10],[18,10],[20,10],[22,10],[24,10],
    [2,14],[4,14],[6,14],[8,14],[10,14],[12,14],
  ];
  return (
    <svg width="28" height="18" viewBox="0 0 28 18" fill="none" aria-hidden="true">
      {dots.map(([x, y], i) => (
        <rect key={i} x={x} y={y} width={2} height={2}
          fill={y <= 6 ? "#FA7E23" : y === 10 ? "#b84e10" : "#8a3808"}
          opacity={y <= 4 ? 0.9 : y === 6 ? 0.75 : y === 10 ? 0.65 : 0.45}
        />
      ))}
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/* MAIN COMPONENT                                                             */
/* -------------------------------------------------------------------------- */

interface SvgLayout {
  originX: number; originY: number;
  gridW: number; gridH: number;
  wordFontSize: number; wordTop: number;
}

export function PixelLogoCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const router = useRouter();
  const animRef = useRef<number>(0);
  const layoutRef = useRef({ originX: 0, originY: 0, CELL: 0, PIXEL: 0 });
  const [svgLayout, setSvgLayout] = useState<SvgLayout | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    if (!ctx) return;
    const cvs: HTMLCanvasElement = canvas;

    let W = window.innerWidth;
    let H = window.innerHeight;
    cvs.width = W;
    cvs.height = H;

    const PIXEL = Math.min(Math.floor(Math.min(W, H) / 60), 7);
    const GAP = 1;
    const CELL = PIXEL + GAP;
    const gridW = COLS * CELL;
    const gridH = ROWS * CELL;

    // Typed wordmark: size it so "darknyx" (7 chars, Space Grotesk 600)
    // spans approximately gridW. Empirically ~0.6 ch/px ratio at weight 600.
    const wordFontSize = Math.round(gridW / 4.2);

    const gap = CELL * 0.25; // reduced gap between logo and wordmark
    const totalH = gridH + gap + wordFontSize * 1.1;

    const originX = (W - gridW) / 2;
    const originY = (H - totalH) / 2;
    layoutRef.current = { originX, originY, CELL, PIXEL };

    const wordTop = originY + gridH + gap;
    setSvgLayout({ originX, originY, gridW, gridH, wordFontSize, wordTop });

    function draw() {
      if (cvs.width !== window.innerWidth || cvs.height !== window.innerHeight) {
        W = window.innerWidth; H = window.innerHeight;
        cvs.width = W; cvs.height = H;
      }

      // solid dark background
      ctx.fillStyle = "#050608";
      ctx.fillRect(0, 0, W, H);

      // vertical grid lines
      ctx.lineWidth = 1;
      const gs = CELL;
      for (let gx = ((originX % gs) + gs) % gs; gx < W; gx += gs) {
        ctx.strokeStyle = "rgba(255,255,255,0.08)";
        ctx.beginPath(); ctx.moveTo(Math.round(gx) + 0.5, 0); ctx.lineTo(Math.round(gx) + 0.5, H); ctx.stroke();
      }

      // pixel wordmark drawing removed — see commented-out PIXEL_FONT above

      animRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, []);

  return (
    <div className="fixed inset-0 bg-[#050608]">
      {/* HEADER */}
      <header className="absolute top-0 left-0 right-0 z-10 flex items-center px-8 py-5">
        <div className="flex items-center gap-2.5 select-none">
          <NyxStaticMark />
          <span
            className="text-[13px] font-medium tracking-[0.06em]"
            style={{ fontFamily: "'JetBrains Mono', monospace", color: "#c8b898" }}
          >
            DarkNyx
          </span>
        </div>
        <span
          className="absolute left-1/2 -translate-x-1/2 text-[11px] uppercase tracking-[0.22em] pointer-events-none"
          style={{ fontFamily: "'JetBrains Mono', monospace", color: "rgba(250,180,100,0.95)" }}
        >
          Click on logo to enter DarkNyx
        </span>
      </header>

      {/* CANVAS */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        aria-label="DarkNyx — click logo to enter"
      />

      {/* SVG LOGO OVERLAY */}
      {svgLayout && (
        <button
          onClick={() => router.push("/landing")}
          style={{
            position: "absolute",
            left: "50%",
            top: svgLayout.originY + svgLayout.gridH / 2,
            transform: "translate(-50%, -50%)",
            background: "none",
            border: "none",
            padding: 0,
            cursor: "pointer",
          }}
          aria-label="Enter DarkNyx"
        >
          <NyxMark
            size={Math.min(svgLayout.gridW, svgLayout.gridH)}
            style={{ color: "#FA7E23" }}
          />
        </button>
      )}

      {/* TYPED WORDMARK — Space Grotesk, design-system font */}
      {svgLayout && (
        <div
          style={{
            position: "absolute",
            top: svgLayout.wordTop,
            left: "50%",
            transform: "translateX(-50%)",
            fontFamily: "'Space Grotesk', 'Inter', system-ui, sans-serif",
            fontSize: svgLayout.wordFontSize,
            lineHeight: 1,
            letterSpacing: "-0.03em",
            userSelect: "none",
            pointerEvents: "none",
            whiteSpace: "nowrap",
          }}
        >
          <span style={{ fontWeight: 600, color: "#FA7E23" }}>dark</span>
          <span style={{ fontWeight: 400, color: "#7a3810" }}>nyx</span>
        </div>
      )}
    </div>
  );
}
