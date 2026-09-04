/**
 * lib/engine/writers.ts
 *
 * One function per stage, each writing `transform` / `opacity` / `filter`
 * straight onto the nodes it owns. They are pure side effects on the DOM: they
 * read the shared `view` object and the frame context, and set nothing else.
 *
 * Splitting them out of the loop keeps each stage's rules readable on their own
 * and makes it obvious which nodes belong to which screen — but they are still
 * called in a fixed order, once per frame, from <ScrollEngine/>.
 */

import {
  clamp,
  lerp,
  railStride,
  smoothstep,
  type StageName,
  view,
} from "@/lib/state";
import type { EngineNodes } from "./nodes";

export type FrameContext = {
  nodes: EngineNodes;
  /** prefers-reduced-motion, read once per frame */
  reduced: boolean;
  vh: number;
  vw: number;
  /** seconds since the previous frame, clamped */
  dt: number;
  /**
   * Put a paused film at a fraction of itself. Called every frame — it eases
   * towards the fraction internally and throttles its own seeking.
   */
  scrub: (v: HTMLVideoElement | null, p: number) => void;
  stageLocal: (name: StageName) => number;
};

/**
 * Copy panels — only the hero's. Screens 2–4 are deliberately static: scroll
 * progress drives the first screen and nothing else.
 */
export function writePanels({ nodes, reduced }: FrameContext) {
  for (const el of nodes.panels) {
    const stage = (el.dataset.stage as StageName) || "hero";
    if (stage !== "hero") continue;
    const r = view.reveal[stage];
    const shaped = reduced ? (r > 0.02 ? 1 : 0) : r * r * (3 - 2 * r);
    el.style.opacity = String(shaped);
    if (!reduced) {
      el.style.transform = `translate3d(0, ${(1 - shaped) * 30}px, 0)`;
      el.style.filter = `blur(${(1 - shaped) * 6}px)`;
    }
  }
}

/** Hero: a slow dolly on the film, and a 3–4° pointer tilt on the title. */
export function writeHero(c: FrameContext) {
  const { nodes, reduced, stageLocal, scrub } = c;
  const heroP = stageLocal("hero");

  if (nodes.heroBg && !reduced) {
    nodes.heroBg.style.transform = `scale(${lerp(1.02, 1.1, heroP)})`;
    nodes.heroBg.style.filter = `brightness(${lerp(1, 0.62, heroP)})`;
  }

  if (nodes.heroTitle) {
    if (reduced) {
      nodes.heroTitle.style.transform = "none";
    } else {
      const tiltY = view.pointer.active ? view.pointer.ex * 3.5 : 0;
      const tiltX = view.pointer.active ? -view.pointer.ey * 2.6 : 0;
      const scale = lerp(1, 1.06, heroP);
      nodes.heroTitle.style.transform =
        `perspective(1400px) rotateY(${tiltY}deg) rotateX(${tiltX}deg) ` +
        `translate3d(0, ${heroP * -40}px, ${heroP * 90}px) scale(${scale})`;
    }
    nodes.heroTitle.style.opacity = String(view.reveal.hero);
  }

  // the film advances (and rewinds) with the wheel across the hero well
  scrub(nodes.heroBgVideo, heroP);
}

