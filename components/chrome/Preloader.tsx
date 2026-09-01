"use client";

import { useEffect, useRef, useState } from "react";
import { BASE_HEX } from "@/lib/theme";

/**
 * Covers the page until the WebGL scene has drawn its first frame
 * (<Scene/> dispatches "minho:ready"), then dissolves.
 */
export default function Preloader() {
  const [gone, setGone] = useState(false);
  const [pct, setPct] = useState(0);
  const done = useRef(false);

  useEffect(() => {
    let raf = 0;
    const start = performance.now();

    const creep = () => {
      // creeps toward 92% while waiting, snaps to 100 on ready
      const t = (performance.now() - start) / 1400;
      setPct((p) => (done.current ? 100 : Math.max(p, Math.min(92, t * 92))));
      raf = requestAnimationFrame(creep);
    };
    raf = requestAnimationFrame(creep);

    const onReady = () => {
      done.current = true;
      setPct(100);
      window.setTimeout(() => setGone(true), 620);
    };
    window.addEventListener("minho:ready", onReady, { once: true });
    // hard safety net: never trap the visitor behind the loader
    const bail = window.setTimeout(onReady, 6000);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(bail);
      window.removeEventListener("minho:ready", onReady);
    };
  }, []);

  if (gone) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-between px-5 pb-10 transition-opacity duration-500 md:px-12"
      style={{
        background: BASE_HEX,
        opacity: pct >= 100 ? 0 : 1,
        pointerEvents: pct >= 100 ? "none" : "auto",
      }}
      aria-hidden={pct >= 100}
    >
      <span className="eyebrow">Minho — Portfolio</span>
      <span className="font-mono text-[11px] tracking-[0.2em] text-muted tabular-nums">
        {String(Math.round(pct)).padStart(3, "0")}
      </span>
      <span
        className="absolute inset-x-0 bottom-0 h-px origin-left bg-accent transition-transform duration-300"
        style={{ transform: `scaleX(${pct / 100})` }}
      />
    </div>
  );
}
