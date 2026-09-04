"use client";

import { useEffect, useRef, useState } from "react";
import { BASE_HEX } from "@/lib/theme";
import { view } from "@/lib/state";

/**
 * Covers the page until the hero film has a frame to show, then hands over
 * slowly.
 *
 * It waits on two things and no more: the fonts, so the title does not swap
 * face a moment after the cover lifts, and `minho:ready` — one decoded frame
 * of the hero film, dispatched by <HeroBackground/>. Deliberately *not* the
 * whole 6.6MB: the rest streams in behind a frame that is already on screen,
 * and gating the page on the full download would put a spinner in front of a
 * visitor on cellular for half a minute.
 *
 * The progress it shows is real. There is a floor that creeps so the bar never
 * looks frozen, but it can only ever creep within the part that is genuinely
 * still outstanding.
 */

/** Nobody is held longer than this, whatever the network is doing. */
const CAP_MS = 4000;

/** Fonts are worth this much of the bar; the film is worth the rest. */
const FONT_SHARE = 0.35;

const WAKING = "MINHO";

export default function Preloader() {
  const [gone, setGone] = useState(false);
  const [done, setDone] = useState(false);
  const [pct, setPct] = useState(0);
  const reduced = useRef(false);
  const root = useRef<HTMLDivElement>(null);
  const letters = useRef<(HTMLSpanElement | null)[]>([]);

  /*
   * The cover is not a dead screen while it waits.
   *
   * A light follows the pointer and the letters lean into it — the same two
   * ideas the finished page already uses, the spiders' light on the last
   * screen and the magnetic pull on its buttons, so the first thing anyone
   * touches behaves the way the rest of it will.
   *
   * The lean is written to a wrapper, never to the letter itself: the letter
   * carries the CSS wake animation, and a running animation overrides inline
   * styles, so a transform written there would be silently discarded.
   */
  useEffect(() => {
    if (view.reduced) return;
    const el = root.current;
    if (!el) return;

    let px = window.innerWidth / 2;
    let py = window.innerHeight / 2;
    let ex = px;
    let ey = py;
    let raf = 0;

    const onMove = (e: PointerEvent) => {
      px = e.clientX;
      py = e.clientY;
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    const follow = () => {
      raf = requestAnimationFrame(follow);
      // eased, so the light trails the pointer instead of being pinned to it
      ex += (px - ex) * 0.12;
      ey += (py - ey) * 0.12;
      el.style.setProperty("--px", `${ex.toFixed(1)}px`);
      el.style.setProperty("--py", `${ey.toFixed(1)}px`);

      for (const l of letters.current) {
        if (!l) continue;
        const r = l.getBoundingClientRect();
        const dx = ex - (r.left + r.width / 2);
        const dy = ey - (r.top + r.height / 2);
        const d = Math.hypot(dx, dy);
        // only the letters the light is actually near are moved
        const pull = Math.max(0, 1 - d / 260);
        const k = pull * pull * 13;
        l.style.transform = `translate(${((dx / (d || 1)) * k).toFixed(2)}px, ${(
          (dy / (d || 1)) *
          k
        ).toFixed(2)}px)`;
      }
    };
    raf = requestAnimationFrame(follow);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  useEffect(() => {
    reduced.current = view.reduced;

    let raf = 0;
    let fonts = 0;
    let film = 0;
    let finished = false;
    const start = performance.now();

    const tick = () => {
      const elapsed = performance.now() - start;
      const real = fonts * FONT_SHARE + film * (1 - FONT_SHARE);

      /* The creep only ever fills the space that is still genuinely waiting,
         so it reads as progress rather than as a stand-in for it. */
      const headroom = 1 - real;
      const creep = headroom * Math.min(0.55, elapsed / CAP_MS);
      const target = finished ? 1 : real + creep;
      const next = Math.max(0, Math.min(100, target * 100));

      /* Only when the *displayed* figure moves. Setting state every frame
         re-rendered this component sixty times a second for the whole load —
         to redraw a number that changes about a hundred times in total. */
      setPct((p) => (Math.round(next) === Math.round(p) ? p : Math.max(p, next)));

      if (!finished) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    const finish = (viaCap = false) => {
      if (finished) return;
      finished = true;
      cancelAnimationFrame(raf); // nothing left to count
      setPct(100);
      setDone(true);
      /* The unhurried handoff is for the case where it worked: the film is
         ready and the cover has earned its moment. Reaching the cap instead
         means something went wrong, and the right thing then is to get out of
         the way rather than to linger over a hero that has no footage yet. */
      const hold = reduced.current || viaCap ? 380 : 1500;
      window.setTimeout(() => setGone(true), hold);
    };

    const onReady = () => {
      film = 1;
      finish();
    };
    window.addEventListener("minho:ready", onReady, { once: true });

    // fonts are a smaller share and never block on their own
    document.fonts?.ready.then(() => {
      fonts = 1;
    });

    // hard safety net: a failed or missing video must not trap the visitor
    const bail = window.setTimeout(() => finish(true), CAP_MS);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(bail);
      window.removeEventListener("minho:ready", onReady);
    };
  }, []);

  if (gone) return null;

  return (
    <div
      ref={root}
      role="status"
      aria-label="Loading"
      className="preload-cover fixed inset-0 z-[200] flex flex-col items-center justify-center"
      style={{
        background: BASE_HEX,
        opacity: done ? 0 : 1,
        /* Slow on purpose. The film underneath is a slow thing, and a cover
           that snaps away makes the first frame feel like a jump cut. */
        transition: "opacity 1100ms cubic-bezier(0.4, 0, 0.2, 1)",
        pointerEvents: done ? "none" : "auto",
      }}
      aria-hidden={done}
    >
      {/* the light itself, under the type */}
      <span aria-hidden className="preload-light" />

      <p className="display relative flex text-[clamp(2.6rem,11vw,5.5rem)] leading-none text-ink">
        {WAKING.split("").map((c, i) => (
          <span
            key={i}
            ref={(n) => {
              letters.current[i] = n;
            }}
            className="inline-block will-change-transform"
          >
            <span
              className="preload-letter inline-block"
              style={{ animationDelay: `${i * 0.11}s` }}
            >
              {c}
            </span>
          </span>
        ))}
      </p>

      <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.34em] text-muted">
        is waking
      </p>

      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between px-5 pb-10 md:px-12">
        <span className="eyebrow">Minho — Portfolio</span>
        <span className="font-mono text-[11px] tracking-[0.2em] text-muted tabular-nums">
          {String(Math.round(pct)).padStart(3, "0")}
        </span>
      </div>

      <span
        className="absolute inset-x-0 bottom-0 h-px origin-left bg-accent"
        style={{
          transform: `scaleX(${pct / 100})`,
          transition: "transform 420ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />
    </div>
  );
}
