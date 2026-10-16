"use client";

import type { CSSProperties } from "react";
import { CATEGORY_TINT, tintCss, type CategoryId } from "@/lib/content";

/**
 * What the water does to the room it is standing in.
 *
 * A tank full of lit liquid in a black void is the one thing in the chooser
 * that does not behave like an object: light leaves it and lands on nothing.
 * Hover a card and this puts that light back — three slow lobes of its own
 * tint, drifting behind the rail, so the dark around the card belongs to the
 * card.
 *
 * One layer per discipline rather than one layer whose colour is swapped.
 * Moving from one card straight to the next then cross-fades for free: two
 * opacities passing through each other, which the compositor does on its own,
 * where re-tinting a single layer would have snapped the colour mid-fade.
 *
 * Everything here is `opacity` and `transform` — no filter, no blur, no
 * repaint. The whole layer is pointer-transparent and hidden from the
 * accessibility tree: it is light, not content.
 */
export default function DisciplineGlow({
  ids,
  lit,
}: {
  /** the disciplines, in rail order */
  ids: CategoryId[];
  /** index of the card under the pointer, or null */
  lit: number | null;
}) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      {ids.map((id, i) => (
        <div
          key={id}
          className="disc-glow"
          data-lit={lit === i ? "1" : undefined}
          style={{ "--glow": tintCss(CATEGORY_TINT[id]) } as CSSProperties}
        >
          <span className="disc-glow-lobe disc-glow-a" />
          <span className="disc-glow-lobe disc-glow-b" />
          <span className="disc-glow-lobe disc-glow-c" />
        </div>
      ))}

      {/*
       * Grain, over the lobes and nothing else.
       *
       * A wide, shallow gradient running out of a near-black screen is the
       * textbook case for 8-bit banding: the steps are a single level apart
       * and land as visible rings around the card. A little noise breaks the
       * step up and the rings go away. It fades with the glow — static grain
       * over a black screen is just dirt.
       */}
      <svg
        className="disc-glow-grain"
        data-lit={lit === null ? undefined : "1"}
        width="100%"
        height="100%"
      >
        <filter id="disc-grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="2"
            seed="4"
          />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#disc-grain)" />
      </svg>
    </div>
  );
}
