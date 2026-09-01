"use client";

/**
 * components/ScrollEngine.tsx
 *
 * Renders nothing. Owns the single animation frame loop for the whole page:
 *   1. drives Lenis (or plain native scroll under prefers-reduced-motion)
 *   2. writes the mutable `view` object in lib/state.ts
 *   3. writes transform / opacity / filter straight onto the DOM nodes tagged
 *      with `data-engine`, and maps scroll onto video currentTime
 *
 * No React state is set here, ever.
 */

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  STAGES,
  type StageName,
  clamp,
  damp,
  lerp,
  norm,
  readEnvironment,
  smoothstep,
  view,
} from "@/lib/state";

let lenisRef: Lenis | null = null;
export const getLenis = () => lenisRef;

/**
 * Scroll to a stage. Always go through Lenis when it is running — a raw
 * `scrollIntoView` moves the document behind Lenis's back and leaves the
 * engine reading a stale position.
 */
export function scrollToStage(name: StageName, smooth = true) {
  const el = document.querySelector<HTMLElement>(`[data-stage="${name}"]`);
  if (!el) return;
  const lenis = lenisRef;
  if (lenis) lenis.scrollTo(el, { immediate: !smooth });
  else el.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
}

/**
 * Scroll so that index `i` of the work rail lands on the centre mark. Controls
 * move the *page*, not a private cursor — so the scrollbar keeps telling the
 * truth and the back/forward buttons still work.
 */
export function railScrollTo(i: number) {
  const b = view.bounds.work;
  const vh = typeof window === "undefined" ? 1 : window.innerHeight;
  const span = Math.max(b.height - vh, 1);
  const n = Math.max(1, view.rail.count - 1);
  const y = b.top + (clamp(i, 0, n) / n) * span;
  const lenis = lenisRef;
  if (lenis) lenis.scrollTo(y);
  else window.scrollTo({ top: y, behavior: "smooth" });
}

/** Progress 0..1 through a stage's own scroll range. */
export function stageLocal(name: StageName) {
  const b = view.bounds[name];
  const vh = typeof window === "undefined" ? 1 : window.innerHeight;
  const span = Math.max(b.height - vh, b.height * 0.5, 1);
  return norm(view.scroll, b.top, b.top + span);
}

/** currentTime writes are throttled to ~30fps — seeking every frame stutters. */
const SEEK_INTERVAL = 33;

type Nodes = {
  panels: HTMLElement[];
  reelFrame: HTMLElement | null;
  reelGlow: HTMLElement | null;
  reelVeil: HTMLElement | null;
  reelTitle: HTMLElement | null;
  reelCueA: HTMLElement | null;
  reelCueB: HTMLElement | null;
  railItems: HTMLElement[];
  railRules: HTMLElement[];
  railCounter: HTMLElement | null;
  /** measured once per layout so the frame loop never forces a reflow */
  catTiles: { el: HTMLElement; top: number; col: number }[];
  heroBg: HTMLElement | null;
  heroTitle: HTMLElement | null;
  heroBgVideo: HTMLVideoElement | null;
  connectWords: HTMLElement[];
  progressBar: HTMLElement | null;
  railTicks: HTMLElement[];
  cursor: HTMLElement | null;
};

const EMPTY: Nodes = {
  panels: [],
  reelFrame: null,
  reelGlow: null,
  reelVeil: null,
  reelTitle: null,
  reelCueA: null,
  reelCueB: null,
  railItems: [],
  railRules: [],
  railCounter: null,
  catTiles: [],
  heroBg: null,
  heroTitle: null,
  heroBgVideo: null,
  connectWords: [],
  progressBar: null,
  railTicks: [],
  cursor: null,
};

