"use client";

import { scrollToStage } from "@/components/ScrollEngine";
import { STAGES, STAGE_LABELS, view } from "@/lib/state";

/** Vertical stage rail. Tick opacity/scale is written by <ScrollEngine/>. */
export default function ProgressRail() {
  return (
    <nav
      /* Was lg-only, which left the longest-scrolling layout — a phone — with
         no indication of where in four screens you are or how many are left.
         Same rail, tighter, and the hover labels stay desktop-only because
         there is no hover to reveal them with.
         On a phone it reads and does not act: at that width the ticks sit over
         the right edge of the work card, and a 12px tap target that steals
         presses from a card is worse than no shortcut at all. Wayfinding was
         the thing missing; jumping stays a pointer affordance. */
      className="pointer-events-none fixed right-1.5 top-1/2 z-40 flex -translate-y-1/2 flex-col gap-3.5 lg:pointer-events-auto lg:right-5 lg:gap-5"
      aria-label="Sections"
    >
      {STAGES.map((s, i) => (
        <button
          key={s}
          onClick={() => scrollToStage(s, !view.reduced)}
          aria-label={STAGE_LABELS[s]}
          /* Keyboard keeps the shortcut at every width — only touch loses it,
             and only because the ticks sit over the card there. */
          className="group flex items-center justify-end gap-3 py-1.5"
        >
          <span className="hidden text-[9px] uppercase tracking-[0.24em] text-muted opacity-0 transition-opacity duration-300 group-hover:opacity-100 lg:block">
            {STAGE_LABELS[s]}
          </span>
          <span
            data-engine="rail-tick"
            data-index={i}
            className="engine-driven block h-px w-3 origin-right bg-accent lg:w-8"
            style={{ opacity: 0.32, transform: "scaleX(0.45)" }}
          />
        </button>
      ))}
    </nav>
  );
}
