const accent = "var(--nyx-accent)";

const STACK = [
  { label: "Solana", detail: "Where custody and final settlement live" },
  { label: "Private batch", detail: "Orders matched off the public tape" },
  { label: "Zero-knowledge proofs", detail: "Math that balances check out" },
  { label: "Your wallet", detail: "You sign deposits and withdrawals" },
];

export function StackStrip() {
  return (
    <section
      className="border-t py-12"
      style={{ borderColor: "rgba(255,255,255,0.06)", background: "#050608" }}
    >
      <div className="mx-auto max-w-6xl px-5 sm:px-7">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span
            className="font-mono text-[10px] uppercase tracking-[0.18em]"
            style={{ color: accent }}
          >
            Under the hood
          </span>
          <span
            className="font-mono text-[10px]"
            style={{ color: "rgba(174,172,176,0.4)" }}
          >
            Devnet preview
          </span>
        </div>
        <p
          className="mt-3 max-w-xl font-mono text-[11px] leading-[1.75]"
          style={{ color: "rgba(174,172,176,0.45)" }}
        >
          Nyx combines familiar Solana wallets with newer privacy tooling. You do not need
          to understand every piece on day one — auditors and integrators can go deeper
          when they are ready.
        </p>
        <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-4">
          {STACK.map((s) => (
            <li
              key={s.label}
              className="flex flex-col gap-0.5 border-l border-white/[0.06] pl-3 transition-colors hover:border-[var(--nyx-accent)]/50"
            >
              <span
                className="font-mono text-[12px] font-medium"
                style={{ color: "rgba(245,243,238,0.8)" }}
              >
                {s.label}
              </span>
              <span
                className="font-mono text-[10px] leading-snug"
                style={{ color: "rgba(174,172,176,0.5)" }}
              >
                {s.detail}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
