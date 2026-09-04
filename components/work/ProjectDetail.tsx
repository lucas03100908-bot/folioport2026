"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import gsap from "gsap";
import MagneticButton from "@/components/chrome/MagneticButton";
import { EMAIL, hasLink } from "@/lib/content";
import { view } from "@/lib/state";
import { useWork } from "./WorkProvider";

export default function ProjectDetail() {
  const { active, close } = useWork();
  const root = useRef<HTMLDivElement>(null);
  /** whatever had focus when this opened, so it can be given back */
  const opener = useRef<HTMLElement | null>(null);
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
    /* Remember the card first — this is a layout effect and it is about to
       take focus away from it, so anything reading `activeElement` later would
       find the panel itself and have nowhere to hand focus back to. */
    opener.current = document.activeElement as HTMLElement | null;

    /* Without this the pressed card keeps focus behind the overlay, so space
       and the arrow keys try to scroll a page that is locked. */
    root.current.focus({ preventScroll: true });
    return () => ctx.revert();
  }, [active]);

  /*
   * Focus belongs to the panel while it is open, and goes back where it came
   * from when it closes.
   *
   * Tab used to walk straight out of the overlay and into the page behind it,
   * which is invisible and scroll-locked; and on close it fell to the top of
   * the document, so a keyboard visitor who opened the fourth card was
   * returned to the start of the site.
   */
  useEffect(() => {
    if (!active) return;
    const el = root.current;

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !el) return;
      const stops = el.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!stops.length) return;
      const first = stops[0];
      const last = stops[stops.length - 1];
      const on = document.activeElement;
      if (e.shiftKey && (on === first || on === el)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && on === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      opener.current?.focus?.({ preventScroll: true });
    };
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
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
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
                {/* Role / Tools / Type are written in Korean; Year is not */}
                <dd className="text-ink" lang={k === "Year" ? undefined : "ko"}>
                  {v}
                </dd>
              </div>
            ))}
          </dl>

          <p
            data-detail-block
            /* `summary` keeps the portfolio's paragraph breaks as "\n\n" */
            lang="ko"
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
              /* No link recorded yet. A dead button is worse than none, and
                 "coming soon" on its own reads as a broken control — so say
                 what is true and point at the way through instead. Add the
                 link at /studio while running `next dev`. */
              <p className="max-w-[38ch] text-[13px] leading-[1.7] text-faint">
                This project isn&rsquo;t published anywhere public yet.{" "}
                <a
                  href={`mailto:${EMAIL}?subject=${encodeURIComponent(
                    `About ${active.title}`,
                  )}`}
                  className="text-muted underline decoration-white/25 underline-offset-4 transition-colors duration-300 hover:text-accent"
                >
                  Ask me about it
                </a>
                .
              </p>
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
