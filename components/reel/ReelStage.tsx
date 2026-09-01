"use client";

import { useEffect, useRef, useState } from "react";
import { SHOWREEL_PLAYBACK_RATE, SHOWREEL_SRC } from "@/lib/content";
import { view } from "@/lib/state";

/**
 * Stage 3 — the reel opens up.
 *
 * A tall scroll well with a sticky frame: scrolling grows the media from a
 * small card to full bleed while "SHOWREEL" and "2026" part to the edges,
 * blended with `difference` so they invert over the footage — the same trick
 * that carries the hero.
 *
 * Two deliberate departures from the usual version of this effect:
 *
 *   1. **No scroll hijacking.** The common implementation calls
 *      `preventDefault()` on wheel and pins the page with `scrollTo(0, 0)`
 *      until the media is fully open. That fights Lenis, breaks keyboard and
 *      trackpad momentum, traps screen-reader users, and makes the browser's
 *      own scrollbar lie. Here the expansion is just a function of how far you
 *      have scrolled through a tall section — same picture, nothing stolen.
 *   2. **Playback is independent of scroll.** The film runs muted at 1.25× on
 *      its own clock; scroll only changes the size of the window onto it.
 *
 * Expansion finishes at ~55% of the well, so the last stretch is spent looking
 * at the full-bleed reel before the cue points on.
 */
export default function ReelStage() {
  const frame = useRef<HTMLDivElement>(null);
  const main = useRef<HTMLVideoElement>(null);
  const glow = useRef<HTMLVideoElement>(null);
  const inView = useRef(false);
  const [reduced, setReduced] = useState(false);

  useEffect(() => setReduced(view.reduced), []);

  /* playback: enter to play, leave to pause — never scroll-scrubbed */
  useEffect(() => {
    const stage = document.querySelector('[data-stage="reel"]');
    if (!stage || reduced) return;

    const sync = () => {
      const play = inView.current && document.visibilityState === "visible";
      for (const v of [main.current, glow.current]) {
        if (!v) continue;
        if (play) void v.play().catch(() => {});
        else v.pause();
      }
    };

    const io = new IntersectionObserver(
      (entries) => {
        inView.current = entries.some((e) => e.isIntersecting);
        sync();
      },
      { rootMargin: "-25% 0px -25% 0px", threshold: 0 },
    );
    io.observe(stage);
    document.addEventListener("visibilitychange", sync);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, [reduced]);

  /* browsers reset playbackRate on load, so re-assert it whenever it moves */
  useEffect(() => {
    const videos = [main.current, glow.current].filter(
      (v): v is HTMLVideoElement => v !== null,
    );
    const cleanups = videos.map((v) => {
      const apply = () => {
        if (v.playbackRate !== SHOWREEL_PLAYBACK_RATE) {
          v.playbackRate = SHOWREEL_PLAYBACK_RATE;
        }
      };
      apply();
      v.addEventListener("loadedmetadata", apply);
      v.addEventListener("ratechange", apply);
      return () => {
        v.removeEventListener("loadedmetadata", apply);
        v.removeEventListener("ratechange", apply);
      };
    });
    window.dispatchEvent(new CustomEvent("minho:layout"));
    return () => cleanups.forEach((c) => c());
  }, []);

  return (
    <section
      data-stage="reel"
      className="relative h-[300vh] w-full"
      aria-label="Showreel 2026"
    >
      <div className="sticky top-0 flex h-svh w-full items-center justify-center overflow-hidden">
        {/* blurred copy behind the frame — depth, not decoration */}
        <div
          data-engine="reel-glow"
          className="engine-driven pointer-events-none absolute inset-0 opacity-0"
          style={{ filter: "blur(70px) saturate(1.35)" }}
          aria-hidden="true"
        >
          <video
            ref={glow}
            className="h-full w-full object-cover"
            src={SHOWREEL_SRC}
            muted
            loop
            playsInline
            preload="auto"
          />
        </div>

        {/* the frame that grows */}
        <div
          ref={frame}
          data-engine="reel-frame"
          className="engine-driven relative overflow-hidden bg-black"
          style={{ width: "26vw", height: "40vh", borderRadius: "14px" }}
        >
          <video
            ref={main}
            className="h-full w-full object-cover"
            src={SHOWREEL_SRC}
            muted
            loop
            autoPlay
            playsInline
            preload="auto"
            aria-hidden="true"
          />
          <div
            data-engine="reel-veil"
            className="engine-driven pointer-events-none absolute inset-0 bg-black"
            style={{ opacity: 0.4 }}
          />
        </div>

        {/* SHOWREEL 2026 — a heavy stamp that dissolves as the film opens.
            No z-index anywhere on this chain, or the blend group would be
            isolated and the type would stop inverting. */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center px-5 md:px-10">
          <h2
            data-engine="reel-title"
            className="whitespace-nowrap text-center text-[clamp(2.2rem,7.5vw,6.5rem)] uppercase leading-none text-white"
            style={{
              mixBlendMode: "difference",
              // a heavy grotesque, not the Didone used elsewhere: this reads as
              // a stamp over the footage rather than a headline
              fontFamily: "var(--font-ui)",
              fontWeight: 900,
              letterSpacing: "-0.035em",
            }}
          >
            Showreel 2026
          </h2>
        </div>

        {/* one cue at a time, so it always says what to do next */}
        <div className="pointer-events-none absolute inset-x-0 bottom-10 z-10 flex justify-center">
          <span
            data-engine="reel-cue-a"
            className="engine-driven absolute font-mono text-[10px] tracking-[0.24em] text-muted"
          >
            SCROLL TO EXPAND
          </span>
          <span
            data-engine="reel-cue-b"
            className="engine-driven absolute flex items-center gap-3 font-mono text-[10px] tracking-[0.24em] text-accent opacity-0"
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
