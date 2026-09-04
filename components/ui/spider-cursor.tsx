"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Spiders that walk after a target across a transparent canvas.
 *
 * There is no body: the animal is the bundle of strands converging on a point,
 * drawn in the accent colour.
 *
 * The legs are the point: instead of a fixed rig, each spider reaches for
 * whichever of a few hundred anchor points scattered over the screen happen to
 * be nearest. Legs therefore come in wildly different lengths, and their feet
 * are drawn at a radius scaled by distance — that mismatch is what reads as
 * depth. Every strand is stepped through a cheap noise field so it wavers like
 * a real leg rather than a ruler line.
 *
 * Two things differ from the version this is adapted from, both deliberate:
 *
 *   1. **The canvas is cleared, not painted black.** The original fills the
 *      frame with an opaque black disc every tick, which would bury whatever
 *      sits behind it — here that is a screen full of links.
 *   2. **It never takes the pointer.** `pointer-events: none` end to end, so
 *      anything underneath stays clickable straight through the animal.
 */

export type SpiderPoint = { x: number; y: number };

export function SpiderCursor({
  count = 3,
  active = true,
  scale = 1,
  maxDpr = 2,
  palette = "accent",
  /** called every frame; return where the spiders should head, or null to idle */
  resolveTarget,
  /** reports every spider's position each frame, for whatever wants to react */
  onBodies,
  /**
   * Polled each frame. Return a scatter order — where it came from, a rising
   * `id` so a repeat click re-triggers, and the moment they may regroup.
   */
  getScatter,
  className,
}: {
  count?: number;
  active?: boolean;
  /**
   * Multiplies the animal's size. Everything here is derived from
   * `innerWidth`, which keeps the spiders proportionate on a desktop but
   * shrinks them to nothing on a phone — a 375px viewport gives a body radius
   * of about 8px. Scale it up there rather than rewriting the proportions.
   */
  scale?: number;
  /**
   * Ceiling on the canvas backing store's density. Stroke cost is paid per
   * rasterised pixel, and these are soft translucent strands on black — a
   * phone does not need two device pixels per CSS pixel to sell them.
   */
  maxDpr?: number;
  /**
   * "accent" draws the animal in the site's orange.
   *
   * "glass" is the frosted reading: cool near-white strands drawn additively,
   * so light *builds up* where they cross and the body saturates to a bright
   * core, with the feet as specular points. The DOM way of doing this —
   * backdrop-filter plus an SVG displacement map — has nothing to bite on
   * here, because a canvas paints its own pixels rather than sampling what is
   * behind it. Compositing is what gives the same impression at the same cost.
   */
  palette?: "accent" | "glass";
  resolveTarget?: () => SpiderPoint | null;
  onBodies?: (pts: SpiderPoint[]) => void;
  getScatter?: () => { x: number; y: number; id: number; until: number } | null;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const targetRef = useRef(resolveTarget);
  const bodyRef = useRef(onBodies);
  const scatterRef = useRef(getScatter);
  targetRef.current = resolveTarget;
  bodyRef.current = onBodies;
  scatterRef.current = getScatter;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (!active) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const { sin, cos, PI, hypot, min, max } = Math;
    const rnd = (x = 1, dx = 0) => Math.random() * x + dx;
    const clamp = (v: number, lo: number, hi: number) =>
      v < lo ? lo : v > hi ? hi : v;
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const many = <T,>(n: number, f: (i: number) => T): T[] =>
      [...Array(n)].map((_, i) => f(i));

    // two crossed sine waves — enough wobble to sell a leg, no library needed
    const noise = (x: number, y: number, t = 101) =>
      sin(0.3 * x + 1.4 * t + 2 + 2.5 * sin(0.4 * y + -1.3 * t + 1)) +
      sin(0.2 * y + 1.5 * t + 2.8 + 2.3 * sin(0.5 * x + -1.2 * t + 0.5));

    let w = 0;
    let h = 0;
    let dpr = 1;

    /* Strands thicken with the animal, or a scaled-up spider is just the same
       thread spread wider — but only so far, past which it reads as rope. */
    const weight = min(scale, 1.45);

    const glass = palette === "glass";
    /* Additive light needs lower per-strand alpha, or nine strands converging
       on one point blow straight out to flat white. */
    const strandAlpha = glass ? ([0.16, 0.5] as const) : ([0.5, 1] as const);
    const footAlpha = glass ? ([0.3, 0.92] as const) : ([0.55, 1] as const);
    const strandRGB = glass ? "226,240,255" : "255,77,28";
    const footRGB = glass ? "255,255,255" : "255,120,60";
    const bodyRGB = glass ? "196,222,255" : "255,90,32";
    const bodyCore = glass ? "255,255,255" : "255,190,150";

    const SEGMENTS = 34; // most points a single strand may be drawn with
    const PX_PER_SEGMENT = 5; // ...but only this finely, which is plenty
    const RIM = 9; // strands converging on each foot
    const FEET = 8;

    function drawCircle(x: number, y: number, r: number) {
      ctx!.beginPath();
      ctx!.ellipse(x, y, r, r, 0, 0, PI * 2);
      ctx!.fill();
    }

    function drawStrand(
      x0: number,
      y0: number,
      x1: number,
      y1: number,
      wobble: number,
      bend: number,
    ) {
      /* Point count follows the strand's length rather than being fixed. A
         short leg subdivided 34 times spends most of its points inside the
         same pixel; below about 5px apart they cost path work and show
         nothing. */
      const dx = x1 - x0;
      const dy = y1 - y0;
      const span = hypot(dx, dy) || 1;
      const steps = max(6, min(SEGMENTS, Math.round(span / PX_PER_SEGMENT)));

      /* The knee. A leg drawn as a straight line between two points is a
         tension wire; what makes it read as a limb is that it rises to a joint
         and comes back down. The lift peaks early — around a third of the way
         out — rather than at the midpoint, which is where a spider's femur
         actually tops out. Perpendicular to the leg, and stable per anchor, so
         it is a shape rather than a shimmer. */
      const nx = -dy / span;
      const ny = dx / span;
      const lift = bend * span;

      ctx!.beginPath();
      ctx!.moveTo(x0, y0);
      for (let i = 1; i <= steps; i++) {
        const f = i / steps;
        const arc = sin(Math.pow(f, 0.62) * PI) * lift;
        const x = lerp(x0, x1, f) + nx * arc;
        const y = lerp(y0, y1, f) + ny * arc;
        const k = noise(x / 5 + x0, y / 5 + y0) * wobble;
        ctx!.lineTo(x + k, y + k);
      }
      ctx!.stroke();
    }

    function spawn(index: number) {
      // an anchor field this spider reaches into; density follows the viewport
      const anchorCount = Math.round(
        min(300, max(150, (window.innerWidth * window.innerHeight) / 5200)),
      );
      const anchors = many(anchorCount, () => ({
        x: rnd(window.innerWidth),
        y: rnd(window.innerHeight),
        len: 0,
        r: 0,
        // which way this leg's knee breaks, and how hard; fixed for its life
        bend: rnd(0.3, -0.15),
      }));

      const rim = many(RIM, (i) => ({
        x: cos((i / RIM) * PI * 2),
        y: sin((i / RIM) * PI * 2),
      }));

      /* Each spider sits at its own distance. Three animals drawn at one size
         read as one animal cloned; spread them through z and the screen gains
         a front and a back. Nearest is biggest, brightest, reaches furthest
         and travels fastest — the last of those is parallax, and it is what
         stops the depth from looking like a size difference. */
      const z = count > 1 ? 0.72 + (index / (count - 1)) * 0.62 : 1;

      const seed = rnd(100) + index * 40;
      let x = rnd(window.innerWidth);
      let y = rnd(window.innerHeight);
      let tx = x;
      let ty = y;
      let flee: SpiderPoint | null = null;
      let fleeUntil = 0;
      const kx = rnd(0.5, 0.4);
      const ky = rnd(0.5, 0.4);
      // each spider strolls on its own little orbit so the pair never overlaps
      const walk = { x: rnd(60, 55), y: rnd(60, 55) };
      // the radius the strands fan out from — larger reads as a bigger animal
      const R = (window.innerWidth / rnd(20, 34)) * scale * z;

      return {
        get pos() {
          return { x, y };
        },
        get depth() {
          return z;
        },

        /**
         * The cast shadow, drawn over the type before any of the light is.
         *
         * This is the whole difference between an animal *on* the screen and a
         * drawing *of* one: a body between a light and a surface darkens what
         * is under it. Offset down and right, so the light reads as coming
         * from over your left shoulder, and softened by a gradient rather than
         * `shadowBlur` — one gradient fill per spider, against the 216 blur
         * passes a frame that per-stroke shadows used to cost.
         */
        shadow() {
          const off = R * 0.55;
          const rad = R * 2.4;
          const sx = x + off;
          const sy = y + off * 1.25;
          const g = ctx!.createRadialGradient(sx, sy, 0, sx, sy, rad);
          const a = 0.5 * z;
          g.addColorStop(0, `rgba(0,0,0,${a.toFixed(3)})`);
          g.addColorStop(0.45, `rgba(0,0,0,${(a * 0.45).toFixed(3)})`);
          g.addColorStop(1, "rgba(0,0,0,0)");
          ctx!.fillStyle = g;
          drawCircle(sx, sy, rad);
        },

        /** The body itself, and the one hard highlight that gives it a surface. */
        body() {
          const rb = R * 0.62;
          const g = ctx!.createRadialGradient(
            x - rb * 0.35,
            y - rb * 0.4,
            rb * 0.1,
            x,
            y,
            rb,
          );
          g.addColorStop(0, `rgba(${bodyCore},${(0.95 * z).toFixed(3)})`);
          g.addColorStop(0.55, `rgba(${bodyRGB},${(0.4 * z).toFixed(3)})`);
          g.addColorStop(1, `rgba(${bodyRGB},0)`);
          ctx!.fillStyle = g;
          drawCircle(x, y, rb);

          // a small specular off-centre: the cue that it is round and lit
          ctx!.fillStyle = `rgba(${bodyCore},${(0.85 * z).toFixed(3)})`;
          drawCircle(x - rb * 0.3, y - rb * 0.34, rb * 0.22);
        },
        follow(nx: number, ny: number) {
          tx = nx;
          ty = ny;
        },
        /** Bolt away from a point, and stay gone until `until`. */
        scatter(cx: number, cy: number, until: number) {
          const away = Math.atan2(y - cy, x - cx) + rnd(1.1, -0.55);
          const far = Math.max(window.innerWidth, window.innerHeight) * 0.75;
          flee = { x: x + cos(away) * far, y: y + sin(away) * far };
          fleeUntil = until;
        },
        tick(t: number, now: number) {
          const running = flee !== null && now < fleeUntil;
          if (!running) flee = null;

          // fleeing skips the stroll wobble and runs flat out
          const fx = running ? flee!.x : tx + cos(t * kx + seed) * walk.x;
          const fy = running ? flee!.y : ty + sin(t * ky + seed) * walk.y;
          const cap = (window.innerWidth / (running ? 26 : 90)) * z;
          const ease = running ? 6 : 12;
          x += min(cap, (fx - x) / ease);
          y += min(cap, (fy - y) / ease);

          const reach = (window.innerWidth / 7) * scale * z;
          let taken = 0;

          const reach2 = reach * reach;

          for (const a of anchors) {
            /* Squared distance first: most anchors are nowhere near, and this
               loop runs over every one of them, for every spider, every
               frame. The square root is only worth taking for the few that
               are in reach or still fading out. */
            const dx = a.x - x;
            const dy = a.y - y;
            const d2 = dx * dx + dy * dy;
            if (d2 > reach2 && !a.len) continue;

            const len = hypot(dx, dy);
            const gripping = d2 < reach2 && taken < FEET;
            if (gripping) taken++;
            a.len = max(0, min(a.len + (gripping ? 0.09 : -0.09), 1));
            if (!a.len) continue;

            /* Depth. Everything about a strand is driven by how near its foot
               is: thickness, brightness, how far the foot dot swells and how
               much the leg wavers. Far legs go thin, dim and straight; near
               ones go thick, hot and loose. That spread is the whole illusion —
               a single uniform stroke reads flat no matter how it is animated. */
            const depth = clamp(1 - len / reach, 0, 1);
            const grow = a.len * a.len;

            /* No canvas shadow here. `shadowBlur` costs a separate blur pass
               per stroke, and this loop issues 9 × 8 × 3 = 216 of them a frame —
               enough to visibly drop the frame rate. The legs carry their own
               weight through opacity and width instead. */
            ctx!.lineWidth = lerp(0.6, 3.6, Math.pow(depth, 1.3)) * weight * z;
            ctx!.strokeStyle = `rgba(${strandRGB},${(
              lerp(strandAlpha[0], strandAlpha[1], Math.pow(depth, 0.9)) *
              (0.6 + 0.4 * grow) *
              lerp(0.62, 1, z)
            ).toFixed(3)})`;

            const wobble = lerp(0.5, 3.4, depth);
            for (const p of rim) {
              drawStrand(
                lerp(x + p.x * R, a.x, grow),
                lerp(y + p.y * R, a.y, grow),
                x + p.x * R,
                y + p.y * R,
                wobble,
                a.bend * grow,
              );
            }

            a.r =
              lerp(0.6, 5.6, Math.pow(depth, 1.5)) *
              (gripping ? 1.35 : 1) *
              weight *
              z;
            ctx!.fillStyle = `rgba(${footRGB},${(
              lerp(footAlpha[0], footAlpha[1], Math.pow(depth, 0.9)) *
              (0.65 + 0.35 * grow)
            ).toFixed(3)})`;
            drawCircle(a.x, a.y, a.r);
          }

        },
      };
    }

    const spiders = many(count, spawn);

    const onPointer = (e: PointerEvent) => {
      if (targetRef.current) return; // an override owns the target
      for (const s of spiders) s.follow(e.clientX, e.clientY);
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    let raf = 0;
    let lastScatter = -1;
    const frame = (time: number) => {
      raf = requestAnimationFrame(frame);

      if (w !== window.innerWidth || h !== window.innerHeight) {
        w = window.innerWidth;
        h = window.innerHeight;
        dpr = min(window.devicePixelRatio || 1, maxDpr);
        canvas.width = Math.floor(w * dpr);
        canvas.height = Math.floor(h * dpr);
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
      }

      const override = targetRef.current?.();
      if (override) for (const s of spiders) s.follow(override.x, override.y);

      const order = scatterRef.current?.();
      if (order && order.id !== lastScatter) {
        lastScatter = order.id;
        for (const s of spiders) s.scatter(order.x, order.y, order.until);
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h); // transparent: whatever is behind stays visible
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      /* Shadows first, and normally: darkness cannot be added. Under
         "lighter" a black fill contributes nothing, so the whole shadow pass
         has to land before the blend mode changes. */
      ctx.globalCompositeOperation = "source-over";
      for (const s of spiders) s.shadow();

      /* Glass is light passing through light: strands that overlap should get
         brighter, not merely cover one another. Costs nothing — it is a blend
         mode, not another pass. */
      ctx.globalCompositeOperation = glass ? "lighter" : "source-over";

      const t = time / 1000;
      // back to front, so a nearer spider's light lies over a further one's
      const ordered = [...spiders].sort((a, b) => a.depth - b.depth);
      for (const s of ordered) s.tick(t, time);
      for (const s of ordered) s.body();
      bodyRef.current?.(spiders.map((s) => s.pos));
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onPointer);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    };
  }, [active, count, scale, maxDpr, palette]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={cn("pointer-events-none block", className)}
    />
  );
}

export default SpiderCursor;
