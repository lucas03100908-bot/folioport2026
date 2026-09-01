"use client";

import { useEffect } from "react";
import LiquidTank from "@/components/ui/liquid-tank";
import { railScrollTo } from "@/components/ScrollEngine";
import { view } from "@/lib/state";

export type RailItem = {
  key: string;
  eyebrow: string;
  title: string;
  tint: [number, number, number];
  tags?: string[];
  still?: string;
};

/**
 * The measuring-rule carousel. It carries whatever it is given — the three
 * disciplines first, then that discipline's projects.
 *
 * Each item is its own tank of liquid, and **the whole box travels**: the card
 * you press is the card that moves. Type sits inside it, so nothing can overrun
 * the frame. Page scroll drives the rail; the ruler above and below moves with
 * it.
 *
 * NOTE: nothing the engine drives may carry a Tailwind `translate-*` class. In
 * v4 those set the independent `translate` property, which composes *on top of*
 * the `transform` the engine writes — every card ends up shifted by an extra
 * 50% and nothing lines up.
 */
export default function RulerCarousel({
  items,
  cta,
  tall = false,
  liquid = false,
  onActivate,
}: {
  items: RailItem[];
  cta: string;
  /** the chooser gets taller cards — three of them, and nothing else to see */
  tall?: boolean;
  /** only the disciplines hold liquid; projects are their stills */
  liquid?: boolean;
  onActivate: (index: number) => void;
}) {
  const current = () =>
    Math.max(0, Math.min(view.rail.count - 1, Math.round(view.rail.target)));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      const r = document
        .querySelector('[data-stage="work"]')
        ?.getBoundingClientRect();
      const mid = window.innerHeight * 0.5;
      if (!r || r.top > mid || r.bottom < mid) return;
      e.preventDefault();
      railScrollTo(current() + (e.key === "ArrowRight" ? 1 : -1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="relative flex h-full w-full flex-col justify-center overflow-hidden">
      <Rule />

      <div
        className={
          tall
            ? "relative grid h-[64vh] min-h-[440px] place-items-center"
            : "relative grid h-[54vh] min-h-[360px] place-items-center"
        }
      >
        {items.map((it, i) => (
          <div
            key={it.key}
            data-engine="rail-item"
            data-index={i}
            className="absolute left-1/2 top-1/2"
          >
            <LiquidTank
              tint={it.tint}
              still={it.still}
              liquid={liquid}
              className={tall ? "rail-tank rail-tank-tall" : "rail-tank"}
              onClick={() => (i === current() ? onActivate(i) : railScrollTo(i))}
            >
              <span className="flex items-start justify-between gap-6">
                <span className="eyebrow eyebrow-lg text-white/75">
                  {it.eyebrow}
                </span>
                <span className="font-mono text-[13px] tabular-nums text-white/60">
                  {String(i + 1).padStart(2, "0")}
                </span>
              </span>

              <span className="block">
                <span className="display block truncate text-[clamp(1.7rem,3.7vw,3rem)] leading-[0.95] text-white">
                  {it.title}
                </span>
                <span className="mt-4 flex items-center gap-2.5 text-[12px] font-semibold uppercase tracking-[0.26em] text-white/85">
                  {cta}
                  <svg width="19" height="10" viewBox="0 0 19 10" aria-hidden>
                    <path
                      d="M0 5h15M11.5 1.5 15 5l-3.5 3.5"
                      stroke="currentColor"
                      strokeWidth="1.3"
                      fill="none"
                    />
                  </svg>
                </span>
              </span>
            </LiquidTank>
          </div>
        ))}

        <span
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-1/2 z-20 w-px bg-gradient-to-b from-transparent via-white/25 to-transparent"
        />
      </div>

      <Rule flipped />

      <div className="relative mt-9 flex items-center justify-center gap-8">
        <Step dir={-1} label="Previous" onClick={() => railScrollTo(current() - 1)} />
        <p className="font-mono text-[13px] tracking-[0.24em] text-muted tabular-nums">
          <span data-engine="rail-counter" className="text-ink">
            01
          </span>
          <span className="mx-2.5 text-faint">/</span>
          <span className="text-faint">
            {String(items.length).padStart(2, "0")}
          </span>
        </p>
        <Step dir={1} label="Next" onClick={() => railScrollTo(current() + 1)} />
      </div>
    </div>
  );
}

function Step({
  dir,
  label,
  onClick,
}: {
  dir: -1 | 1;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="text-muted transition-colors duration-300 hover:text-accent focus-visible:text-accent focus-visible:outline-none"
    >
      <svg
        width="28"
        height="18"
        viewBox="0 0 22 14"
        aria-hidden
        /* the drawn glyph is a rewind (bar on the left, apexes pointing left),
           so it is the forward one that gets mirrored */
        style={{ transform: dir === 1 ? "scaleX(-1)" : undefined }}
      >
        <path d="M1 1v12M4 7l8-6v12zM13 7l8-6v12z" fill="currentColor" />
      </svg>
    </button>
  );
}

/** Minor ticks every 14px, a major every 70px — two repeating gradients. */
function Rule({ flipped = false }: { flipped?: boolean }) {
  return (
    <div
      aria-hidden
      className="relative h-6 w-full overflow-hidden"
      style={{ transform: flipped ? "scaleY(-1)" : undefined }}
    >
      <div
        data-engine="rail-rule"
        className="absolute inset-y-0 -left-[50vw] w-[200vw]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, rgba(255,255,255,0.28) 0 1px, transparent 1px 14px)," +
            "repeating-linear-gradient(90deg, rgba(255,255,255,0.6) 0 1px, transparent 1px 70px)",
          backgroundSize: "100% 9px, 100% 16px",
          backgroundPosition: "0 100%, 0 100%",
          backgroundRepeat: "repeat-x",
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(90deg, #000 0%, transparent 14%, transparent 86%, #000 100%)",
        }}
      />
    </div>
  );
}
