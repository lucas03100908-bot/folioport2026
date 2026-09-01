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
    <div
      className="no-scrollbar flex items-center gap-1 overflow-x-auto"
      role="tablist"
      aria-label="Project categories"
    >
      {CATEGORIES.map((c) => {
        const on = category === c.id;
        return (
          <button
            key={c.id}
            role="tab"
            aria-selected={on}
            onClick={() => setCategory(c.id)}
            className={[
              "group relative shrink-0 whitespace-nowrap px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em]",
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
