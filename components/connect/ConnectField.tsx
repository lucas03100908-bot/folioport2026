"use client";

import { useEffect, useState } from "react";
import { SOCIALS } from "@/lib/content";
import { cn } from "@/lib/utils";

/** How long the screen waits before it stops hiding its own links. */
const IDLE_REVEAL_MS = 3800;

/**
 * Stage 4's background: large repeating links drifting in alternating
 * directions. Every word is a real <a>.
 *
 * The screen is dark and out of focus by default. It is drawn twice:
 *
 *   • the **base** layer is dimmed and gaussian-blurred — the far distance, and
 *     the layer that actually holds the links
 *   • a **sharp** copy sits exactly on top, bright and in focus, masked down to
 *     two soft circles that <Spider/> parks on the spiders every frame
 *
 * So wherever the spiders walk, the words there come forward — lit and in
 * focus — while everything else stays back. That focus gradient is the depth;
 * brightness alone would read as a flat spotlight.
 *
 * The sharp copy is inert (`aria-hidden`, no pointer events): the base layer
 * underneath is identical in position, so clicks and screen readers land on the
 * real links regardless of where the light happens to be.
 */
const ROWS = 6;
const REPEATS = 4;

function Rows({ interactive }: { interactive: boolean }) {
  return (
    <>
      {Array.from({ length: ROWS }).map((_, row) => {
        const rtl = row % 2 === 1;
        const dur = 34 + (row % 3) * 11;
        return (
          <div key={row} className="flex w-full overflow-hidden">
            <div
              className="flex shrink-0 items-center whitespace-nowrap"
              style={{
                animation: `marquee-${rtl ? "r" : "l"} ${dur}s linear infinite`,
              }}
            >
              {Array.from({ length: REPEATS }).map((__, rep) =>
                SOCIALS.map((s) =>
                  interactive ? (
                    <a
                      key={`${row}-${rep}-${s.label}`}
                      data-engine="connect-word"
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="display px-[0.18em] text-[clamp(2rem,6vw,5.5rem)] transition-colors duration-300 hover:text-accent focus-visible:text-accent"
                    >
                      {s.label}
                      <span aria-hidden className="ml-[0.18em] text-accent">
                        ·
                      </span>
                    </a>
                  ) : (
                    <span
                      key={`${row}-${rep}-${s.label}`}
                      className="display px-[0.18em] text-[clamp(2rem,6vw,5.5rem)]"
                    >
                      {s.label}
                      <span className="ml-[0.18em] text-accent">·</span>
                    </span>
                  ),
                ),
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}

export default function ConnectField() {
  const [active, setActive] = useState(false);
  /** true once the visitor has held still long enough to be shown the links */
  const [idle, setIdle] = useState(false);

  useEffect(() => {
    const stage = document.querySelector('[data-stage="connect"]');
    if (!stage) return;
    const io = new IntersectionObserver(
      (entries) => setActive(entries.some((e) => e.isIntersecting)),
      { rootMargin: "-25% 0px -25% 0px", threshold: 0 },
    );
    io.observe(stage);
    return () => io.disconnect();
  }, []);

  /*
   * If nobody moves, show them the links.
   *
   * The spiders reveal this screen, which is the point of it — but the screen's
   * one job is to let someone reach Minho, and until a spider wandered past,
   * every link was blurred and half transparent. Someone who came here to find
   * an Instagram handle had to hunt for it, and on a phone that refused the
   * gyroscope the spiders barely move at all.
   *
   * So the effect keeps the first impression and then yields: hold still for a
   * few seconds and the field simply comes into focus. Any movement hands it
   * back to the spiders.
   */
  useEffect(() => {
    if (!active) {
      setIdle(false);
      return;
    }
    let t = 0;
    const wake = () => {
      setIdle(false);
      window.clearTimeout(t);
      t = window.setTimeout(() => setIdle(true), IDLE_REVEAL_MS);
    };
    wake();
    const opts = { passive: true } as const;
    for (const e of ["pointermove", "pointerdown", "touchstart", "wheel"])
      window.addEventListener(e, wake, opts);
    return () => {
      window.clearTimeout(t);
      for (const e of ["pointermove", "pointerdown", "touchstart", "wheel"])
        window.removeEventListener(e, wake);
    };
  }, [active]);

  const shell =
    "connect-field fixed inset-0 z-[11] flex flex-col justify-center gap-[1.5vh] overflow-hidden transition-opacity duration-[900ms] ease-out";

  return (
    <>
      {/* far: dimmed, out of focus — and the layer that owns the links */}
      <div
        className={cn(
          shell,
          "connect-far",
          idle ? "connect-far-lit text-white/90" : "text-white/50",
        )}
        style={{
          opacity: active ? 1 : 0,
          pointerEvents: active ? "auto" : "none",
        }}
        aria-label="Social links"
      >
        <Rows interactive />
      </div>

      {/* near: lit and sharp, but only in the circles the spiders carry */}
      <div
        data-connect-sharp
        aria-hidden="true"
        className={cn(shell, "connect-near pointer-events-none text-white")}
        style={{ opacity: active ? 1 : 0 }}
      >
        <Rows interactive={false} />
      </div>

      <style>{`
        @keyframes marquee-l { from { transform: translate3d(0,0,0) } to { transform: translate3d(-50%,0,0) } }
        @keyframes marquee-r { from { transform: translate3d(-50%,0,0) } to { transform: translate3d(0,0,0) } }
        @media (prefers-reduced-motion: reduce) {
          .connect-field * { animation: none !important; }
        }
      `}</style>
    </>
  );
}
