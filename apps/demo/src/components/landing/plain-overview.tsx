import { plainBand } from "@/components/landing/landing-copy";

const accent = "var(--nyx-accent)";

export function PlainOverview() {
  return (
    <section
      className="relative isolate border-t"
      style={{ borderColor: "rgba(255,255,255,0.06)", background: "#050608" }}
    >
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-7 sm:py-16">
        <div className="max-w-2xl">
          <span
            className="font-mono text-[10px] uppercase tracking-[0.18em]"
            style={{ color: accent }}
          >
            {plainBand.eyebrow}
          </span>
          <h2
            className="mt-3 font-mono font-semibold leading-tight tracking-[-0.02em]"
            style={{ fontSize: "clamp(18px, 2.2vw, 26px)" }}
          >
            <span style={{ color: "rgba(245,243,238,0.88)" }}>{plainBand.title}</span>
          </h2>
        </div>

        <ul className="mt-10 grid gap-px sm:grid-cols-3" style={{ background: "rgba(255,255,255,0.06)" }}>
          {plainBand.points.map((point, i) => (
            <li
              key={point.title}
              className="nyx-rise bg-[#050608] p-7 sm:p-8"
              style={{ animationDelay: `${80 + i * 80}ms` }}
            >
              <div
                className="font-mono text-[9px] uppercase tracking-[0.2em]"
                style={{ color: accent, opacity: 0.85 }}
              >
                0{i + 1}
              </div>
              <h3
                className="mt-4 font-mono text-[14px] font-semibold leading-snug tracking-[-0.02em]"
                style={{ color: "rgba(245,243,238,0.9)" }}
              >
                {point.title}
              </h3>
              <p
                className="mt-3 font-mono text-[12px] leading-[1.8]"
                style={{ color: "rgba(174,172,176,0.58)" }}
              >
                {point.body}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
