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
          className="engine-driven relative overflow-hidden bg-[#040404]"
          style={{ width: "26vw", height: "40vh", borderRadius: "16px" }}
        >
          {/* The room, in three flat layers behind the piece: a red band
              burning on the horizon, the lamp's spill above it, and the pool
              that lamp throws on the floor. The shader takes its own rim from
              the band, so the light in the air and the light on the mask are
              the same light. */}
          <div
            data-engine="reel-horizon"
            className="engine-driven pointer-events-none absolute inset-0 opacity-0"
            style={{
              background:
                "linear-gradient(180deg, #040404 0%, #090403 44%, rgba(198,44,14,0.55) 57%, rgba(255,96,36,0.92) 61.5%, rgba(255,150,80,0.5) 64%, rgba(90,16,5,0.35) 70%, #040303 84%, #030303 100%)",
            }}
            aria-hidden="true"
          />
          <div
            data-engine="reel-glow"
            className="engine-driven pointer-events-none absolute inset-0 opacity-0"
            style={{
              background:
                "radial-gradient(56% 42% at 50% 2%, rgba(255,226,190,0.30) 0%, rgba(255,150,80,0.09) 44%, transparent 76%)",
            }}
            aria-hidden="true"
          />
          <MaskScene className="absolute inset-0 h-full w-full" />
          {/* the pool on the floor, over the mask's own foot so the piece
              stands in the light rather than in front of it */}
          <div
            data-engine="reel-pool"
            className="engine-driven pointer-events-none absolute inset-x-0 bottom-0 h-[38%] opacity-0"
            style={{
              background:
                "radial-gradient(60% 100% at 50% 100%, rgba(255,190,140,0.20) 0%, rgba(255,120,60,0.06) 45%, transparent 78%)",
            }}
            aria-hidden="true"
          />
          {/* cinema: the corners fall away, and the whole frame keeps a little
              of the lamp's warmth */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(120% 90% at 50% 42%, transparent 38%, rgba(0,0,0,0.55) 78%, rgba(0,0,0,0.88) 100%)",
            }}
          />
          <div
            data-engine="reel-veil"
            className="engine-driven pointer-events-none absolute inset-0 bg-black"
            style={{ opacity: 0.28 }}
          />

          {/* ------------------------------------------------ the poster --
              Hard blocks, one heavy word, and a justified paragraph: the
              stage reads as a printed sheet laid over the room. It is only
              set once the case is open — at card size there is no room for
              type, and type shrunk to fit is not type. */}
          <div
            data-engine="reel-poster"
            className="engine-driven pointer-events-none absolute inset-0 opacity-0"
          >
            <div className="absolute inset-0 px-gutter pb-[clamp(3.5rem,8vh,5rem)] pt-[calc(var(--nav-h)+1.25rem)]">
              <div className="mx-auto flex h-full w-full max-w-page flex-col justify-between">
                <div className="flex items-start justify-between gap-4">
                  <span className="whitespace-nowrap bg-accent px-2.5 py-2 text-label uppercase text-black">
                    Realtime<span className="hidden sm:inline"> · WebGL</span>
                  </span>
                  <span className="whitespace-nowrap border-2 border-white px-2.5 py-2 text-label uppercase text-ink">
                    <span className="hidden sm:inline">One lamp · </span>91,213 tri
                  </span>
                </div>

                <div className="mt-auto">
                  <p
                    className="whitespace-nowrap text-[clamp(3.5rem,17vw,15rem)] font-black uppercase leading-[0.82] text-white"
                    style={{
                      fontFamily: "var(--font-ui)",
                      letterSpacing: "-0.045em",
                      mixBlendMode: "difference",
                    }}
                  >
                    Tal<span className="text-accent"> 탈</span>
                  </p>
                  {/* A justified block, set to the width of the word above
                      it — the poster's small print. It is desktop-only: on a
                      phone the same paragraph would be six lines over the
                      mask's chin and under the cue. */}
                  <p className="mt-5 hidden max-w-[62ch] text-justify text-small text-ink/75 md:block">
                    A carved mask, lit by one lamp hung above it, turning to
                    follow whoever is looking at it. One mesh of 91,213
                    triangles, one light and one shader, drawn straight against
                    WebGL2 — no scene library, 1.5MB all in.
                  </p>
                  <div className="mt-5 h-0.5 w-full max-w-[62ch] bg-white/85" />
                  <p className="mt-2.5 flex max-w-[62ch] items-center justify-between font-mono text-meta text-ink/70">
                    <span>WEBGL2</span>
                    <span>SPOT · 1 LAMP</span>
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
