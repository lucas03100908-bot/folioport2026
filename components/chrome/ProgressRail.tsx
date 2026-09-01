"use client";

import { scrollToStage } from "@/components/ScrollEngine";
import { STAGES, STAGE_LABELS, view } from "@/lib/state";

/** Vertical stage rail. Tick opacity/scale is written by <ScrollEngine/>. */
export default function ProgressRail() {
  return (
    <nav
      className="fixed right-5 top-1/2 z-40 hidden -translate-y-1/2 flex-col gap-5 lg:flex"
      aria-label="Sections"
    >
      {STAGES.map((s, i) => (
        <button
          key={s}
          onClick={() => scrollToStage(s, !view.reduced)}
          className="group flex items-center justify-end gap-3"
        >
          <span className="text-[9px] uppercase tracking-[0.24em] text-muted opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            {STAGE_LABELS[s]}
          </span>
          <span
            data-engine="rail-tick"
            data-index={i}
            className="engine-driven block h-px w-8 origin-right bg-accent"
            style={{ opacity: 0.32, transform: "scaleX(0.45)" }}
          />
        </button>
      ))}
    </nav>
  );
}
