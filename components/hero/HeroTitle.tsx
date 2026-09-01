"use client";

/**
 * "MINHO" — plain white type, blended with `difference`.
 *
 * Over black it stays pure white; wherever the background film runs underneath
 * the glyphs, difference inverts the footage, so the letters read as a colour
 * negative of the video exactly where the two overlap.
 *
 * For that to work, nothing between this element and the video may isolate the
 * blend group (no ancestor `filter` / `opacity` / `transform` / `will-change`
 * in between) — hence this sits as a direct sibling of <HeroBackground/> inside
 * the hero's sticky frame, and the engine-driven copy panel is a *separate*
 * sibling rather than a parent.
 *
 * `textLength` pins the word to the viewBox so it spans identically whatever
 * font actually resolves.
 */
export default function HeroTitle() {
  return (
    <div
      data-engine="hero-title"
      className="engine-driven w-full"
      style={{ mixBlendMode: "difference", transformStyle: "preserve-3d" }}
    >
      <svg
        viewBox="0 0 1200 290"
        className="block w-full"
        role="img"
        aria-label="MINHO"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Fiona is a high-contrast display serif, so the word is set at its
            natural weight and only *tracked* to the viewBox width —
            `lengthAdjust="spacing"` never distorts the glyphs, which matters
            for a Didone. It also means the title lands at the same width
            whether Fiona or the fallback serif resolves. */}
        <text
          x="600"
          y="268"
          textAnchor="middle"
          textLength="1184"
          lengthAdjust="spacing"
          fontSize="330"
          fontWeight="400"
          fill="#ffffff"
          style={{ fontFamily: "var(--font-display)" }}
        >
          MINHO
        </text>
      </svg>
    </div>
  );
}
