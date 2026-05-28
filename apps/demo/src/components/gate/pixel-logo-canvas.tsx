"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { NyxMark, NyxLockup } from "@/components/brand/nyx-mark";

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

  const mouseRef = useRef({ x: -1000, y: -1000 });
  const ripplesRef = useRef<Array<{ x: number; y: number; radius: number; maxRadius: number; opacity: number }>>([]);

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

    const wordFontSize = Math.round(gridW / 4.2);
    const gap = CELL * 0.25;
    const totalH = gridH + gap + wordFontSize * 1.1;

    const originX = (W - gridW) / 2;
    const originY = (H - totalH) / 2;
    layoutRef.current = { originX, originY, CELL, PIXEL };

    const wordTop = originY + gridH + gap;
    setSvgLayout({ originX, originY, gridW, gridH, wordFontSize, wordTop });

    // Track mouse move and spawn interactive shockwaves
    const handleMouseMove = (e: MouseEvent) => {
      const rect = cvs.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      const lastX = mouseRef.current.x;
      const lastY = mouseRef.current.y;
      const distMoved = Math.sqrt((mx - lastX) ** 2 + (my - lastY) ** 2);

      if (distMoved > 16) {
        ripplesRef.current.push({
          x: mx,
          y: my,
          radius: 0,
          maxRadius: 240,
          opacity: 1,
        });

        if (ripplesRef.current.length > 20) {
          ripplesRef.current.shift();
        }

        mouseRef.current.x = mx;
        mouseRef.current.y = my;
      }
    };

    // Clicking spawns a massive shockwave!
    const handleMouseDown = (e: MouseEvent) => {
      const rect = cvs.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      ripplesRef.current.push({
        x: mx,
        y: my,
        radius: 0,
        maxRadius: Math.max(W, H) * 0.5,
        opacity: 1.2,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mousedown", handleMouseDown);

    // Initial central opening welcome shockwave
    setTimeout(() => {
      ripplesRef.current.push({
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        radius: 0,
        maxRadius: Math.max(window.innerWidth, window.innerHeight) * 0.45,
        opacity: 1.0,
      });
    }, 300);

    function draw() {
      if (cvs.width !== window.innerWidth || cvs.height !== window.innerHeight) {
        W = window.innerWidth; H = window.innerHeight;
        cvs.width = W; cvs.height = H;
      }

      ctx.fillStyle = "#050608";
      ctx.fillRect(0, 0, W, H);

      // Solve all active ripples
      const activeRipples = ripplesRef.current;
      for (let i = activeRipples.length - 1; i >= 0; i--) {
        const rp = activeRipples[i];
        rp.radius += 5.5; // speed of propagation
        rp.opacity = 1 - (rp.radius / rp.maxRadius);
        if (rp.radius >= rp.maxRadius) {
          activeRipples.splice(i, 1);
        }
      }

      // Distorted Grid Math
      const gs = 55; // Grid spacing step
      const colsCount = Math.ceil(W / gs) + 1;
      const rowsCount = Math.ceil(H / gs) + 1;

      const points: Array<Array<{ x: number; y: number; glow: number }>> = [];
      for (let r = 0; r < rowsCount; r++) {
        points[r] = [];
        for (let c = 0; c < colsCount; c++) {
          const px = c * gs;
          const py = r * gs;
          let dx = 0;
          let dy = 0;
          let glow = 0;

          for (let i = 0; i < activeRipples.length; i++) {
            const rp = activeRipples[i];
            const rx = px - rp.x;
            const ry = py - rp.y;
            const dist = Math.sqrt(rx * rx + ry * ry);

            if (dist > 0) {
              const waveDist = Math.abs(dist - rp.radius);
              if (waveDist < 55) {
                const intensity = (1 - waveDist / 55) * rp.opacity;
                // Elastic shockwave push outward from source
                const push = intensity * 22 * (1 - rp.radius / rp.maxRadius);
                dx += (rx / dist) * push;
                dy += (ry / dist) * push;
                glow += intensity * rp.opacity;
              }
            }
          }

          points[r][c] = {
            x: px + dx,
            y: py + dy,
            glow: Math.min(glow, 1.2),
          };
        }
      }

      // Draw horizontal lines
      for (let r = 0; r < rowsCount; r++) {
        for (let c = 0; c < colsCount - 1; c++) {
          const p1 = points[r][c];
          const p2 = points[r][c + 1];
          const avgGlow = (p1.glow + p2.glow) / 2;

          if (avgGlow > 0.05) {
            ctx.strokeStyle = `rgba(59, 130, 246, ${0.08 + avgGlow * 0.38})`;
            ctx.lineWidth = 1.2 + avgGlow * 1.2;
          } else {
            ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
            ctx.lineWidth = 0.8;
          }

          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }

      // Draw vertical lines
      for (let r = 0; r < rowsCount - 1; r++) {
        for (let c = 0; c < colsCount; c++) {
          const p1 = points[r][c];
          const p2 = points[r + 1][c];
          const avgGlow = (p1.glow + p2.glow) / 2;

          if (avgGlow > 0.05) {
            ctx.strokeStyle = `rgba(59, 130, 246, ${0.08 + avgGlow * 0.38})`;
            ctx.lineWidth = 1.2 + avgGlow * 1.2;
          } else {
            ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
            ctx.lineWidth = 0.8;
          }

          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }
      }

      // Draw glowing intersection nodes
      for (let r = 0; r < rowsCount; r++) {
        for (let c = 0; c < colsCount; c++) {
          const p = points[r][c];
          if (p.glow > 0.12) {
            ctx.fillStyle = `rgba(59, 130, 246, ${p.glow * 0.78})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 1.8 + p.glow * 2.0, 0, Math.PI * 2);
            ctx.fill();

            ctx.strokeStyle = `rgba(59, 130, 246, ${p.glow * 0.22})`;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 5 + p.glow * 6, 0, Math.PI * 2);
            ctx.stroke();
          }
        }
      }

      animRef.current = requestAnimationFrame(draw);
    }

    draw();
    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mousedown", handleMouseDown);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-[#050608]">
      {/* HEADER */}
      <header className="absolute top-0 left-0 right-0 z-10 flex items-center px-8 py-5">
        <div className="flex items-center gap-2.5 select-none">
          <NyxLockup size={22} tone="chalk" />
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
            style={{ color: "var(--nyx-accent)" }}
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
          <span style={{ fontWeight: 600, color: "var(--nyx-chalk)" }}>dark</span>
          <span style={{ fontWeight: 400, color: "var(--nyx-chalk)", opacity: 0.55 }}>nyx</span>
        </div>
      )}
    </div>
  );
}
