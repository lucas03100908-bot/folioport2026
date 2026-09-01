"use client";

/**
 * components/ScrollEngine.tsx
 *
 * Renders nothing. Owns the single animation frame loop for the whole page:
 *   1. drives Lenis (or plain native scroll under prefers-reduced-motion)
 *   2. updates the mutable `view` object in lib/state.ts
 *   3. hands that frame to the writers in lib/engine/writers.ts, which put it
 *      on the DOM
 *
 * No React state is set here, ever. The node handles live in lib/engine/nodes.ts
 * and the per-stage rules in lib/engine/writers.ts — this file is only the
 * clock and the scroll bookkeeping.
 */

import { useEffect } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import {
  STAGES,
  type StageName,
  clamp,
  damp,
  norm,
  readEnvironment,
  view,
} from "@/lib/state";
import { EMPTY_NODES, collectNodes, type EngineNodes } from "@/lib/engine/nodes";
import { WRITERS, type FrameContext } from "@/lib/engine/writers";

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
  if (lenisRef) lenisRef.scrollTo(el, { immediate: !smooth });
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
  if (lenisRef) lenisRef.scrollTo(y);
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

export default function ScrollEngine() {
  useEffect(() => {
    readEnvironment();

    let nodes: EngineNodes = EMPTY_NODES;

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
      nodes = collectNodes();
    };

    /* ---------------------------------------------------------- lenis -- */
    if (!view.reduced) {
      lenisRef = new Lenis({
        duration: 1.15,
        lerp: 0.09,
        smoothWheel: true,
        touchMultiplier: 1.4,
      });
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

    /** Paused video + scroll = timeline. Throttled, and never on mobile. */
    const scrub = (v: HTMLVideoElement | null, p: number) => {
      if (!v || view.mobile || view.reduced) return;
      if (v.readyState < 1 || !v.duration || !Number.isFinite(v.duration)) return;
      const t = clamp(p) * (v.duration - 0.05);
      if (Math.abs(v.currentTime - t) > 1 / 30) v.currentTime = t;
    };

    /* ----------------------------------------------------------- frame -- */
    let prevScroll = 0;
    let lastSeek = 0;
    let desync = 0;

    const tick = (time: number, deltaMs: number) => {
      const dt = Math.min(deltaMs / 1000, 1 / 20);
      if (lenisRef) lenisRef.raf(time * 1000);

      view.time += dt;

      const y = lenisRef ? lenisRef.scroll : window.scrollY;
      view.scroll = y;
      view.velocity = damp(view.velocity, y - prevScroll, 8, dt);
      prevScroll = y;

      /* Anchor jumps and browser scroll restoration move the document without
         telling Lenis, which then reads a stale position and freezes every
         scroll-driven layer. Snap it back — but only once things have actually
         come to rest. Checking mid-flight fights the momentum instead: Lenis's
         animated position legitimately leads the DOM's while a wheel burst is
         still settling, and resyncing there makes the page crawl. */
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

      const seek = time * 1000 - lastSeek > SEEK_INTERVAL;
      if (seek) lastSeek = time * 1000;

      const frame: FrameContext = {
        nodes,
        reduced: view.reduced,
        vh,
        vw: window.innerWidth,
        dt,
        seek,
        scrub,
        stageLocal,
      };
      for (const write of WRITERS) write(frame);
    };

    /* ------------------------------------------------------------ wire -- */
    measure();
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);

    /* A hidden tab freezes rAF, so the loop stops and the engine's view of the
       scroll goes stale — anything it drives (panel opacity included) would be
       wrong for a frame on return. Resync the moment we are visible again. */
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
      window.removeEventListener("pointermove", onPointer);
      document.removeEventListener("visibilitychange", onVisible);
      lenisRef?.destroy();
      lenisRef = null;
    };
  }, []);

  return null;
}
