import Link from "next/link";

import { NyxMark } from "@/components/brand/nyx-mark";
import { cta } from "@/components/landing/landing-copy";

export function CtaSection() {
  return (
    <section
      className="relative isolate border-t py-20 sm:py-24"
      style={{ borderColor: "rgba(255,255,255,0.06)" }}
    >
      <div className="mx-auto max-w-5xl px-5 text-center sm:px-7">
        <NyxMark size={56} className="mx-auto nyx-drift" style={{ color: "var(--nyx-accent)" }} />
        <h2
          className="mt-7 font-mono font-semibold leading-tight tracking-[-0.02em]"
        >
          <span
            className="block"
            style={{ fontSize: "clamp(22px, 3.5vw, 36px)", color: "var(--nyx-accent)" }}
          >
            {cta.title}
          </span>
          <span
            className="mt-2 block"
            style={{ fontSize: "clamp(18px, 2.5vw, 28px)", color: "rgba(174,172,176,0.5)" }}
          >
            {cta.titleMuted}
          </span>
        </h2>
        <p
          className="mx-auto mt-5 max-w-lg font-mono text-[12px] leading-[1.85]"
          style={{ color: "rgba(174,172,176,0.55)" }}
        >
          {cta.body}
        </p>
        <div className="mt-8 flex justify-center">
          <Link
            href="/architecture"
            className="group inline-flex items-center gap-2 rounded-sm px-6 py-3.5 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] transition hover:opacity-90"
            style={{
              background: "var(--nyx-accent-soft)",
              border: "1px solid oklch(0.62 0.14 260 / 0.4)",
              color: "var(--nyx-accent)",
            }}
          >
            Architecture
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
