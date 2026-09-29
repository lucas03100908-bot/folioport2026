/**
 * lib/engine/nodes.ts
 *
 * Every DOM handle the frame loop writes to. Each one is tagged
 * `data-engine="…"` in the markup, so this file is the whole contract between
 * the components and the loop — nothing else in the engine queries the
 * document.
 *
 * Collecting is deliberately separate from writing. Re-querying inside the
 * loop, or reading geometry there, would force a reflow every frame; the tile
 * offsets are measured here once per layout instead.
 */

/** A card whose document position is cached, so the loop never reads layout. */
export type MeasuredTile = {
  el: HTMLElement;
  top: number;
  col: number;
};

export type EngineNodes = {
  panels: HTMLElement[];

  /* hero */
  heroBg: HTMLElement | null;
  heroTitle: HTMLElement | null;
  heroBgVideo: HTMLVideoElement | null;

  /* work — the chooser's tiles and the rule carousel */
  catTiles: MeasuredTile[];
  railItems: HTMLElement[];
  railRules: HTMLElement[];
  railCounter: HTMLElement | null;

  /* reel */
  reelFrame: HTMLElement | null;
  reelRoom: HTMLElement | null;
  reelSeat: HTMLElement | null;
  reelHead: HTMLElement | null;
  reelPoster: HTMLElement | null;
  reelCueA: HTMLElement | null;
  reelCueB: HTMLElement | null;

  /* connect */
  connectWords: HTMLElement[];

  /* chrome */
  progressBar: HTMLElement | null;
  railTicks: HTMLElement[];
};

export const EMPTY_NODES: EngineNodes = {
  panels: [],
  heroBg: null,
  heroTitle: null,
  heroBgVideo: null,
  catTiles: [],
  railItems: [],
  railRules: [],
  railCounter: null,
  reelFrame: null,
  reelRoom: null,
  reelSeat: null,
  reelHead: null,
  reelPoster: null,
  reelCueA: null,
  reelCueB: null,
  connectWords: [],
  progressBar: null,
  railTicks: [],
};

/** Re-read every tagged node. Called on layout changes, never per frame. */
export function collectNodes(): EngineNodes {
  const one = <T extends HTMLElement>(sel: string) =>
    document.querySelector<T>(sel);
  const all = (sel: string) =>
    Array.from(document.querySelectorAll<HTMLElement>(sel));

  return {
    panels: all('[data-engine="panel"]'),

    heroBg: one('[data-engine="hero-bg"]'),
    heroTitle: one('[data-engine="hero-title"]'),
    heroBgVideo: one<HTMLVideoElement>('[data-engine="hero-bg-video"]'),

    catTiles: all('[data-engine="cat-tile"]').map((el, i) => ({
      el,
      top: el.getBoundingClientRect().top + window.scrollY,
      col: i,
    })),
    railItems: all('[data-engine="rail-item"]'),
    railRules: all('[data-engine="rail-rule"]'),
    railCounter: one('[data-engine="rail-counter"]'),

    reelFrame: one('[data-engine="reel-frame"]'),
    reelRoom: one('[data-engine="reel-room"]'),
    reelSeat: one('[data-engine="reel-seat"]'),
    reelHead: one('[data-engine="reel-head"]'),
    reelPoster: one('[data-engine="reel-poster"]'),
    reelCueA: one('[data-engine="reel-cue-a"]'),
    reelCueB: one('[data-engine="reel-cue-b"]'),

    connectWords: all('[data-engine="connect-word"]'),

    progressBar: one('[data-engine="progress"]'),
    railTicks: all('[data-engine="rail-tick"]'),
  };
}