/** Work: the chooser's tiles, then the measuring-rule carousel. */
export function writeWork(c: FrameContext) {
  const { nodes, reduced, vh, vw, dt, stageLocal } = c;

  for (const t of nodes.catTiles) {
    const rel = (t.top - view.scroll) / vh;
    const reveal = reduced ? 1 : smoothstep(1.0, 0.45, rel);
    t.el.style.opacity = reveal.toFixed(3);
    t.el.style.transform = reduced
      ? "none"
      : `translate3d(0, ${((1 - reveal) * (40 + t.col * 26)).toFixed(1)}px, 0)`;
  }

  const railN = nodes.railItems.length;
  if (!railN) return;

  const rail = view.rail;
  rail.count = railN;
  const last = Math.max(0, railN - 1);
  /* Where the rail wants to be. On a phone that is wherever the last swipe
     left it — the stage is a single screen there and vertical scroll belongs
     to the page — and everywhere else it is a read of the scroll well. */
  rail.target = view.mobile ? clamp(rail.manual, 0, last) : stageLocal("work") * last;

  /* A damped spring, integrated per frame, rather than reading the scroll
     position straight. Scroll sets where the rail *wants* to be; the mass takes
     a moment to get there and overshoots slightly on the way — that lag and
     settle is what makes it feel like an object being pushed rather than a
     value being scrubbed. */
  if (reduced) {
    rail.pos = rail.target;
    rail.vel = 0;
  } else {
    /* Loose enough to overshoot when something else is pushing the rail;
       stiff and critically damped while a finger is on it, because a card that
       trails the thumb reads as lag rather than as weight. */
    const K = rail.dragging ? 900 : 190; // stiffness
    const C = rail.dragging ? 60 : 26; // damping
    const a = (rail.target - rail.pos) * K - rail.vel * C;
    rail.vel += a * dt;
    rail.pos += rail.vel * dt;
  }

  const pos = rail.pos;
  const stride = railStride(vw);
  const current = clamp(Math.round(pos), 0, last);

  for (const el of nodes.railItems) {
    const i = Number(el.dataset.index || 0);
    const d = i - pos;
    const ad = Math.abs(d);
    const near = clamp(1 - ad);

    // the spring's velocity leans the cards into the direction of travel
    const lean = reduced ? 0 : clamp(rail.vel * 0.6, -6, 6) * near;

    el.style.transform =
      `translate3d(calc(-50% + ${(d * stride).toFixed(1)}px), -50%, 0) ` +
      `rotate(${lean.toFixed(2)}deg) scale(${lerp(0.72, 1, near).toFixed(3)})`;
    el.style.opacity = (reduced ? 1 : clamp(1 - ad * 0.72)).toFixed(3);
    el.style.filter = reduced ? "none" : `blur(${(ad * 3.5).toFixed(2)}px)`;
    // the card on the mark opens; its neighbours centre themselves
    el.style.pointerEvents = ad < 1.6 ? "auto" : "none";

    const isCurrent = i === current;
    if (isCurrent !== (el.dataset.current === "1")) {
      if (isCurrent) el.dataset.current = "1";
      else delete el.dataset.current;
    }

    /* The rail is a carousel: one card is on the mark and the rest are scaled
       down and blurred off to the sides. Now that they are real buttons they
       would all be tab stops, so tabbing through the work stage meant walking
       every project blind. Only the one on the mark answers to Tab; the arrows
       and the arrow keys move the rail.

       Kept out of the branch above, which only fires when a card *changes*
       hands — a card that has never been current would never have been told
       to step out of the tab order at all. A button defaults to tabIndex 0,
       so comparing first means this still writes only when it must. */
    const card = el.firstElementChild as HTMLElement | null;
    const want = isCurrent ? 0 : -1;
    if (card && card.tabIndex !== want) card.tabIndex = want;
  }

  // the rules travel under the cards, one major tick per project
  for (const el of nodes.railRules) {
    el.style.transform = `translate3d(${(-pos * 70).toFixed(1)}px, 0, 0)`;
  }

  if (nodes.railCounter) {
    const label = String(current + 1).padStart(2, "0");
    if (nodes.railCounter.textContent !== label)
      nodes.railCounter.textContent = label;
  }
}

/**
 * Reel: the frame opens up. Playback is untouched — the film runs on its own
 * clock; this only resizes the window onto it.
 */
export function writeReel(c: FrameContext) {
  const { nodes, reduced, stageLocal } = c;
  if (!nodes.reelFrame) return;

  const p = stageLocal("reel");
  // fully open at ~55%, so the rest of the well is spent watching it
  const e = reduced ? 1 : smoothstep(0, 0.55, p);
  const startW = view.mobile ? 70 : 26;
  const startH = view.mobile ? 30 : 40;

  nodes.reelFrame.style.width = `${lerp(startW, 100, e).toFixed(2)}vw`;
  nodes.reelFrame.style.height = `${lerp(startH, 100, e).toFixed(2)}vh`;
  nodes.reelFrame.style.borderRadius = `${lerp(14, 0, e).toFixed(1)}px`;

  if (nodes.reelVeil)
    nodes.reelVeil.style.opacity = lerp(0.4, 0.1, e).toFixed(3);

  if (nodes.reelGlow) {
    nodes.reelGlow.style.opacity = lerp(0, 0.5, e).toFixed(3);
    nodes.reelGlow.style.transform = `scale(${lerp(1.1, 1.3, e).toFixed(3)})`;
  }

  /* The title dissolves as the film opens instead of sliding apart: the reel
     carries its own on-screen type, and two sets of words fighting over the
     same frame is noise. It swells very slightly on the way out. */
  if (nodes.reelTitle) {
    const out = smoothstep(0.18, 0.6, p);
    nodes.reelTitle.style.opacity = String(1 - out);
    nodes.reelTitle.style.transform = `scale(${lerp(1, 1.14, out).toFixed(4)})`;
  }

  // exactly one cue is legible at any moment
  if (nodes.reelCueA)
    nodes.reelCueA.style.opacity = String(
      reduced ? 0 : 1 - smoothstep(0.12, 0.42, p),
    );
  if (nodes.reelCueB)
    nodes.reelCueB.style.opacity = String(smoothstep(0.62, 0.8, p));
}

/** Connect: the word pulse is time-based, never scroll-based. */
export function writeConnect({ nodes, reduced }: FrameContext) {
  if (reduced) return;
  for (let i = 0; i < nodes.connectWords.length; i++) {
    const w = nodes.connectWords[i];
    const pulse = 0.5 + 0.5 * Math.sin(view.time * 0.5 + i * 0.41);
    w.style.opacity = String(lerp(0.55, 1, pulse));
  }
}

/** Progress hairline and the stage rail. */
export function writeChrome({ nodes }: FrameContext) {
  if (nodes.progressBar)
    nodes.progressBar.style.transform = `scaleX(${view.progress})`;

  for (const t of nodes.railTicks) {
    const i = Number(t.dataset.index || 0);
    const on = view.section === i;
    t.style.opacity = String(on ? 1 : 0.3);
    t.style.transform = `scaleX(${on ? 1 : 0.42})`;
  }
}

/** Every writer, in the order the frame runs them. */
export const WRITERS = [
  writePanels,
  writeHero,
  writeWork,
  writeReel,
  writeConnect,
  writeChrome,
] as const;
