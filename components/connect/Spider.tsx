"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SpiderCursor, type SpiderPoint } from "@/components/ui/spider-cursor";
import { clamp, view } from "@/lib/state";

/**
 * The connect screen's spiders: two of them, following the pointer.
 *
 * This wrapper owns everything portfolio-specific — when they run, what they
 * chase, and how they point at the links. The animal itself lives in
 * <SpiderCursor/>.
 */

/** How long the pointer must sit still before they stroll off to a link. */
const IDLE_AFTER = 3.5;

/** How long they stay scattered after a click before regrouping on the cursor. */
const REGROUP_AFTER = 1800;

export default function Spider() {
  const [active, setActive] = useState(false);
  const [needsGyro, setNeedsGyro] = useState(false);
  const [gyroOn, setGyroOn] = useState(false);
  const [reduced, setReduced] = useState(true);

  const tilt = useRef({ beta: 0, gamma: 0 });
  const idle = useRef(0);
  const lastPointer = useRef({ x: -1, y: -1 });
  const lastTick = useRef(0);
  const wander = useRef<{ pt: SpiderPoint; at: number } | null>(null);
  const nearest = useRef<HTMLElement | null>(null);
  const maskTick = useRef(0);
  const scatter = useRef<{ x: number; y: number; id: number; until: number } | null>(
    null,
  );

  useEffect(() => setReduced(view.reduced), []);

  /* only run while the connect screen is on-screen */
  useEffect(() => {
    const stage = document.querySelector('[data-stage="connect"]');
    if (!stage) return;
    const io = new IntersectionObserver(
      (e) => setActive(e.some((x) => x.isIntersecting)),
      { rootMargin: "-20% 0px -20% 0px", threshold: 0 },
    );
    io.observe(stage);
    return () => io.disconnect();
  }, []);

  /* gyroscope — iOS will not hand it over without a gesture */
  useEffect(() => {
    if (typeof window === "undefined" || reduced) return;
    if (!window.matchMedia("(pointer: coarse)").matches) return;
    type Req = { requestPermission?: () => Promise<PermissionState> };
    const D = window.DeviceOrientationEvent as unknown as Req | undefined;
    if (D && typeof D.requestPermission === "function") setNeedsGyro(true);
    else setGyroOn(true);
  }, [reduced]);

  useEffect(() => {
    if (!gyroOn) return;
    const onTilt = (e: DeviceOrientationEvent) => {
      tilt.current.beta = e.beta ?? 0;
      tilt.current.gamma = e.gamma ?? 0;
    };
    window.addEventListener("deviceorientation", onTilt);
    return () => window.removeEventListener("deviceorientation", onTilt);
  }, [gyroOn]);

  const askGyro = async () => {
    type Req = { requestPermission?: () => Promise<PermissionState> };
    const D = window.DeviceOrientationEvent as unknown as Req;
    try {
      if ((await D.requestPermission?.()) === "granted") {
        setGyroOn(true);
        setNeedsGyro(false);
      }
    } catch {
      /* declined — the links still work, which is the part that matters */
    }
  };

  /* click and they bolt; 1.8s later they come back to the cursor.
     Listened for on the window in the capture phase, so the click still reaches
     the link underneath — the animal reacts, the link still opens. */
  useEffect(() => {
    if (!active) return;
    const onDown = (e: PointerEvent) => {
      scatter.current = {
        x: e.clientX,
        y: e.clientY,
        id: (scatter.current?.id ?? 0) + 1,
        until: performance.now() + REGROUP_AFTER,
      };
    };
    window.addEventListener("pointerdown", onDown, { capture: true });
    return () =>
      window.removeEventListener("pointerdown", onDown, { capture: true });
  }, [active]);

  const getScatter = useCallback(() => scatter.current, []);

  const words = () =>
    Array.from(
      document.querySelectorAll<HTMLElement>('[data-engine="connect-word"]'),
    );

  /** Where the spiders head, resolved once per frame. */
  const resolveTarget = useCallback((): SpiderPoint | null => {
    const now = performance.now();
    const dt = lastTick.current ? Math.min((now - lastTick.current) / 1000, 0.1) : 0;
    lastTick.current = now;

    if (gyroOn) {
      // inverted: tilt the phone right and they walk left, as if resting on it
      const gx = clamp(tilt.current.gamma / 35, -1, 1);
      const gy = clamp((tilt.current.beta - 45) / 35, -1, 1);
      return {
        x: window.innerWidth / 2 - gx * window.innerWidth * 0.34,
        y: window.innerHeight / 2 - gy * window.innerHeight * 0.3,
      };
    }

    const moved =
      Math.abs(view.pointer.px - lastPointer.current.x) +
      Math.abs(view.pointer.py - lastPointer.current.y);
    if (moved > 1.5) {
      idle.current = 0;
      wander.current = null;
      lastPointer.current = { x: view.pointer.px, y: view.pointer.py };
    } else {
      idle.current += dt;
    }

    if (idle.current < IDLE_AFTER && view.pointer.active) {
      return { x: view.pointer.px, y: view.pointer.py };
    }

    // idle: stroll to a link, so the visitor sees where there is something to click
    if (!wander.current || now - wander.current.at > 6500) {
      const list = words().filter((el) => {
        const r = el.getBoundingClientRect();
        return r.top > 60 && r.bottom < window.innerHeight - 60 && r.width > 40;
      });
      const pick = list[Math.floor(Math.random() * list.length)];
      if (pick) {
        const r = pick.getBoundingClientRect();
        wander.current = {
          pt: { x: r.left + r.width / 2, y: r.top + r.height / 2 },
          at: now,
        };
      }
    }
    return wander.current?.pt ?? null;
  }, [gyroOn]);

  /**
   * Park the sharp layer's two light circles on the spiders, and light the word
   * the lead one stands on.
   *
   * The mask is written through CSS custom properties rather than a fresh
   * gradient string, and only every other frame — moving a mask forces the
   * masked layer to re-rasterise, and this one is a screen full of type.
   */
  const onBodies = useCallback((pts: SpiderPoint[]) => {
    maskTick.current = (maskTick.current + 1) % 2;
    if (maskTick.current === 0) {
      const near = document.querySelector<HTMLElement>("[data-connect-sharp]");
      if (near) {
        pts.slice(0, 3).forEach((p, i) => {
          near.style.setProperty(`--sx${i + 1}`, `${p.x.toFixed(1)}px`);
          near.style.setProperty(`--sy${i + 1}`, `${p.y.toFixed(1)}px`);
        });
      }
    }

    const lead = pts[0];
    if (!lead) return;
    let best: HTMLElement | null = null;
    let bestD = 120;
    for (const el of words()) {
      const r = el.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) continue;
      const d = Math.hypot(
        lead.x - (r.left + r.width / 2),
        lead.y - (r.top + r.height / 2),
      );
      if (d < bestD) {
        bestD = d;
        best = el;
      }
    }
    if (best !== nearest.current) {
      nearest.current?.removeAttribute("data-spider-near");
      best?.setAttribute("data-spider-near", "1");
      nearest.current = best;
    }
  }, []);

  useEffect(
    () => () => nearest.current?.removeAttribute("data-spider-near"),
    [],
  );

  if (reduced) return null;

  return (
    <>
      <SpiderCursor
        count={3}
        active={active}
        resolveTarget={resolveTarget}
        onBodies={onBodies}
        getScatter={getScatter}
        className="fixed inset-0 z-[12] transition-opacity duration-700"
      />
      {needsGyro && active && (
        <button
          onClick={askGyro}
          className="glass fixed inset-x-0 bottom-24 z-[13] mx-auto w-fit rounded-full px-5 py-2.5 font-mono text-[10px] tracking-[0.2em] text-muted transition-colors duration-300 hover:text-ink"
        >
          TAP TO LET THEM FOLLOW YOUR TILT
        </button>
      )}
    </>
  );
}
