"use client";

import RichGridBackground from "@/components/architecture/rich-grid-bg";

function DocsButton({ onClick }: { onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-2 transition-opacity hover:opacity-70"
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "10px",
        letterSpacing: "0.16em",
        textTransform: "uppercase",
        color: "var(--nyx-accent)",
        background: "var(--nyx-accent-soft)",
        border: "1px solid oklch(0.62 0.14 260 / 0.3)",
        borderRadius: "2px",
        padding: "8px 16px",
        cursor: "pointer",
      }}
    >
      Docs
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
        <path d="M2 5h6m0 0L5 2m3 3L5 8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

export function ArchitectureHero({ onScrollDown }: { onScrollDown?: () => void }) {
  return (
    <section
      className="relative isolate"
      style={{
        height: "calc(100dvh - 40px)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        borderBottom: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div className="absolute inset-0 pointer-events-none">
        <RichGridBackground stroke="rgba(255,255,255,1)" opacity={0.18} />
      </div>

      {/* MAIN — content contained within inner rect (17% inset on all sides) */}
      <div className="flex flex-1 flex-col justify-between" style={{ padding: "18dvh 18vw" }}>

        {/* Poster text — top */}
        <h1
          className="nyx-rise"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontWeight: 450,
            lineHeight: 1.12,
            letterSpacing: "-0.045em",
          }}
        >
          <span style={{ display: "block", fontSize: "clamp(48px, 7vw, 70px)", color: "var(--nyx-accent)" }}>
            Dark by default
          </span>
          <span style={{ display: "block", fontSize: "clamp(48px, 7vw, 70px)", color: "rgba(245,243,238,0.88)" }}>
            Auditable by design
          </span>
        </h1>

        {/* Metadata blocks — directly below heading, no dividers */}
        <div className="mt-14 flex flex-col gap-10 sm:flex-row sm:gap-22">

          {/* Architecture block */}
          <div style={{ maxWidth: "600px" }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "8.5px", letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(174,172,176,0.32)", marginBottom: "16px" }}>
              Architecture
            </div>
            <p
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "12.5px",
                lineHeight: "1.85",
                color: "rgba(245,243,238,0.55)",
              }}
            >
              Darknyx is a privacy-preserving on-chain darkpool for Solana. Order intent stays
              inside and gets matched in an Intel TDX attested TEE. Settlement lands as shielded UTXO notes
              verified by Groth16 zero-knowledge proofs — every balance reconciles, no
              individual order is exposed.
            </p>
          </div>

        </div>

        {/* Docs button — bottom */}
        <div className="mt-auto flex items-center justify-center pt-16">
          <DocsButton onClick={onScrollDown} />
        </div>
      </div>
    </section>
  );
}
