"use client";

import { useLayoutEffect, useRef } from "react";
import gsap from "gsap";
import MagneticButton from "@/components/chrome/MagneticButton";
import { hasLink } from "@/lib/content";
import { view } from "@/lib/state";
import { useWork } from "./WorkProvider";

export default function ProjectDetail() {
  const { active, close } = useWork();
  const root = useRef<HTMLDivElement>(null);

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
      className="fixed inset-0 z-[70] overflow-y-auto overscroll-contain bg-black/92 backdrop-blur-xl"
      style={{ opacity: 0 }}
    >
      <button
        onClick={close}
        aria-label="Close project"
        className="glass fixed right-5 top-5 z-10 flex h-11 w-11 items-center justify-center rounded-full text-muted transition-colors duration-300 hover:text-accent md:right-8 md:top-8"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
          <path d="M1 1 13 13M13 1 1 13" stroke="currentColor" strokeWidth="1.4" />
        </svg>
      </button>

      <div className="mx-auto grid min-h-full max-w-[1400px] grid-cols-1 items-center gap-10 px-5 py-24 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16 lg:px-12">
        {/* media */}
        <div data-detail-media className="relative">
          <div className="glass glass-rim relative overflow-hidden rounded-lg">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={active.thumbnail}
              alt={`${active.title} still`}
              className="aspect-[3/2] w-full object-cover"
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

          <div data-detail-block className="hair my-8" />

          <dl className="flex flex-col gap-3">
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
            className="mt-8 max-w-[52ch] whitespace-pre-line text-[14px] leading-[1.85] text-muted"
          >
            {active.summary}
          </p>

          <div data-detail-block className="mt-10">
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
    </div>
  );
}
