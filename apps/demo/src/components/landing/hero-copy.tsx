import Link from "next/link";

import { NyxLockup } from "@/components/brand/nyx-mark";
import { hero } from "@/components/landing/landing-copy";

const mono = "font-mono";
const muted = "rgba(174, 172, 176, 0.58)";

export function LandingHeroCopy() {
  return (
    <div className="relative max-w-2xl">
      <div className="mb-9 sm:mb-10">
        <NyxLockup size={76} markSize={116} tone="chalk" />
      </div>
      <h1
        className={`${mono} font-semibold leading-tight`}
        style={{
          fontSize: "clamp(28px, 4.5vw, 44px)",
          letterSpacing: "-0.02em",
        }}
      >
        <span className="block" style={{ color: "rgba(245, 243, 238, 0.92)" }}>
          Settle in the dark.
        </span>
        <span className="mt-2 block" style={{ color: "var(--nyx-accent)", opacity: 0.85 }}>
          Prove in the light.
        </span>
      </h1>
      <p className={`${mono} mt-6 max-w-xl text-[13px] leading-[1.85] sm:text-[14px]`} style={{ color: muted }}>
        {hero.lede}
      </p>
      <p className={`${mono} mt-4 max-w-lg text-[11px] leading-[1.75]`} style={{ color: "rgba(174, 172, 176, 0.42)" }}>
        {hero.aside}
      </p>
      <div className="mt-8">
        <Link
          href="/architecture"
          className={`${mono} inline-flex items-center rounded-sm px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] transition hover:opacity-90`}
          style={{
            background: "var(--nyx-accent-soft)",
            border: "1px solid oklch(0.62 0.14 260 / 0.45)",
            color: "var(--nyx-accent)",
          }}
        >
          How it works
        </Link>
      </div>
    </div>
  );
}
