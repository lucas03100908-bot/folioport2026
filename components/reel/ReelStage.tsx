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
          className="engine-driven relative overflow-hidden bg-[#040404]"
          style={{ width: "26vw", height: "40vh", borderRadius: "16px" }}
        >
          {/* The room: a painted wall of mountains under a cobalt sky, then
              the light in the air over it — a red band burning along the
              ridge line, the lamp's spill above, and the pool that lamp
              throws on the floor. The shader takes its own rim from the band,
              so the light in the air and the light on the mask are one
              light. */}
          <MaskRoom />
          <div
            data-engine="reel-horizon"
            className="engine-driven pointer-events-none absolute inset-0 opacity-0"
            style={{
              background:
                "linear-gradient(180deg, transparent 0%, transparent 62%, rgba(255,120,40,0.1) 66%, rgba(255,150,70,0.16) 70%, rgba(255,120,40,0.06) 74%, transparent 80%)",
              mixBlendMode: "screen",
            }}
            aria-hidden="true"
          />
          <div
            data-engine="reel-glow"
            className="engine-driven pointer-events-none absolute inset-0 opacity-0"
            style={{
              background:
                "radial-gradient(40% 32% at var(--mask-x, 50%) -6%, rgba(255,238,214,0.4) 0%, rgba(255,186,130,0.1) 46%, transparent 74%)",
            }}
            aria-hidden="true"
          />
          {/* The wall darkens behind the piece — without it the mask reads
              as a cut-out laid on the painting rather than a thing standing
              in front of it. */}
          <div
            data-engine="reel-seat"
            className="engine-driven pointer-events-none absolute inset-0 opacity-0"
            style={{
              background:
                "radial-gradient(26% 34% at var(--mask-x, 50%) 68%, rgba(2,6,30,0.62) 0%, rgba(2,6,30,0.32) 45%, transparent 76%)",
            }}
            aria-hidden="true"
          />
          <MaskScene className="absolute inset-0 h-full w-full" />
          {/* cinema: the corners fall away, and the whole frame keeps a little
              of the lamp's warmth */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(102% 82% at 50% 52%, transparent 34%, rgba(2,6,26,0.3) 66%, rgba(1,3,16,0.62) 88%, rgba(0,2,12,0.78) 100%)",
            }}
          />
          {/* The floor. In the reference room the only other lit thing is
              the ground: a wide, soft pool directly under the piece that
              falls to black well before the edges of the frame. It is an
              ellipse rather than a circle because the floor is seen at a
              grazing angle. */}
          <div
            data-engine="reel-pool"
            className="engine-driven pointer-events-none absolute inset-x-0 bottom-0 h-[42%] opacity-0"
            style={{
              background:
                "radial-gradient(48% 120% at var(--mask-x, 50%) 118%, rgba(255,246,232,0.42) 0%, rgba(255,226,196,0.22) 26%, rgba(210,160,120,0.08) 52%, transparent 78%)",
            }}
            aria-hidden="true"
          />
          <div
            data-engine="reel-veil"
            className="engine-driven pointer-events-none absolute inset-0 bg-black"
            style={{ opacity: 0.18 }}
          />

          {/* ------------------------------------------------ the poster --
              The sheet the reference prints: the headline across the top in
              two heavy lines with the wordmark tucked into its first line,
              the small print justified straight underneath it, and the
              subject below that — the type is the top of the page and the
              piece is the bottom of it. Set once the case is open; at card
              size there is no room for type, and type shrunk to fit is not
              type. */}
          <div
            data-engine="reel-poster"
            className="engine-driven pointer-events-none absolute inset-0 opacity-0"
          >
            <div className="absolute inset-0 px-gutter pb-[clamp(3.5rem,8vh,5rem)] pt-[calc(var(--nav-h)+1.5rem)]">
              <div className="mx-auto w-full max-w-page">
                <div className="relative">
                  {/* the mark sits inside the headline's first line, as the
                      reference sheet sets its own */}
                  <p className="display absolute top-[0.1em] left-[0.06em] text-display-4 text-white md:left-[0.08em]">
                    Minho
                  </p>
                  <p
                    className="whitespace-nowrap text-[clamp(3.2rem,13.5vw,12rem)] font-black uppercase leading-[0.84] text-white"
                    style={{ fontFamily: "var(--font-ui)", letterSpacing: "-0.05em" }}
                  >
                    <span className="block pl-[4.6em] md:pl-[3.4em]">Tal</span>
                    <span className="block">Looks back</span>
                  </p>
                </div>

                <div className="mt-3 h-0.5 w-full bg-white/90" />
                <p className="mt-3 hidden max-w-[54ch] text-justify text-small text-white/90 md:block">
                  A carved mask, lit by one lamp hung above it, turning to
                  follow whoever is looking at it. One mesh of 91,213
                  triangles, one light and one shader, drawn straight against
                  WebGL2 — no scene library, 1.5MB all in.
                </p>
              </div>

              <div className="absolute inset-x-0 bottom-[clamp(3.5rem,8vh,5rem)] px-gutter">
                <div className="mx-auto flex w-full max-w-page items-end justify-between gap-6">
                  <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden className="text-white">
                    <path d="M11 0v22M0 11h22" stroke="currentColor" strokeWidth="2" />
                  </svg>
                  <p className="flex items-center gap-5 font-mono text-meta text-white/85">
                    <span>WEBGL2</span>
                    <span className="hidden sm:inline">SPOT · 1 LAMP</span>
                    <span>NO LIBRARY</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* one cue at a time, so it always says what to do next */}
        <div className="pointer-events-none absolute inset-x-0 bottom-safe-[2.5rem] z-10 flex justify-center">
          <span
            data-engine="reel-cue-a"
            className="engine-driven absolute whitespace-nowrap text-label text-white [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]"
          >
            {reduced ? "SCROLL TO OPEN" : "SCROLL TO EXPAND"}
          </span>
          <span
            data-engine="reel-cue-b"
            className="engine-driven absolute flex items-center gap-3 whitespace-nowrap text-label text-white opacity-0 [text-shadow:0_1px_2px_rgba(0,0,0,0.5)]"
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
