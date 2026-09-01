"use client";

import { useRef } from "react";
import { view } from "@/lib/state";

/**
 * Pointer-following glow + magnetic pull. Pure CSS transitions — never touches
 * the WebGL frame loop.
 */
export default function MagneticButton({
  href,
  children,
  className = "",
  onClick,
  strength = 0.28,
}: {
  href?: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  strength?: number;
}) {
  const ref = useRef<HTMLElement>(null);
  const inner = useRef<HTMLSpanElement>(null);

  const move = (e: React.PointerEvent) => {
    const el = ref.current;
    if (!el || view.reduced || view.mobile) return;
    const r = el.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    el.style.transform = `translate3d(${dx * strength}px, ${dy * strength}px, 0)`;
    if (inner.current)
      inner.current.style.transform = `translate3d(${dx * strength * 0.4}px, ${dy * strength * 0.4}px, 0)`;
    el.style.setProperty("--gx", `${e.clientX - r.left}px`);
    el.style.setProperty("--gy", `${e.clientY - r.top}px`);
  };

  const reset = () => {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "translate3d(0,0,0)";
    if (inner.current) inner.current.style.transform = "translate3d(0,0,0)";
  };

  const cls = [
    "relative inline-flex items-center gap-3 overflow-hidden border border-white/25",
    "px-7 py-4 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink",
    "transition-[transform,border-color,background-color] duration-500",
    "hover:border-accent hover:bg-accent-soft",
    className,
  ].join(" ");

  const style = { transitionTimingFunction: "cubic-bezier(.16,1,.3,1)" } as const;

  const glow = (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover/mag:opacity-100"
      style={{
        background:
          "radial-gradient(140px circle at var(--gx,50%) var(--gy,50%), rgba(255,77,28,0.35), transparent 65%)",
      }}
    />
  );

  const body = (
    <>
      {glow}
      <span ref={inner} className="relative z-10 inline-flex items-center gap-3">
        {children}
      </span>
    </>
  );

  if (href) {
    return (
      <a
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onPointerMove={move}
        onPointerLeave={reset}
        className={`group/mag ${cls}`}
        style={style}
      >
        {body}
      </a>
    );
  }

  return (
    <button
      ref={ref as React.Ref<HTMLButtonElement>}
      onPointerMove={move}
      onPointerLeave={reset}
      onClick={onClick}
      className={`group/mag ${cls}`}
      style={style}
    >
      {body}
    </button>
  );
}
