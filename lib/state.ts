/**
 * lib/state.ts — the scroll "view" object.
 *
 * A plain mutable singleton, NOT React state. It is written every animation
 * frame by <ScrollEngine/> and read by the DOM writers. Nothing here may ever
 * trigger a React re-render.
 */

/* ------------------------------------------------------------------ math */

export const clamp = (v: number, lo = 0, hi = 1) =>
  v < lo ? lo : v > hi ? hi : v;

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** Inverse lerp, clamped. */
export const norm = (v: number, a: number, b: number) =>
  b === a ? 0 : clamp((v - a) / (b - a));

export const mapRange = (
  v: number,
  inA: number,
  inB: number,
  outA: number,
  outB: number,
) => lerp(outA, outB, norm(v, inA, inB));

export const smoothstep = (a: number, b: number, v: number) => {
  const t = norm(v, a, b);
  return t * t * (3 - 2 * t);
};

/**
 * Frame-rate-independent exponential easing.
 * `lambda` is roughly "e-foldings per second" — higher = snappier.
 */
export const damp = (current: number, target: number, lambda: number, dt: number) =>
  lerp(current, target, 1 - Math.exp(-lambda * dt));

/* ----------------------------------------------------------------- types */

export type StageName = "hero" | "work" | "reel" | "connect";
export const STAGES: StageName[] = ["hero", "work", "reel", "connect"];
export const STAGE_LABELS: Record<StageName, string> = {
  hero: "Hero",
  work: "Work",
  reel: "Reel",
  connect: "Connect",
};

export type StageBounds = { top: number; height: number };

/* ----------------------------------------------------------------- state */

export const view = {
  /** smoothed scroll offset, px */
  scroll: 0,
  /** total scrollable distance, px */
  limit: 1,
  /** overall document progress 0..1 */
  progress: 0,

  /** index into STAGES of the stage currently filling the viewport */
  section: 0,
  /** progress 0..1 through the current stage's own scroll range */
  sectionProgress: 0,

  /**
   * Per-stage reveal 0..1: rises as the stage enters, sits at 1 while it owns
   * the viewport, falls as it leaves. Every visual layer reads these.
   */
  reveal: { hero: 0, work: 0, reel: 0, connect: 0 } as Record<StageName, number>,

  /** measured layout of each stage, refreshed on resize */
  bounds: {
    hero: { top: 0, height: 1 },
    work: { top: 0, height: 1 },
    reel: { top: 0, height: 1 },
    connect: { top: 0, height: 1 },
  } as Record<StageName, StageBounds>,

  pointer: {
    /** normalised -1..1 */
    x: 0,
    y: 0,
    /** eased, -1..1 */
    ex: 0,
    ey: 0,
    /** raw pixels, for the cursor reticle */
    px: 0,
    py: 0,
    active: false,
  },

  /** eased scroll velocity, px/frame */
  velocity: 0,

  /**
   * The project rail. `target` is where scroll says we are; `pos` is a spring
   * chasing it, so the names settle with a little overshoot instead of being
   * nailed to the scrollbar.
   */
  rail: { pos: 0, target: 0, vel: 0, count: 0 },

  /* environment */
  mobile: false,
  reduced: false,
  ready: false,
  /** seconds since the engine started */
  time: 0,
};

/* --------------------------------------------------------------- helpers */

/** Below this the split layouts fold and video scrubbing is swapped for loop. */
export const MOBILE_BREAKPOINT = 900;

export function readEnvironment() {
  if (typeof window === "undefined") return;
  view.mobile = window.innerWidth < MOBILE_BREAKPOINT;
  view.reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}
