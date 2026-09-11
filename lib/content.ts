/**
 * lib/content.ts — project data.
 *
 * Copy transcribed from Port_Ho_2026.pdf — 역할 / 도구 / 유형 / 요약 map to
 * `role` / `tools` / `type` / `blurb`, and the page's body paragraphs to
 * `summary`. Copy, links and stills are all in place; anything added later can
 * go through /studio rather than by hand.
 */

import rawOverrides from "./project-overrides.json";
import { BASE_PROJECTS, TODO_URL } from "./projects";

export { TODO_URL };

export type CategoryId = "realtime" | "motion" | "ux";

/** Written by /studio in development; empty in a fresh checkout. */
const OVERRIDES = rawOverrides as Record<
  string,
  { thumbnail?: string; projectUrl?: string }
>;

export type Category = {
  id: CategoryId | "all";
  label: string;
  /** short label used on narrow viewports */
  short: string;
};

export const CATEGORIES: Category[] = [
  { id: "all", label: "All", short: "All" },
  { id: "realtime", label: "Realtime Experience", short: "Realtime" },
  { id: "motion", label: "Motion·3D", short: "Motion" },
  { id: "ux", label: "UX·UI", short: "UX·UI" },
];

export type Project = {
  id: string;
  category: CategoryId;
  title: string;
  /** small-caps eyebrow above the title */
  eyebrow: string;
  /**
   * The circumstance the work came out of — a show, a course, a commission,
   * a piece made for its own sake. It replaced `year`, which carried "2026"
   * on all seventeen records and so told a reader nothing, and absorbed
   * `type`, which mostly restated the eyebrow above the title in Korean.
   */
  context: string;
  /** 역할 */
  role: string;
  /** 도구 */
  tools: string;
  /** 요약 — the one-liner shown on cards */
  blurb: string;
  /** Body copy shown in the detail panel; "\n\n" separates paragraphs */
  summary: string;
  /** slash-separated tag row */
  tags: string[];
  /** Still shown on the card and in the detail panel. Swap from /studio. */
  thumbnail: string;
  /** where the "View Project" button goes; TODO_URL means "no link yet" */
  projectUrl: string;
};




/**
 * Thumbnails and links can also be set from /studio while running `next dev`,
 * which writes them into project-overrides.json. Anything in there wins over
 * the placeholders above, so the site can be filled in without editing code.
 */
/**
 * Bump when a still is replaced under the same filename. /public is cached hard
 * by the browser, so swapping two images without changing their names leaves
 * everyone looking at the old pair.
 */
const THUMB_V = 3;
const versioned = (src: string) =>
  src.includes("?") ? src : `${src}?v=${THUMB_V}`;

export const PROJECTS: Project[] = BASE_PROJECTS.map((p) => ({
  ...p,
  thumbnail: versioned(p.thumbnail),
  // studio overrides carry their own cache-busting stamp
  ...(OVERRIDES[p.id] ?? {}),
}));

export const hasLink = (p: Project) => Boolean(p.projectUrl) && p.projectUrl !== TODO_URL;

export const countFor = (id: CategoryId | "all") =>
  id === "all" ? PROJECTS.length : PROJECTS.filter((p) => p.category === id).length;

export const projectsFor = (id: CategoryId | "all") =>
  id === "all" ? PROJECTS : PROJECTS.filter((p) => p.category === id);

/* -------------------------------------------------------------- tints --- */
/**
 * Each discipline carries its own liquid. Values are linear rgb for the tank
 * shader, not CSS — the accent orange stays the site's, and the other two are
 * pulled far enough apart in hue to be told apart at a glance.
 */
/**
 * One family, not three colours.
 *
 * These were 13°, 270° and 191° on the colour wheel — the accent, then a purple
 * and a cyan from the opposite side of it, on a site whose whole palette is
 * near-black, white and a single orange. They sit between 2° and 27° now and
 * separate by lightness instead of hue, so a discipline still has its own
 * shade without any of them introducing a colour the site does not otherwise
 * own.
 */
export const CATEGORY_TINT: Record<CategoryId, [number, number, number]> = {
  motion: [0.02, 0.22, 0.40], // 207°  deep water, furthest out
  realtime: [0.05, 0.46, 0.52], // 187°  open water
  ux: [0.20, 0.70, 0.56], // 162°  the shallows
};

/* ------------------------------------------------------------- socials --- */
export const SOCIALS = [
  { label: "INSTAGRAM", href: "https://www.instagram.com/mho.xxv/" },
  { label: "THREADS", href: "https://www.threads.com/@minho_ya_01" },
  {
    label: "YOUTUBE",
    href: "https://youtube.com/channel/UCzvEbjghgfUZaj2v-uLIVjw",
  },
] as const;

/* -------------------------------------------------------------- contact --- */
/** The address itself, so nothing has to search the table below for it. */
export const EMAIL = "lucas03100908@gmail.com";

export const CONTACT: [string, string][] = [
  ["Name", "Kim Minho / 김민호"],
  ["Discipline", "Realtime · Motion·3D · UX·UI"],
  ["Based in", "Seoul, KR"],
  ["Email", EMAIL],
  ["Availability", "Open to 2026 opportunities"],
];

/* -------------------------------------------------------------- assets --- */
/** The full-bleed film behind the hero. */
export const HERO_BG_SRC = "/video/hero-bg.mp4";

export const SHOWREEL_SRC = "/video/showreel.mp4";

/** The reel runs fast on purpose. */
export const SHOWREEL_PLAYBACK_RATE = 1.8;
