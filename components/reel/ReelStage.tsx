"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { view } from "@/lib/state";
import MaskRoom from "./MaskRoom";
import MaskHeadline from "./MaskHeadline";
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
          /* The engine writes this element's size and its `data-open` (which
             the shader reads) from outside React, and it starts writing
             before hydration finishes. The attribute is rendered here so the
             server's HTML carries it too. */
          data-open="0"
          suppressHydrationWarning
          className="engine-driven relative overflow-hidden bg-[#f1ece1]"
          style={{
            width: "26vw",
            height: "40vh",
            borderRadius: "16px",
            /* The headline lives in its own layer behind the piece, and the
               small print has to start below it: both read this. */
            "--head-size": "clamp(3.4rem, 17.2vw, 17rem)",
            "--head-top": "var(--nav-h)",
          } as CSSProperties}
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
                "radial-gradient(26% 26% at var(--mask-x, 50%) 74%, rgba(72,54,36,0.22) 0%, rgba(72,54,36,0.1) 44%, transparent 76%)",
            }}
            aria-hidden="true"
          />

          {/* The headline sits BEHIND the piece, as the comp has it: the mask
              stands in front of its own name, and the wood inside the letters
              is the same scene, turning with it. */}
          <div
            data-engine="reel-headlayer"
            className="engine-driven pointer-events-none absolute inset-x-0 top-0 px-3 opacity-0 md:px-4"
            style={{ paddingTop: "var(--head-top)" }}
          >
            <div data-engine="reel-head" className="engine-driven w-full">
              <MaskHeadline />
            </div>
          </div>

          <MaskScene className="absolute inset-0 h-full w-full" />

          {/* ------------------------------------------------ the sheet --
              The comp's page, in its order: two lines of headline knocked
              out of the mask's own texture, a justified paragraph across the
              full measure under them, the piece standing through all of it,
              and two columns of small print signed in the serif at the foot.
              Nothing else — the headline carries the colour, so the paper
              behind it stays empty. */}
          <div
            data-engine="reel-poster"
            className="engine-driven pointer-events-none absolute inset-0 opacity-0"
          >
            <div
              className="absolute inset-x-0 top-0 px-gutter"
              /* two lines of headline at 0.78 leading, then a line of air */
              style={{
                paddingTop:
                  "calc(var(--head-top) + var(--head-h, 34vh) + 0.6rem)",

              }}
            >
              <div className="mx-auto w-full max-w-page">
                <p
                  className="hidden text-justify text-[0.8125rem] leading-[1.45] text-[#171512] md:block"
                  style={{ fontFamily: "var(--font-cond)", fontWeight: 600 }}
                >
                  A carved mask, hung in the middle of this page and lit by one
                  lamp above it, turning to follow whoever is looking at it.
                  Its four eyes, its ears and the lotus on its nose are carved
                  rather than painted on, and the wood is left to say the rest.
                  It is drawn here as it was scanned — 91,213 triangles of it —
                  and the letters above are filled with its own surface.
                </p>
              </div>
            </div>

            <div className="absolute inset-x-0 bottom-[clamp(2.5rem,6vh,4rem)] px-gutter">
              <div className="mx-auto grid w-full max-w-page items-end gap-6 md:grid-cols-2 md:gap-16">
                <div>
                  <p
                    className="text-[clamp(1.2rem,2.2vw,1.9rem)] leading-[1.05] text-[#141210]"
                    style={{ fontFamily: "var(--font-serif-display)", fontWeight: 700 }}
                  >
                    Bangsangsi Mask
                  </p>
                  <p
                    className="mt-1.5 max-w-[46ch] text-justify text-[0.8125rem] leading-[1.4] text-[#171512]"
                    style={{ fontFamily: "var(--font-cond)", fontWeight: 600 }}
                  >
                    Carved wood, four eyes, ears set proud of the head: the
                    piece is scanned, quantised to 1.5MB, and drawn straight
                    against WebGL2 with no scene library behind it.
                  </p>
                </div>

                <p
                  className="hidden max-w-[46ch] justify-self-end text-justify text-[0.8125rem] leading-[1.4] text-[#171512] md:block"
                  style={{ fontFamily: "var(--font-cond)", fontWeight: 600 }}
                >
                  One mesh, one lamp above it and one shader: a warm key from
                  the upper left, a cool fill from the lower right that opens
                  the shadow without filling it, and a rim behind the left
                  shoulder that cuts the silhouette off the paper.
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