export default function ScrollEngine() {
  useEffect(() => {
    gsap.registerPlugin(ScrollTrigger);
    readEnvironment();

    let nodes: Nodes = EMPTY;

    const collect = () => {
      const q = <T extends HTMLElement>(sel: string) =>
        document.querySelector<T>(sel);
      nodes = {
        panels: Array.from(
          document.querySelectorAll<HTMLElement>('[data-engine="panel"]'),
        ),
        reelFrame: q('[data-engine="reel-frame"]'),
        reelGlow: q('[data-engine="reel-glow"]'),
        reelVeil: q('[data-engine="reel-veil"]'),
        reelTitle: q('[data-engine="reel-title"]'),
        reelCueA: q('[data-engine="reel-cue-a"]'),
        reelCueB: q('[data-engine="reel-cue-b"]'),
        railItems: Array.from(
          document.querySelectorAll<HTMLElement>('[data-engine="rail-item"]'),
        ),
        railRules: Array.from(
          document.querySelectorAll<HTMLElement>('[data-engine="rail-rule"]'),
        ),
        railCounter: q('[data-engine="rail-counter"]'),
        catTiles: Array.from(
          document.querySelectorAll<HTMLElement>('[data-engine="cat-tile"]'),
        ).map((el, i) => ({
          el,
          top: el.getBoundingClientRect().top + window.scrollY,
          col: i,
        })),
        heroBg: q('[data-engine="hero-bg"]'),
        heroTitle: q('[data-engine="hero-title"]'),
        heroBgVideo: q<HTMLVideoElement>('[data-engine="hero-bg-video"]'),
        connectWords: Array.from(
          document.querySelectorAll<HTMLElement>('[data-engine="connect-word"]'),
        ),
        progressBar: q('[data-engine="progress"]'),
        railTicks: Array.from(
          document.querySelectorAll<HTMLElement>('[data-engine="rail-tick"]'),
        ),
        cursor: q('[data-engine="cursor"]'),
      };
    };

    /* ------------------------------------------------------- measuring -- */
    const measure = () => {
      readEnvironment();
      view.limit = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      for (const name of STAGES) {
        const el = document.querySelector<HTMLElement>(`[data-stage="${name}"]`);
        if (!el) continue;
        const rect = el.getBoundingClientRect();
        view.bounds[name] = {
          top: rect.top + window.scrollY,
          height: Math.max(1, rect.height),
        };
      }
      collect();
    };

    /* ---------------------------------------------------------- lenis -- */
    if (!view.reduced) {
      lenisRef = new Lenis({
        duration: 1.15,
        lerp: 0.09,
        smoothWheel: true,
        touchMultiplier: 1.4,
      });
      lenisRef.on("scroll", () => ScrollTrigger.update());
    }

    /* -------------------------------------------------------- pointer -- */
    const onPointer = (e: PointerEvent) => {
      view.pointer.active = true;
      view.pointer.px = e.clientX;
      view.pointer.py = e.clientY;
      view.pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      view.pointer.y = -((e.clientY / window.innerHeight) * 2 - 1);
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    /* ----------------------------------------------------------- frame -- */
    let prevScroll = 0;
    let lastSeek = 0;
    let desync = 0;

    const tick = (time: number, deltaMs: number) => {
      const dt = Math.min(deltaMs / 1000, 1 / 20);
      if (lenisRef) lenisRef.raf(time * 1000);

      view.time += dt;

      // Anchor jumps, browser scroll restoration and any stray scrollTo move
      // the document without telling Lenis. Lenis drives the DOM scroll itself
      // every frame, so in normal use these two agree closely — a gap that
      // persists means something else moved us, and we snap Lenis back onto it.
      const y = lenisRef ? lenisRef.scroll : window.scrollY;
      view.scroll = y;
      view.velocity = damp(view.velocity, y - prevScroll, 8, dt);
      prevScroll = y;

      // Anchor jumps and browser scroll restoration move the document without
      // telling Lenis, which then reads a stale position and freezes every
      // scroll-driven layer. Snap it back — but only once things have actually
      // come to rest. Checking mid-flight fights the momentum instead: Lenis's
      // animated position legitimately leads the DOM's while a wheel burst is
      // still settling, and resyncing there makes the page crawl.
      if (lenisRef && Math.abs(view.velocity) < 0.5) {
        if (Math.abs(window.scrollY - lenisRef.scroll) > 24) {
          if (++desync > 20) {
            lenisRef.scrollTo(window.scrollY, { immediate: true, force: true });
            desync = 0;
          }
        } else desync = 0;
      } else desync = 0;

      const vh = window.innerHeight;
      view.progress = clamp(y / view.limit);

      /* per-stage reveal ------------------------------------------------ */
      const mid = y + vh * 0.5;
      let section = 0;
      for (let i = 0; i < STAGES.length; i++) {
        const name = STAGES[i];
        const b = view.bounds[name];
        const bottom = b.top + b.height;
        // enters late enough that the reel never bleeds under the work grid
        const enter = norm(y, b.top - vh * 0.72, b.top - vh * 0.08);
        const exit = norm(y, bottom - vh, bottom - vh * 0.1);
        view.reveal[name] = enter * (1 - exit);
        if (mid >= b.top && mid < bottom) section = i;
      }
      view.section = section;
      view.sectionProgress = stageLocal(STAGES[section]);

      /* eased pointer --------------------------------------------------- */
      const lam = view.reduced ? 40 : 6;
      view.pointer.ex = damp(view.pointer.ex, view.pointer.x, lam, dt);
      view.pointer.ey = damp(view.pointer.ey, view.pointer.y, lam, dt);
      view.pointer.epx = damp(view.pointer.epx, view.pointer.px, 11, dt);
      view.pointer.epy = damp(view.pointer.epy, view.pointer.py, 11, dt);

      const seek = time * 1000 - lastSeek > SEEK_INTERVAL;
      if (seek) lastSeek = time * 1000;
      writeDom(seek, dt);
    };

    /** Paused video + scroll = timeline. Throttled, and never on mobile. */
    const scrub = (v: HTMLVideoElement | null, p: number) => {
      if (!v || view.mobile || view.reduced) return;
      if (v.readyState < 1 || !v.duration || !Number.isFinite(v.duration)) return;
      const t = clamp(p) * (v.duration - 0.05);
      if (Math.abs(v.currentTime - t) > 1 / 30) v.currentTime = t;
    };

    /* ------------------------------------------------------- DOM write -- */
    const writeDom = (seek: boolean, dt: number) => {
      const reduced = view.reduced;
      const vh = window.innerHeight;

      /* copy panels — only the hero's. Screens 2–4 are deliberately static:
         scroll progress drives the first screen and nothing else. */
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

      /* ---- hero: subtle depth + a 3–4° pointer tilt ---- */
      const heroP = stageLocal("hero");
      if (nodes.heroBg && !reduced) {
        // slow dolly on the background film, and it settles back as you leave
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
      if (seek) scrub(nodes.heroBgVideo, heroP);

      /* ---- work: the chooser's decks ---- */
      for (const t of nodes.catTiles) {
        const rel = (t.top - view.scroll) / vh;
        const reveal = reduced ? 1 : smoothstep(1.0, 0.45, rel);
        t.el.style.opacity = reveal.toFixed(3);
        t.el.style.transform = reduced
          ? "none"
          : `translate3d(0, ${((1 - reveal) * (40 + t.col * 26)).toFixed(1)}px, 0)`;
      }

      /* ---- work: the measuring-rule carousel ----
         Page scroll through the well is the position on the rule. Names travel
         past a fixed centre mark, the rules slide under them, and the current
         project's still fades in behind. */
      const railN = nodes.railItems.length;
      if (railN) {
        const vw = window.innerWidth;
        const rail = view.rail;
        rail.count = railN;
        rail.target = stageLocal("work") * Math.max(0, railN - 1);

        /* A damped spring, integrated per frame, rather than reading the scroll
           position straight. Scroll sets where the rail *wants* to be; the mass
           takes a moment to get there and overshoots slightly on the way — that
           slight lag and settle is what makes it feel like an object being
           pushed rather than a value being scrubbed. */
        if (reduced) {
          rail.pos = rail.target;
          rail.vel = 0;
        } else {
          const K = 190; // stiffness
          const C = 26; // damping
          const a = (rail.target - rail.pos) * K - rail.vel * C;
          rail.vel += a * dt;
          rail.pos += rail.vel * dt;
        }
        const pos = rail.pos;
        const stride = vw * (view.mobile ? 0.94 : 0.78);
        const current = clamp(Math.round(pos), 0, railN - 1);

        for (const el of nodes.railItems) {
          const i = Number(el.dataset.index || 0);
          const d = i - pos;
          const ad = Math.abs(d);
          const near = clamp(1 - ad);

          // the spring's velocity leans the names into the direction of travel
          const lean = reduced ? 0 : clamp(view.rail.vel * 0.6, -6, 6) * near;

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
        }

        // the rules travel under the names, one major tick per project
        for (const el of nodes.railRules) {
          el.style.transform = `translate3d(${(-pos * 70).toFixed(1)}px, 0, 0)`;
        }

        if (nodes.railCounter) {
          const label = String(current + 1).padStart(2, "0");
          if (nodes.railCounter.textContent !== label)
            nodes.railCounter.textContent = label;
        }
      }

      /* ---- reel: the frame opens up ----
         Scroll through the well grows the media from a card to full bleed and
         parts the two words. Playback is untouched — the film runs on its own
         clock; this only resizes the window onto it. */
      if (nodes.reelFrame) {
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

        // The title dissolves as the film opens instead of sliding apart: the
        // reel carries its own on-screen type, and two sets of words fighting
        // over the same frame is noise. It swells very slightly on the way out.
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

      /* ---- connect: the word pulse is time-based, never scroll-based ---- */
      if (!reduced) {
        for (let i = 0; i < nodes.connectWords.length; i++) {
          const w = nodes.connectWords[i];
          const pulse = 0.5 + 0.5 * Math.sin(view.time * 0.5 + i * 0.41);
          w.style.opacity = String(lerp(0.55, 1, pulse));
        }
      }

      /* ---- chrome ---- */
      if (nodes.progressBar)
        nodes.progressBar.style.transform = `scaleX(${view.progress})`;
      for (const t of nodes.railTicks) {
        const i = Number(t.dataset.index || 0);
        const on = view.section === i;
        t.style.opacity = String(on ? 1 : 0.3);
        t.style.transform = `scaleX(${on ? 1 : 0.42})`;
      }
      if (nodes.cursor && view.pointer.active) {
        nodes.cursor.style.transform =
          `translate3d(${view.pointer.epx}px, ${view.pointer.epy}px, 0) ` +
          `translate(-50%,-50%)`;
      }
    };

    /* ----------------------------------------------------------- wire -- */
    measure();
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    // A hidden tab freezes rAF, so the loop stops and the engine's view of the
    // scroll goes stale — anything it drives (panel opacity included) would be
    // wrong for a frame on return. Resync the moment we are visible again.
    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      lenisRef?.scrollTo(window.scrollY, { immediate: true, force: true });
      measure();
    };
    document.addEventListener("visibilitychange", onVisible);

    const ro = new ResizeObserver(() => measure());
    ro.observe(document.body);
    window.addEventListener("resize", measure);
    window.addEventListener("minho:layout", measure);

    return () => {
      gsap.ticker.remove(tick);
      ro.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("minho:layout", measure);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("pointermove", onPointer);
      lenisRef?.destroy();
      lenisRef = null;
    };
  }, []);

  return null;
}
