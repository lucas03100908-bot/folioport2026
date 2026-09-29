"use client";

import { useEffect, useRef, useState } from "react";
import { view } from "@/lib/state";
import MaskRoom from "./MaskRoom";
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
          className="engine-driven relative overflow-hidden bg-[#f1ece1]"
          style={{ width: "26vw", height: "40vh", borderRadius: "16px" }}
        >
          <MaskRoom />

          {/* The paper the piece stands on is warm, so the shadow it casts on
              the collage is warm too — and soft, because the lamp above it is
              broad. Without it the mask reads as pasted on rather than
              photographed on the sheet. */}
          <div
            data-engine="reel-seat"
            className="engine-driven pointer-events-none absolute inset-0 opacity-0"
            style={{
              background:
                "radial-gradient(22% 30% at var(--mask-x, 50%) 72%, rgba(58,40,28,0.34) 0%, rgba(58,40,28,0.16) 46%, transparent 74%)",
            }}
            aria-hidden="true"
          />

          <MaskScene className="absolute inset-0 h-full w-full" />

          {/* The torn strip along the bottom, in front of the piece: the comp
              rips the paper across the chin, and that overlap is what makes
              the sheet read as a sheet. */}
          <div
            data-engine="reel-strip"
            className="engine-driven pointer-events-none absolute inset-x-0 bottom-0 opacity-0"
            style={{ height: "clamp(6.5rem, 22%, 12rem)" }}
            aria-hidden="true"
          >
            <svg
              className="absolute inset-0 h-full w-full"
              viewBox="0 0 1600 220"
              preserveAspectRatio="none"
            >
              <path
                fill="#f1ece1"
                d="M0 46 Q60 24 128 40 Q210 60 286 34 Q360 12 440 38 Q520 62 598 36 Q676 12 754 40 Q836 68 912 40 Q988 14 1064 40 Q1144 66 1220 40 Q1298 16 1376 42 Q1456 66 1530 40 Q1570 26 1600 36 L1600 220 L0 220 Z"
              />
            </svg>
          </div>

          {/* --------------------------------------------------- the sheet --
              Type on paper, in the comp's order: the headline across the top,
              then the piece, then two columns of small print at the foot with
              the printer's marks between them. Black on cream — this is the
              one screen on the site that is a printed page rather than a lit
              room. */}
          <div
            data-engine="reel-poster"
            className="engine-driven pointer-events-none absolute inset-0 opacity-0"
          >
            <div className="absolute inset-x-0 top-0 px-gutter pt-[calc(var(--nav-h)+0.5rem)]">
              <p
                data-engine="reel-head"
                className="engine-driven whitespace-nowrap text-center text-[clamp(2.4rem,9.2vw,8.5rem)] font-black uppercase leading-[0.86] text-[#141210]"
                style={{ fontFamily: "var(--font-ui)", letterSpacing: "-0.045em" }}
              >
                Bangsangsi Mask
              </p>
            </div>

            <div className="absolute inset-x-0 bottom-[clamp(2.75rem,6vh,4rem)] px-gutter">
              <div className="mx-auto grid w-full max-w-page items-end gap-5 md:grid-cols-[1fr_auto_1fr] md:gap-8">
                <p className="hidden text-justify text-[0.8125rem] font-semibold leading-[1.5] text-[#1a1714] md:block">
                  A carved mask, lit by one lamp hung above it, turning to
                  follow whoever is looking at it. Its ears, its four eyes and
                  the lotus on its nose are carved, not painted on.
                </p>

                {/* the printer's marks the comp sets between its columns */}
                <div className="flex items-center justify-center gap-4 text-[#141210]">
                  <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden>
                    <path d="M11 0v22M0 11h22" stroke="currentColor" strokeWidth="2" />
                  </svg>
                  <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden>
                    <circle cx="11" cy="11" r="10" fill="none" stroke="currentColor" strokeWidth="1.5" />
                    <circle cx="11" cy="11" r="5" fill="currentColor" />
                  </svg>
                  <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden>
                    <path
                      d="M11 0l2.6 6.4L20 4l-3.2 6.1L22 13l-6.8.4L16 20l-5-4.4L6 20l.8-6.6L0 13l5.2-2.9L2 4l6.4 2.4z"
                      fill="currentColor"
                    />
                  </svg>
                  <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden>
                    <path d="M4 22C4 10 10 0 22 0v10C12 10 12 16 12 22z" fill="currentColor" />
                  </svg>
                </div>

                <p className="text-justify text-[0.8125rem] font-semibold leading-[1.5] text-[#1a1714]">
                  One mesh of 91,213 triangles, one light and one shader, drawn
                  straight against WebGL2 — no scene library, 1.5MB all in.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* one cue at a time, so it always says what to do next */}
        <div className="pointer-events-none absolute inset-x-0 bottom-safe-[2.5rem] z-10 flex justify-center">
          <span
            data-engine="reel-cue-a"
            className="engine-driven absolute whitespace-nowrap text-label text-[#1a1714]"
          >
            {reduced ? "SCROLL TO OPEN" : "SCROLL TO EXPAND"}
          </span>
          <span
            data-engine="reel-cue-b"
            className="engine-driven absolute flex items-center gap-3 whitespace-nowrap text-label text-[#141210] opacity-0"
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
