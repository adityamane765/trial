import Link from "next/link";

import { NyxLockup } from "./nyx-mark";

interface NyxNavProps {
  /** "ink" = dark page, "chalk" = light page */
  tone?: "ink" | "chalk";
  /**
   * Where the "Launch dapp" button points. Defaults to /dapp.
   * Set to null to suppress the button (e.g. ON the dapp page itself).
   */
  launchHref?: string | null;
  /** Active page hint — applied to nav links for subtle emphasis. */
  active?: "home" | "architecture" | "dapp" | null;
}

const LINKS: Array<{ label: string; href: string; key: NonNullable<NyxNavProps["active"]> }> = [
  { label: "Overview", href: "/landing", key: "home" },
  { label: "Architecture", href: "/architecture", key: "architecture" },
];

export function NyxNav({ tone = "ink", launchHref = "/dapp", active = null }: NyxNavProps) {
  const isInk = tone === "ink";

  return (
    <header
      className="sticky top-0 z-30 w-full border-b"
      style={{
        background: isInk ? "#050608" : "var(--nyx-chalk)",
        borderColor: isInk ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
      }}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 sm:px-7">
        <Link href="/" className="flex items-center gap-2">
          <NyxLockup size={22} tone={tone === "ink" ? "chalk" : "ink"} />
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.key}
              href={l.href}
              className="transition-colors"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "11px",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: active === l.key
                  ? (isInk ? "var(--nyx-accent)" : "var(--nyx-ink)")
                  : (isInk ? "rgba(174,172,176,0.7)" : "var(--nyx-slate)"),
              }}
            >
              {l.label}
            </Link>
          ))}
        </nav>

        {launchHref ? (
          <div
            className="inline-flex items-center gap-2 select-none"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              padding: "6px 14px",
              borderRadius: "2px",
              background: "var(--nyx-accent-soft)",
              border: "1px solid oklch(0.62 0.14 260 / 0.35)",
              color: "var(--nyx-accent)",
            }}
          >
            <span>Coming Soon on Mainnet</span>
          </div>
        ) : (
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(174,172,176,0.5)" }}>
            devnet
          </span>
        )}
      </div>
    </header>
  );
}
