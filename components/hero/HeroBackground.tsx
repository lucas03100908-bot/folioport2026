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
        void el.play().catch(() => {});
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
        /* TODO_ASSET — the real hero background film */
        src={HERO_BG_SRC}
        muted
        playsInline
        autoPlay
        loop
        preload="auto"
        className="absolute inset-0 h-full w-full object-cover"
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
