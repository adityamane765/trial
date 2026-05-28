"use client";

import Link from "next/link";

const cobalt = "var(--nyx-accent)";
const green = "#5fb85f";

const FEATURES = [
  {
    eyebrow: "01 · Hidden intent",
    title: "Orders never touch\nthe L1 mempool.",
    sub: "Side, price, amount stay inside the TDX enclave.",
    cluster: "TEE",
    clusterColor: cobalt,
    clusterBg: "var(--nyx-accent-soft)",
    tech: "Intel TDX · Phala",
    image: "/card-1.jpg",
  },
  {
    eyebrow: "02 · Verifiable settlement",
    title: "Every fill is a\nGroth16 proof.",
    sub: "VALID_SPEND · VALID_MATCH_BATCH · BN254",
    cluster: "L1",
    clusterColor: green,
    clusterBg: "rgba(95,184,95,0.08)",
    tech: "groth16-solana",
    image: "/card-3.jpg",
  },
  {
    eyebrow: "03 · Attested executor",
    title: "TEE-signed atomic\nsettlement.",
    sub: "Intel TDX · Ed25519 attestation on-chain.",
    cluster: "TEE",
    clusterColor: cobalt,
    clusterBg: "var(--nyx-accent-soft)",
    tech: "Phala Cloud",
    image: "/card-2.jpg",
  },
  {
    eyebrow: "04 · UTXO accounting",
    title: "Shielded notes,\npublic roots.",
    sub: "Depth-20 Poseidon Merkle · 32-root ring buffer.",
    cluster: "L1",
    clusterColor: green,
    clusterBg: "rgba(95,184,95,0.08)",
    tech: "darkpool-crypto",
    image: "/card-4.jpg",
  },
];

export function FeatureGrid() {
  return (
    <section
      id="landing-content"
      className="relative isolate border-t"
      style={{ borderColor: "rgba(255,255,255,0.06)" }}
    >
      <div className="mx-auto w-full max-w-6xl px-5 py-14 sm:px-7 sm:py-16">
        <div className="max-w-2xl">
          <span
            className="font-mono text-[10px] uppercase tracking-[0.18em]"
            style={{ color: cobalt }}
          >
            What Darknyx gives you
          </span>
          <h2
            className="mt-3 font-mono font-semibold leading-tight tracking-[-0.02em]"
            style={{ fontSize: "clamp(18px, 2.2vw, 28px)" }}
          >
            <span style={{ color: "rgba(245,243,238,0.85)" }}>A darkpool you can audit</span>
            <span style={{ color: "rgba(174,172,176,0.5)" }}> without compromising privacy.</span>
          </h2>
        </div>

        <div
          className="mt-10 grid grid-cols-1 gap-px sm:grid-cols-2"
          style={{ background: "rgba(255,255,255,0.05)" }}
        >
          {FEATURES.map((f) => (
            <article
              key={f.eyebrow}
              className="group relative overflow-hidden text-left"
              style={{ background: "#050506", padding: "28px 32px 24px" }}
            >
              {/* background image - shifted to cobalt blue via filter */}
              <div
                className="absolute inset-0 pointer-events-none transition-opacity duration-500 opacity-60 group-hover:opacity-85"
                style={{
                  backgroundImage: `url(${f.image})`,
                  backgroundSize: "cover",
                  backgroundPosition: "center",
                  filter: "hue-rotate(192deg) saturate(1.5) brightness(0.9)",
                }}
              />

              {/* dark gradient overlay so text stays readable */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(5,5,6,0.82) 20%, rgba(5,5,6,0.3) 100%)",
                }}
              />

              {/* content container to ensure it renders above the absolute-positioned media */}
              <div className="relative z-10">
                {/* top row */}
                <div className="flex items-center justify-between">
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: "4px 10px",
                      background: f.clusterBg,
                      border: `1px solid ${f.cluster === "TEE" ? "oklch(0.62 0.14 260 / 0.35)" : "rgba(95,184,95,0.35)"}`,
                      borderRadius: "2px",
                    }}
                  >
                    <div
                      style={{
                        width: "5px",
                        height: "5px",
                        borderRadius: "50%",
                        background: f.clusterColor,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      className="font-mono text-[8.5px] uppercase tracking-[0.18em]"
                      style={{ color: f.clusterColor }}
                    >
                      {f.cluster}
                    </span>
                  </div>
                  <span
                    className="font-mono text-[9px] tracking-[0.12em]"
                    style={{ color: "rgba(174,172,176,0.35)" }}
                  >
                    {f.tech}
                  </span>
                </div>

                {/* title block */}
                <div className="mt-10">
                  <div
                    className="font-mono text-[9px] uppercase tracking-[0.2em]"
                    style={{ color: "rgba(174,172,176,0.35)" }}
                  >
                    {f.eyebrow}
                  </div>
                  <h3
                    className="mt-3 font-mono font-semibold leading-[1.18] tracking-[-0.025em] whitespace-pre-line"
                    style={{
                      fontSize: "clamp(17px, 2vw, 21px)",
                      color: "rgba(245,243,238,0.92)",
                    }}
                  >
                    {f.title}
                  </h3>
                </div>

                {/* sub — bottom */}
                <div className="mt-8">
                  <span
                    className="font-mono text-[11px] leading-[1.65]"
                    style={{ color: "rgba(174,172,176,0.52)" }}
                  >
                    {f.sub}
                  </span>
                </div>
              </div>

              {/* hover line */}
              <div
                className="absolute inset-x-0 bottom-0 h-px opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                style={{
                  background: `linear-gradient(to right, transparent, ${f.clusterColor}55, transparent)`,
                }}
              />
            </article>
          ))}
        </div>

        <Link
          href="/architecture"
          className="mt-8 inline-flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-nyx-fog transition hover:text-[var(--nyx-accent)]"
        >
          Technical architecture
          <span aria-hidden>→</span>
        </Link>
      </div>
    </section>
  );
}
