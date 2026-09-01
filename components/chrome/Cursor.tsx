"use client";

import { useEffect, useState } from "react";

/** Lagged reticle — position is written by <ScrollEngine/> with the same damp(). */
export default function Cursor() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    const fine =
      window.matchMedia("(pointer: fine)").matches &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine) return;
    setOn(true);
    document.documentElement.classList.add("has-cursor");
    return () => document.documentElement.classList.remove("has-cursor");
  }, []);

  if (!on) return null;

  return (
    <div
      data-engine="cursor"
      className="engine-driven pointer-events-none fixed left-0 top-0 z-[100] h-8 w-8"
      aria-hidden="true"
    >
      <span className="absolute inset-0 rounded-full border border-white/45" />
      <span className="absolute left-1/2 top-1/2 h-[3px] w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent" />
    </div>
  );
}
