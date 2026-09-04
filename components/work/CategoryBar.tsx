"use client";

import { CATEGORIES, countFor } from "@/lib/content";
import { useWork } from "./WorkProvider";

/**
 * Sticky category filter. Mounted once inside <Nav/> and never unmounted, so
 * it stays on screen from the hero all the way through the social outro.
 */
export default function CategoryBar() {
  const { category, setCategory } = useWork();

  return (
    /*
     * Plain buttons, not a tablist.
     *
     * The tab roles were only half the pattern: `role="tablist"` and
     * `role="tab"` with no `tabpanel` to control, so a screen reader announced
     * "tab, 1 of 4" and then had nothing to point at. These filter a rail
     * further down the page rather than swapping a panel beside them, so
     * `aria-current` says what is true — this is the one you are looking at.
     */
    <div
      className="no-scrollbar flex items-center gap-1 overflow-x-auto"
      role="group"
      aria-label="Project categories"
    >
      {CATEGORIES.map((c) => {
        const on = category === c.id;
        return (
          <button
            key={c.id}
            type="button"
            aria-current={on ? "true" : undefined}
            onClick={() => setCategory(c.id)}
            className={[
              /* py-3.5 rather than py-2: at 33px these fell short of a
                 comfortable touch target, and they are the first control
                 anyone meets on a phone. 45px, inside a 64px nav row. */
              "group relative shrink-0 whitespace-nowrap px-3 py-3.5 text-[11px] font-semibold uppercase tracking-[0.16em]",
              "transition-colors duration-300",
              on ? "text-accent" : "text-muted hover:text-ink",
            ].join(" ")}
          >
            <span className="hidden sm:inline">{c.label}</span>
            <span className="sm:hidden">{c.short}</span>
            <span className="ml-1.5 font-mono text-[10px] opacity-70">
              ({countFor(c.id)})
            </span>
            <span
              className={[
                "absolute inset-x-2 -bottom-px h-px origin-left bg-accent transition-transform duration-500",
                on ? "scale-x-100" : "scale-x-0 group-hover:scale-x-[0.35]",
              ].join(" ")}
              style={{ transitionTimingFunction: "cubic-bezier(.16,1,.3,1)" }}
            />
          </button>
        );
      })}
    </div>
  );
}
