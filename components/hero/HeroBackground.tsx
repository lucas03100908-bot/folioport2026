"use client";

import { useEffect, useRef, useState } from "react";
import { HERO_BG_SRC } from "@/lib/content";
import { view } from "@/lib/state";

/**
 * The full-bleed film behind the hero.
 *
 * Desktop: paused — <ScrollEngine/> maps scroll through the hero onto
 * currentTime, so the footage advances (and rewinds) with the wheel.
 * Mobile: muted autoplay loop, because seeking stutters there.
 * Reduced motion: paused on its first frame.
 *
 * The <video> is in the server-rendered markup and *stays* there: reduced
 * motion pauses it, it never removes it. Gating the element on client state
 * meant any hydration hiccup silently deleted the site's whole identity, and
 * left nothing but a flat gradient behind the title.
 */
export default function HeroBackground() {
  const v = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const el = v.current;
    if (!el) return;

    // the engine has already read the environment by the time this runs
    window.dispatchEvent(new CustomEvent("minho:layout"));

    const settle = () => {
      if (view.reduced) {
        el.pause();
        el.currentTime = 0;
      } else if (view.mobile) {
        el.loop = true;
        /*
         * Muted + playsInline is usually enough for autoplay, but phones still
         * refuse it often enough that a silently caught rejection leaves the
         * hero frozen on one frame. Retry on the first touch or scroll — by
         * then the browser counts the page as engaged.
         */
        void el.play().catch(() => {
          const retry = () => {
            void el.play().catch(() => {});
          };
          const opts = { once: true, passive: true } as const;
          window.addEventListener("touchstart", retry, opts);
          window.addEventListener("scroll", retry, opts);
          window.addEventListener("pointerdown", retry, opts);
        });
      } else {
        /* Desktop scrubs the film, and seeking to an arbitrary time needs it
           buffered — so here, and only here, ask for the whole thing. By now
           the first frame has already decoded, so this costs the loader
           nothing. */
        el.preload = "auto";
        el.loop = false;
        el.pause();
      }
    };

    /*
     * Two signals, deliberately separate.
     *
     * The cover only needs to know the film is coming, and metadata is enough
     * for that — with `preload="metadata"` a slow connection can sit at
     * HAVE_METADATA for a while, and waiting for a decoded frame there would
     * stall the loader all the way to its cap on every cold visit.
     *
     * The poster is the opposite: it must not fade until there is an actual
     * frame underneath it, or it fades to black.
     */
    const announce = () => {
      window.dispatchEvent(new CustomEvent("minho:ready"));
    };

    const onData = () => {
      setReady(true);
      settle();
      window.dispatchEvent(new CustomEvent("minho:layout"));
      announce();
    };

    if (el.readyState >= 1) announce();
    else el.addEventListener("loadedmetadata", announce, { once: true });

    if (el.readyState >= 2) onData();
    else el.addEventListener("loadeddata", onData, { once: true });

    return () => {
      el.removeEventListener("loadedmetadata", announce);
      el.removeEventListener("loadeddata", onData);
    };
  }, []);

  return (
    <div
      data-engine="hero-bg"
      className="engine-driven absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* poster placeholder — sits *behind* the video, so it only shows through
          until the first frame decodes (and if JS never runs, the video still
          paints over it) */}
      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{
          opacity: ready ? 0 : 1,
          background:
            "radial-gradient(120% 90% at 50% 40%, #1a1210 0%, #0a0a0c 55%, #000 100%)",
        }}
      />

      <video
        ref={v}
        data-engine="hero-bg-video"
        src={HERO_BG_SRC}
        muted
        playsInline
        autoPlay
        loop
        /*
         * Metadata in the markup, upgraded below once we know which screen
         * this is. `auto` here fetched all 6.3MB before the first frame was
         * even on screen — and a phone never needs that, because it loops the
         * film rather than scrubbing it, so it can stream as it plays.
         */
        preload="metadata"
        /*
         * Portrait phones crop a 16:9 film to a sliver — `cover` throws away
         * about three quarters of this frame and the particle wordmark stops
         * being readable. `contain` shows the whole composition, and the
         * letterboxing is invisible because the page behind it is the same
         * black. Landscape and desktop keep `cover`.
         */
        className="absolute inset-0 h-full w-full object-contain md:object-cover"
      />

      {/* holds the nav and the copy row legible; the title blends *through* it */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.1) 26%, rgba(0,0,0,0.28) 70%, rgba(0,0,0,0.82) 100%)",
        }}
      />
    </div>
  );
}
