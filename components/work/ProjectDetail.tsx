"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import MagneticButton from "@/components/chrome/MagneticButton";
import { hasLink } from "@/lib/content";
import { view } from "@/lib/state";
import { useWork } from "./WorkProvider";

export default function ProjectDetail() {
  const { active, close } = useWork();
  const root = useRef<HTMLDivElement>(null);
  /** true while there is more panel below the fold and none of it seen yet */
  const [more, setMore] = useState(false);

  /*
   * On a short laptop the call to action sits below the fold with nothing to
   * say so. Rather than guess at a breakpoint, measure: the cue only appears
   * when this panel really does overflow, and goes as soon as it is scrolled.
   */
  useEffect(() => {
    const el = root.current;
    if (!active || !el) return;
    const check = () =>
      setMore(el.scrollHeight - el.clientHeight > 24 && el.scrollTop < 24);
    check();
    el.addEventListener("scroll", check, { passive: true });
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", check);
      ro.disconnect();
    };
  }, [active]);

  useLayoutEffect(() => {
    if (!active || !root.current) return;
    const ctx = gsap.context(() => {
      if (view.reduced) {
        gsap.set("[data-word], [data-detail-block], [data-detail-media]", {
          opacity: 1,
          y: 0,
          filter: "none",
        });
        gsap.set(root.current, { opacity: 1 });
        return;
      }
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.fromTo(root.current, { opacity: 0 }, { opacity: 1, duration: 0.35 })
        .fromTo(
          "[data-detail-media]",
          { opacity: 0, scale: 1.06, filter: "blur(14px)" },
          { opacity: 1, scale: 1, filter: "blur(0px)", duration: 0.9 },
          0.05,
        )
        .fromTo(
          "[data-word]",
          { opacity: 0, yPercent: 60, filter: "blur(12px)" },
          {
            opacity: 1,
            yPercent: 0,
            filter: "blur(0px)",
            duration: 0.75,
            stagger: 0.07,
          },
          0.12,
        )
        .fromTo(
          "[data-detail-block]",
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: 0.6, stagger: 0.06 },
          0.3,
        );
    }, root);
    /* Without this the pressed card keeps focus behind the overlay, so space
       and the arrow keys try to scroll a page that is locked. */
    root.current.focus({ preventScroll: true });
    return () => ctx.revert();
  }, [active]);

  if (!active) return null;

  const spec: [string, string][] = [
    ["Role", active.role],
    ["Tools", active.tools],
    ["Type", active.type],
    ["Year", active.year],
  ];

  return (
    <div
      ref={root}
      role="dialog"
      aria-modal="true"
      aria-label={active.title}
      tabIndex={-1}
      /* Lenis is stopped while this is open, and a stopped Lenis calls
         preventDefault() on every wheel and touch event it sees — which killed
         this panel's own scrolling before the browser could act on it. The
         attribute makes Lenis skip the event entirely and let it through. */
      data-lenis-prevent
      className="fixed inset-0 z-[70] overflow-y-auto overscroll-contain bg-black/92 backdrop-blur-xl"
      style={{ opacity: 0 }}
    >
      {/* Two ways out, at the two places people look for one. */}
      <button
        onClick={close}
        className="glass fixed left-5 top-5 z-10 flex items-center gap-2.5 rounded-full px-4 py-3 font-mono text-[11px] uppercase tracking-[0.2em] text-muted transition-colors duration-300 hover:text-accent md:left-8 md:top-8"
      >
        <svg width="16" height="9" viewBox="0 0 16 9" aria-hidden>
          <path
            d="M16 4.5H2M6 1 2 4.5 6 8"
            stroke="currentColor"
            strokeWidth="1.2"
            fill="none"
          />
        </svg>
        Back
      </button>

      <button
        onClick={close}
        aria-label="Close project"
        className="glass fixed right-5 top-5 z-10 flex h-11 w-11 items-center justify-center rounded-full text-muted transition-colors duration-300 hover:text-accent md:right-8 md:top-8"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
          <path d="M1 1 13 13M13 1 1 13" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      </button>

      {/* Padding and media scale with the viewport's *height*, not its width.
          A 1440x700 laptop is a wide screen and a short one, and fixed vertical
          rhythm on a short screen pushed the call to action off the bottom. */}
      <div
        className="mx-auto grid min-h-full max-w-[1400px] grid-cols-1 items-center gap-8 px-5 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-12"
        style={{
          paddingTop: "clamp(5rem, 12vh, 7rem)",
          paddingBottom: "clamp(3rem, 8vh, 6rem)",
        }}
      >
        {/* media */}
        <div data-detail-media className="relative">
          <div className="glass glass-rim relative overflow-hidden rounded-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={active.thumbnail}
              alt={`${active.title} still`}
              className="aspect-[3/2] max-h-[34vh] w-full object-cover lg:max-h-[52vh]"
            />
            {/* TODO_ASSET: swap for a <video> loop when the real cut exists */}
          </div>
          <p className="tagrow mt-4">
            {active.tags.map((t) => (
              <span key={t}>{t}</span>
            ))}
          </p>
        </div>

        {/* script */}
        <div className="relative">
          <div className="scrim pointer-events-none absolute -inset-10 -z-10 lg:hidden" />
          <p data-detail-block className="eyebrow">
            {active.eyebrow}
          </p>

          <h2 className="display mt-4 overflow-hidden text-[clamp(2.2rem,5.2vw,4.2rem)]">
            {active.title.split(" ").map((w, i) => (
              <span key={`${w}-${i}`} className="inline-block overflow-hidden">
                <span data-word className="inline-block">
                  {w}
                </span>
                {i < active.title.split(" ").length - 1 ? " " : null}
              </span>
            ))}
          </h2>

          <div data-detail-block className="hair my-6 lg:my-8" />

          <dl className="flex flex-col gap-2.5 lg:gap-3">
            {spec.map(([k, v]) => (
              <div data-detail-block key={k} className="dotted text-muted">
                <dt className="uppercase tracking-[0.18em] text-faint">{k}</dt>
                <dd className="text-ink">{v}</dd>
              </div>
            ))}
          </dl>

          <p
            data-detail-block
            /* `summary` keeps the portfolio's paragraph breaks as "\n\n" */
            className="mt-6 max-w-[52ch] whitespace-pre-line text-[14px] leading-[1.85] text-muted lg:mt-8"
          >
            {active.summary}
          </p>

          <div data-detail-block className="mt-8 lg:mt-10">
            {hasLink(active) ? (
              <MagneticButton href={active.projectUrl}>
                View Project
                <svg width="16" height="10" viewBox="0 0 16 10" aria-hidden>
                  <path
                    d="M0 5h14M10 1l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="1.3"
                    fill="none"
                  />
                </svg>
              </MagneticButton>
            ) : (
              /* no link recorded yet — say so rather than offering a dead
                 button. Add one at /studio while running `next dev`. */
              <span className="inline-flex items-center gap-3 border border-white/12 px-6 py-4 font-mono text-[10px] tracking-[0.22em] text-faint">
                LINK COMING SOON
              </span>
            )}
          </div>
        </div>
      </div>

      <div
        aria-hidden
        className={`pointer-events-none sticky bottom-0 -mt-24 flex h-24 items-end justify-center bg-gradient-to-t from-black/85 to-transparent pb-5 transition-opacity duration-500 ${
          more ? "opacity-100" : "opacity-0"
        }`}
      >
        <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-muted">
          Scroll for details
        </span>
      </div>
    </div>
  );
}
