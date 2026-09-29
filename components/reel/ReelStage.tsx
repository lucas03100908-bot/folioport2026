"use client";

import { useEffect, useRef, useState } from "react";
import { view } from "@/lib/state";
import MaskScene from "./MaskScene";

/**
 * Stage 3 — the case opens.
 *
 * A tall scroll well with a sticky frame: scrolling grows the frame from a
 * small card to full bleed. Inside it stands the mask, lit by one lamp and
 * turning to follow the pointer (see MaskScene).
 *
 * **No scroll hijacking.** The common version of this effect calls
 * `preventDefault()` on wheel and pins the page with `scrollTo(0, 0)` until
 * the media is fully open. That fights Lenis, breaks keyboard and trackpad
 * momentum, traps screen-reader users, and makes the browser's own scrollbar
 * lie. Here the expansion is just a function of how far you have scrolled
 * through a tall section — same picture, nothing stolen.
 *
 * Expansion finishes at ~55% of the well, so the last stretch is spent with
 * the mask full-bleed before the cue points on.
 */
export default function ReelStage() {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    setReduced(view.reduced);
    /* the frame's size is written by the engine, which measures on this */
    window.dispatchEvent(new CustomEvent("minho:layout"));
  }, []);

  return (
    <section
      data-stage="reel"
      className="relative h-[300vh] w-full"
      aria-label="Tal"
    >
      <h2 className="sr-only">Tal — a mask that follows you</h2>

      <div className="sticky top-0 flex h-svh w-full items-center justify-center overflow-hidden">
        {/* the case that grows */}
        <div
          data-engine="reel-frame"
          className="engine-driven relative overflow-hidden bg-[#050505]"
          style={{ width: "26vw", height: "40vh", borderRadius: "16px" }}
        >
          {/* The lamp's own spill inside the case: what a cone of light does
              to the air of a dark room. A gradient rather than a second pass
              over the scene — and inside the frame, so it is still there once
              the frame is the whole screen. */}
          <div
            data-engine="reel-glow"
            className="engine-driven pointer-events-none absolute inset-0 opacity-0"
            style={{
              background:
                "radial-gradient(58% 46% at 50% 4%, rgba(255,214,170,0.22) 0%, rgba(255,146,72,0.07) 42%, transparent 74%)",
            }}
            aria-hidden="true"
          />
          <MaskScene className="absolute inset-0 h-full w-full" />
          <div
            data-engine="reel-veil"
            className="engine-driven pointer-events-none absolute inset-0 bg-black"
            style={{ opacity: 0.28 }}
          />
        </div>

        {/* one cue at a time, so it always says what to do next */}
        <div className="pointer-events-none absolute inset-x-0 bottom-safe-[2.5rem] z-10 flex justify-center">
          <span
            data-engine="reel-cue-a"
            className="engine-driven absolute whitespace-nowrap text-label text-ink md:text-muted"
          >
            {reduced ? "SCROLL TO OPEN" : "SCROLL TO EXPAND"}
          </span>
          <span
            data-engine="reel-cue-b"
            className="engine-driven absolute flex items-center gap-3 whitespace-nowrap text-label text-accent opacity-0"
          >
            KEEP SCROLLING
            <svg width="9" height="16" viewBox="0 0 9 16" aria-hidden>
              <path
                d="M4.5 0v14M1 10.5l3.5 3.5L8 10.5"
                stroke="currentColor"
                strokeWidth="1.2"
                fill="none"
              />
            </svg>
          </span>
        </div>
      </div>
    </section>
  );
}
