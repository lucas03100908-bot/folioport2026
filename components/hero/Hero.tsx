"use client";

import HeroBackground from "./HeroBackground";
import HeroTitle from "./HeroTitle";
import { scrollToStage } from "@/components/ScrollEngine";
import { view } from "@/lib/state";

/**
 * Stage 1 — a tall scroll well with a sticky frame: the film underneath is
 * scrubbed by scroll while "MINHO" stays pinned on top, inverting whatever
 * runs behind the letterforms.
 *
 * The sticky frame is the blend group: <HeroBackground/> and <HeroTitle/> are
 * direct siblings inside it, with nothing in between that would isolate them.
 */
export default function Hero() {
  return (
    <section
      data-stage="hero"
      className="pointer-events-auto relative h-[200vh] w-full"
    >
      <h1 className="sr-only">
        MINHO — Kim Minho, designer: realtime experience, motion·3D, UX·UI
      </h1>

      <div className="sticky top-0 h-svh min-h-[600px] w-full overflow-hidden">
        <HeroBackground />

        {/* The blended title. NOTE: no `z-index` anywhere on this chain — a
            positioned element with a z-index creates a stacking context, which
            isolates the blend group and would leave the type plain white.
            DOM order alone puts it above the film. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 px-5 pb-24 md:px-12 md:pb-28">
          <div className="mx-auto w-full max-w-[1500px]">
            <div className="w-[min(880px,62vw)] min-w-[260px] max-sm:w-[88vw]">
              <HeroTitle />
            </div>
          </div>
        </div>

        {/* copy row — engine-driven, deliberately NOT an ancestor of the title */}
        <div
          data-engine="panel"
          data-stage="hero"
          className="engine-driven absolute inset-x-0 bottom-0 z-20 px-5 pb-10 md:px-12 md:pb-12"
        >
          <div className="mx-auto flex w-full max-w-[1500px] items-end justify-between gap-10">
            <div>
              <p className="eyebrow">Kim Minho / 김민호</p>
              <p className="tagrow mt-3">
                <span>Realtime Experience</span>
                <span>Motion·3D</span>
                <span>UX·UI</span>
              </p>
            </div>

            <button
              onClick={() => scrollToStage("work", !view.reduced)}
              className="group hidden items-center gap-4 pb-1 md:flex"
            >
              <span className="eyebrow eyebrow-dim transition-colors duration-300 group-hover:text-accent">
                Scroll
              </span>
              <span className="relative block h-9 w-px overflow-hidden bg-white/25">
                <span className="absolute inset-x-0 top-0 block h-3.5 animate-[cue_2.2s_ease-in-out_infinite] bg-accent" />
              </span>
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes cue {
          0%   { transform: translateY(-100%); }
          55%  { transform: translateY(160%); }
          100% { transform: translateY(160%); }
        }
      `}</style>
    </section>
  );
}
