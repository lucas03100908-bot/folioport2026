"use client";

import { useLayoutEffect } from "react";
import {
  CATEGORIES,
  CATEGORY_TINT,
  countFor,
  projectsFor,
  type CategoryId,
} from "@/lib/content";
import RulerCarousel, { type RailItem } from "./RulerCarousel";
import { useWork } from "./WorkProvider";

/** vh of page scroll spent on each item of the rail. */
const VH_PER_ITEM = 58;

/**
 * Stage 2 — one rule carousel, twice over.
 *
 * It starts holding the three disciplines. Press the tank on the centre mark
 * and the same rail refills with that discipline's projects; press it again on
 * a project and the detail opens. Page scroll drives the rail in both states,
 * so there is only ever one thing to learn.
 */
export default function WorkStage() {
  const { category, setCategory, open } = useWork();
  const isOpen = category !== "all";
  const decks = CATEGORIES.filter((c) => c.id !== "all");
  const projects = isOpen ? projectsFor(category as CategoryId) : [];
  const label = CATEGORIES.find((c) => c.id === category)?.label ?? "";

  const items: RailItem[] = isOpen
    ? projects.map((p) => ({
        key: p.id,
        eyebrow: p.eyebrow,
        title: p.title,
        tint: CATEGORY_TINT[p.category],
        tags: p.tags,
        still: p.thumbnail,
      }))
    : decks.map((c) => ({
        key: c.id,
        eyebrow: `${String(countFor(c.id)).padStart(2, "0")} Projects`,
        title: c.label,
        tint: CATEGORY_TINT[c.id as CategoryId],
        // no still: a discipline is not a picture, and the liquid is the
        // thing that distinguishes it. Stills belong to projects.
      }));

  // the well's height follows the item count — the engine must re-measure
  useLayoutEffect(() => {
    window.dispatchEvent(new CustomEvent("minho:layout"));
  }, [category]);

  const activate = (i: number) => {
    if (isOpen) {
      const p = projects[i];
      if (p) open(p);
    } else {
      const c = decks[i];
      if (c) setCategory(c.id as CategoryId);
    }
  };

  return (
    <section
      data-stage="work"
      className="pointer-events-auto relative w-full"
      style={{ height: `calc(100svh + ${items.length * VH_PER_ITEM}vh)` }}
    >
      <div className="sticky top-0 flex h-svh w-full flex-col overflow-hidden">
        <header className="shrink-0 px-5 pt-[calc(var(--nav-h)+4vh)] md:px-12">
          <div className="mx-auto w-full max-w-[1500px]">
            {isOpen ? (
              <>
                <button
                  onClick={() => setCategory("all")}
                  className="eyebrow eyebrow-dim flex items-center gap-2 transition-colors duration-300 hover:text-accent"
                >
                  <svg width="16" height="9" viewBox="0 0 16 9" aria-hidden>
                    <path
                      d="M16 4.5H2M6 1 2 4.5 6 8"
                      stroke="currentColor"
                      strokeWidth="1.2"
                      fill="none"
                    />
                  </svg>
                  All work
                </button>
                <h2 className="display mt-3 text-[clamp(1.5rem,3vw,2.4rem)]">
                  {label}
                </h2>
              </>
            ) : (
              <>
                <p className="eyebrow">Selected Work</p>
                <h2 className="display mt-3 text-[clamp(1.5rem,3vw,2.4rem)]">
                  Choose a discipline
                </h2>
              </>
            )}
          </div>
        </header>

        <div key={category} className="min-h-0 flex-1">
          <RulerCarousel
            items={items}
            cta={isOpen ? "View Project" : "Enter"}
            tall={!isOpen}
            liquid={!isOpen}
            onActivate={activate}
          />
        </div>

        <p className="pointer-events-none shrink-0 pb-7 text-center font-mono text-[12px] tracking-[0.18em] text-muted md:text-[10px] md:tracking-[0.24em] md:text-faint">
          SCROLL TO BROWSE
        </p>
      </div>
    </section>
  );
}
