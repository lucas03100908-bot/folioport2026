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
        // desktop: the film is a timeline that scroll scrubs
        el.loop = false;
        el.pause();
      }
    };

    const onData = () => {
      setReady(true);
      settle();
      window.dispatchEvent(new CustomEvent("minho:layout"));
      /* The film has a frame to show. This is what <Preloader/> waits on —
         one decoded frame, not the whole 6.6MB, so the handoff happens as
         soon as there is something behind the title. */
      window.dispatchEvent(new CustomEvent("minho:ready"));
    };

    if (el.readyState >= 2) onData();
    else el.addEventListener("loadeddata", onData, { once: true });
    return () => el.removeEventListener("loadeddata", onData);
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
        preload="auto"
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
