"use client";

import { useLayoutEffect, type CSSProperties } from "react";
import {
  CATEGORIES,
  CATEGORY_TINT,
  projectsFor,
} from "@/lib/content";
import { view } from "@/lib/state";
import RulerCarousel, { type RailItem } from "./RulerCarousel";
import { useWork } from "./WorkProvider";

/** vh of page scroll spent on each item of the rail. */
const VH_PER_ITEM = 58;

/**
 * ...but the whole well is capped. Unfiltered, the rail now holds all
 * seventeen projects, and 58vh apiece would be ten screens of scrolling to
 * reach the end of it. Past the cap the cards simply come faster.
 */
const WELL_CAP_VH = 620;

const wellVh = (count: number) =>
  Math.min(count * VH_PER_ITEM, WELL_CAP_VH);

/**
 * Stage 2 — the rule carousel.
 *
 * It holds the work. The nav's tabs filter it; nothing gates it. Page scroll
 * drives the rail, and pressing the card on the centre mark opens its write-up.
 *
 * It used to open on a chooser of three disciplines instead, which meant a
 * visitor had to pick a category before seeing a single piece — a decision
 * asked of someone who does not yet know what any of it is. Worse, the tab
 * labelled "All (17)" led to that chooser, so it showed three cards, not
 * seventeen. The label now tells the truth because the rail does.
 */
export default function WorkStage() {
  const { category, setCategory, open } = useWork();
  const isFiltered = category !== "all";
  const projects = projectsFor(category);
  const label = CATEGORIES.find((c) => c.id === category)?.label ?? "";

  const items: RailItem[] = projects.map((p) => ({
    key: p.id,
    eyebrow: p.eyebrow,
    title: p.title,
    tint: CATEGORY_TINT[p.category],
    tags: p.tags,
    still: p.thumbnail,
    blurb: p.blurb,
  }));

  // the well's height follows the item count — the engine must re-measure
  useLayoutEffect(() => {
    // a new set of cards always starts on the first one (mobile's rail input)
    view.rail.manual = 0;

    /* Throw the deck open on every change of set. There is no "way out" any
       more — filtering to a discipline and clearing the filter are the same
       kind of move, and both hand the rail a different set to show. The value
       lives on `view` rather than in state because the carousel remounts on
       this very change; React would replay from the wrong frame, the mutable
       one simply carries across. */
    view.rail.spreadAt = performance.now();

    window.dispatchEvent(new CustomEvent("minho:layout"));
  }, [category]);

  const activate = (i: number) => {
    const p = projects[i];
    if (p) open(p);
  };

  return (
    <section
      data-stage="work"
      id="work"
      tabIndex={-1}
      className="work-well pointer-events-auto relative w-full outline-none"
      style={{ "--well": `${wellVh(items.length)}vh` } as CSSProperties}
    >
      <div className="sticky top-0 flex h-svh w-full flex-col overflow-hidden">
        <header className="work-head shrink-0 px-5 pt-[calc(var(--nav-h)+4vh)] md:px-12">
          <div className="mx-auto w-full max-w-[1500px]">
            {isFiltered ? (
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
            ) : (
              <p className="eyebrow">Selected Work</p>
            )}
            <h2 className="display mt-3 text-[clamp(1.35rem,2.4vw,1.9rem)]">
              {isFiltered ? label : "All work"}
              <span className="ml-3 font-mono text-[0.42em] tracking-[0.2em] text-muted tabular-nums">
                {String(items.length).padStart(2, "0")}
              </span>
            </h2>
          </div>
        </header>

        <div key={category} className="min-h-0 flex-1">
          <RulerCarousel
            items={items}
            /* Not "View Project": that is what the *panel's* button does,
               and it leaves the site. Pressing a card opens the write-up, so
               the card says so. The same two words a step apart, meaning two
               different things, is the kind of thing a visitor only notices as
               a vague sense that the site misled them. */
            cta="View Details"
            onActivate={activate}
          />
        </div>

        <p className="work-cue pointer-events-none shrink-0 pb-7 text-center font-mono text-[12px] tracking-[0.18em] text-muted md:text-[10px] md:tracking-[0.24em] md:text-faint">
          {/* the gesture differs by pointer, so the cue has to as well */}
          <span className="max-[899px]:hidden">SCROLL TO BROWSE</span>
          <span className="min-[900px]:hidden">SWIPE TO BROWSE</span>
        </p>
      </div>
    </section>
  );
}
