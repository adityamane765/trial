"use client";

import Link from "next/link";

import { flow } from "@/components/landing/landing-copy";

const accent = "var(--nyx-accent)";

export function FlowDiagram() {
  return (
    <section
      className="relative isolate overflow-hidden border-t"
      style={{
        borderColor: "rgba(255,255,255,0.06)",
        backgroundColor: "#050505",
        backgroundImage: "radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)",
        backgroundSize: "18px 18px",
      }}
    >
      <div className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-7 sm:py-16">
        <div className="flex max-w-2xl flex-col items-start gap-2">
          <span
            className="font-mono text-[10px] uppercase tracking-[0.18em]"
            style={{ color: accent }}
          >
            {flow.eyebrow}
          </span>
          <h2
            className="font-mono font-semibold leading-tight tracking-[-0.02em]"
            style={{ fontSize: "clamp(18px, 2.2vw, 28px)" }}
          >
            <span style={{ color: "rgba(245,243,238,0.9)" }}>{flow.title}</span>
            <br />
            <span style={{ color: "rgba(174,172,176,0.55)" }}>{flow.titleMuted}</span>
          </h2>
          <p
            className="mt-3 max-w-xl font-mono text-[12px] leading-[1.85]"
            style={{ color: "rgba(174,172,176,0.55)" }}
          >
            {flow.lede}
          </p>
        </div>

        <ol className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          {flow.stages.map((s, idx) => (
            <li key={s.title}>
              <div
                className={`group h-full p-6 transition-all duration-500 nyx-rise nyx-rise-delay-${idx + 1}`}
                style={{
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: "30px",
                  background: "rgba(255,255,255,0.035)",
                  backdropFilter: "blur(14px)",
                  boxShadow: "0 0 0 1px rgba(255,255,255,0.02) inset",
                }}
              >
                <span
                  className="font-mono text-[20px] leading-none"
                  style={{ color: accent }}
                >
                  0{idx + 1}
                </span>
                <h3
                  className="mt-4 font-mono text-[14px] font-semibold leading-snug"
                  style={{ color: "rgba(245,243,238,0.9)" }}
                >
                  {s.title}
                </h3>
                <p
                  className="mt-3 font-mono text-[11.5px] leading-[1.8]"
                  style={{ color: "rgba(174,172,176,0.58)" }}
                >
                  {s.body}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-10 h-px w-full bg-white/[0.06]" />

        <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
          <p className="max-w-xl font-mono text-[12px] leading-[1.75] text-nyx-fog">
            {flow.footnote}
          </p>
          <Link
            href="/architecture"
            className="inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-nyx-fog transition hover:text-[var(--nyx-accent)]"
          >
            Architecture deep-dive
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none" aria-hidden="true">
              <path
                d="M2 5.5h7m0 0L5.5 2m3.5 3.5L5.5 9"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
