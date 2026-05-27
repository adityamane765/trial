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
        color: "#FA7E23",
        background: "rgba(255,137,29,0.08)",
        border: "1px solid rgba(255,137,29,0.3)",
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
          <span style={{ display: "block", fontSize: "clamp(48px, 7vw, 70px)", color: "#FA7E23" }}>
            Dark by default
          </span>
          <span style={{ display: "block", fontSize: "clamp(48px, 7vw, 70px)", color: "rgba(245,243,238,0.88)" }}>
            Auditable by design
          </span>
        </h1>

        {/* Metadata blocks — directly below heading, no dividers */}
        <div className="mt-14 flex flex-col gap-10 sm:flex-row sm:gap-22">

          {/* Architecture block */}
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "8.5px", letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(174,172,176,0.32)" }}>
              Architecture
            </div>
            <ul className="mt-4 flex flex-col gap-2.5">
              {[
                "TEE-attested execution",
                "Hidden order intent",
                "Groth16 settlement proofs",
                "Solana-native custody",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span style={{ color: "rgba(217,104,32,0.5)", fontFamily: "'JetBrains Mono', monospace", fontSize: "13px", lineHeight: 1.4, marginTop: "1px" }}>·</span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "13px", lineHeight: 1.5, color: "rgba(245,243,238,0.5)" }}>
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Status block */}
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "8.5px", letterSpacing: "0.24em", textTransform: "uppercase", color: "rgba(174,172,176,0.32)" }}>
              Status
            </div>
            <ul className="mt-4 flex flex-col gap-2.5">
              {[
                { value: "3", label: "Layers" },
                { value: "2", label: "Clusters" },
                { value: "6", label: "ZK Circuits" },
                { value: "1", label: "Settlement Path" },
              ].map((stat) => (
                <li key={stat.label} className="flex items-baseline gap-3">
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "18px", fontWeight: 700, letterSpacing: "-0.04em", color: "rgba(245,243,238,0.7)", lineHeight: 1 }}>
                    {stat.value}
                  </span>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", color: "rgba(174,172,176,0.38)" }}>
                    {stat.label}
                  </span>
                </li>
              ))}
            </ul>
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
