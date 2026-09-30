"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import MaskScene from "./MaskScene";

/**
 * The headline, cut out of the piece itself.
 *
 * Two lines of Bebas, each stretched to the full measure, used as a clipping
 * path over a second render of the same mask. It is not a still: the scene
 * inside the letters is live, and because both renders read the same pointer
 * they turn together — move the cursor and the wood inside the type turns
 * with the face standing in front of it.
 *
 * The letters are SVG text rather than HTML, because an SVG `clipPath` is the
 * only way to cut a canvas to a letterform in every browser the site
 * supports. Their size is measured rather than declared: each line is set at
 * a nominal size, measured, and scaled so it fills the measure exactly — the
 * comp's edge-to-edge setting, at any width, without a font-size table.
 */

const LINES = ["Bangsangsi", "Mask Talmyeon"] as const;
/** Bebas sits high in its em box; this is where its baseline lands. */
const BASELINE = 0.74;
/** how close the two lines run, as a fraction of the cap height */
const LEADING = 1.06;

export default function MaskHeadline({ id = "tal-letters" }: { id?: string }) {
  const host = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const measure = useRef<CanvasRenderingContext2D | null>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [sizes, setSizes] = useState<number[]>([]);

  /* Measure at a nominal size, then scale each line to the measure. Re-run on
     resize and once the kit's font has actually arrived — measuring Bebas
     before it loads sizes the line to the fallback. */
  const fit = useCallback(() => {
    const el = host.current;
    if (!el) return;
    const w = el.clientWidth;
    if (!w) return;
    const NOMINAL = 200;
    /* Measured on a canvas rather than on the SVG text: those nodes live in
       <defs>, which is never rendered, and an unrendered text element
       measures as zero width in some browsers — which left every line at the
       nominal size, four times too big on a phone. */
    const ctx = (measure.current ??= document
      .createElement("canvas")
      .getContext("2d"));
    const face = getComputedStyle(el).getPropertyValue("--font-poster").trim();
    const next = LINES.map((line) => {
      if (!ctx) return NOMINAL;
      ctx.font = `${NOMINAL}px ${face || "bebas-neue, sans-serif"}`;
      const len = ctx.measureText(line.toUpperCase()).width;
      return len > 0 ? (NOMINAL * w) / len : NOMINAL;
    });
    setSizes(next);
    const cap = next.reduce((s, v) => s + v * BASELINE * LEADING, 0);
    const h = Math.round(cap + next[next.length - 1] * 0.12);
    setBox({ w, h });
    /* The small print under the sheet starts below this, and only this knows
       how tall it came out. */
    el.closest<HTMLElement>("[data-engine='reel-frame']")?.style.setProperty(
      "--head-h",
      `${h}px`,
    );
  }, []);

  useEffect(() => {
    fit();
    const el = host.current;
    if (!el) return;
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    void document.fonts?.ready.then(fit);
    return () => ro.disconnect();
  }, [fit]);

  /* Where each line's baseline sits, in the same units the text is set in. */
  let y = 0;
  const baselines = sizes.map((s) => {
    y += s * BASELINE * LEADING;
    return y - s * BASELINE * (LEADING - 1);
  });

  return (
    <div ref={host} className="relative w-full" style={{ height: box.h || undefined }}>
      <svg
        ref={svg}
        className="absolute inset-0 h-full w-full"
        width={box.w || undefined}
        height={box.h || undefined}
        aria-hidden
      >
        <defs>
          <clipPath id={id} clipPathUnits="userSpaceOnUse">
            {LINES.map((line, i) => (
              <text
                key={line}
                x={0}
                y={baselines[i] || 0}
                style={{
                  fontFamily: "var(--font-poster)",
                  fontSize: sizes[i] ? `${sizes[i]}px` : "200px",
                  letterSpacing: "0.005em",
                  textTransform: "uppercase",
                }}
              >
                {line.toUpperCase()}
              </text>
            ))}
          </clipPath>
        </defs>
      </svg>

      {/* The same scene again, cut to the letters. It draws its own frames and
          reads the same pointer as the piece in front, so the two turn
          together. */}
      <div
        className="absolute inset-0 bg-[#2b201a]"
        style={{ clipPath: `url(#${id})`, WebkitClipPath: `url(#${id})` }}
      >
        {/* A square canvas, as wide as the headline and centred on it: the
            letters run three or four times wider than they are tall, and a
            canvas of that shape would leave the scene's own background in
            every letter at the ends of the line. Square and oversized, the
            piece covers the whole measure and the letters are all surface. */}
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            width: box.w || undefined,
            height: box.w || undefined,
            transform: "translate(-50%, -50%)",
          }}
        >
          <MaskScene className="absolute inset-0 h-full w-full" variant="fill" />
        </div>
        {/* The letters read as ink on paper, so the surface inside them is
            carried a stop under the piece standing in front. */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ background: "rgba(24,16,10,0.26)" }}
        />
      </div>
    </div>
  );
}
