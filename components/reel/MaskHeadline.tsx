"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MINHWA_PLATE_SRC } from "@/lib/content";


/**
 * The headline, cut out of the piece itself.
 *
 * Two lines of Bebas, each stretched to the full measure, used as a clipping
 * path over a painted landscape — night sky, the moon and the sun up at
 * once, green peaks, waterfalls and a field of waves. The plate drifts with
 * the pointer, so the view through the letters moves with the piece standing
 * in front of them rather than sitting dead behind it.
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
  const plate = useRef<HTMLDivElement>(null);
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

  /* The plate follows the pointer the way the piece in front of it does, a
     fraction as far: enough that the view through the letters is alive, not
     so far that it reads as a parallax trick. */
  useEffect(() => {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let x = 0;
    let y = 0;
    let tx = 0;
    let ty = 0;
    const onMove = (e: PointerEvent) => {
      tx = (e.clientX / window.innerWidth) * 2 - 1;
      ty = (e.clientY / window.innerHeight) * 2 - 1;
    };
    const frame = () => {
      raf = requestAnimationFrame(frame);
      x += (tx - x) * 0.06;
      y += (ty - y) * 0.06;
      if (plate.current) {
        plate.current.style.transform = `translate3d(${(-x * 2.4).toFixed(2)}%, ${(-y * 2).toFixed(2)}%, 0)`;
      }
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    raf = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

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

      {/* The painting, cut to the letters. */}
      <div
        className="absolute inset-0 bg-[#171327]"
        style={{ clipPath: `url(#${id})`, WebkitClipPath: `url(#${id})` }}
      >
        {/* A little larger than the line on every side, so the drift never
            opens a gap. The painting keeps its own proportions and is cropped
            rather than stretched — a stretched landscape reads as a mistake
            the moment a letter shows a horizon — and the crop is held high,
            so the moon and the sun land in the first line and the peaks and
            the water in the second. */}
        <div
          ref={plate}
          className="absolute"
          style={{ left: "-5%", top: "-6%", width: "110%", height: "112%", willChange: "transform" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={MINHWA_PLATE_SRC}
            alt=""
            aria-hidden
            className="h-full w-full object-cover"
            style={{ objectPosition: "50% 32%" }}
          />
        </div>
      </div>
    </div>
  );
}
