"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * A tank of liquid, simulated rather than animated.
 *
 * The surface is three summed sines plus fbm caustics in a fragment shader,
 * driven by three state variables that behave like a fluid:
 *
 *   slosh  turbulence, gained from how fast the pointer sweeps the face and
 *          bled off exponentially
 *   tilt   the surface tips toward the pointer, chased with a first-order lag
 *   gulp   a press discharges the tank; the level drops and refills
 *
 * All three decay with `exp(-k · dt)`, so the feel is frame-rate independent.
 * Adapted from the Nexus tactile reference — that one ships a whole page inside
 * an iframe; here it is a plain canvas with the colour passed in.
 *
 * Each tank owns a WebGL context, so it stops drawing whenever its wrapper is
 * transparent (the rail hides everything but a few cards) and releases the
 * context on unmount.
 */

const VS = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";

const FS = `precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform float u_level;
uniform float u_tilt;
uniform float u_slosh;
uniform vec3 u_tint;

float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
float noise(vec2 p){
  vec2 i=floor(p), f=fract(p);
  vec2 u=f*f*(3.0-2.0*f);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),
             mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);
}
float fbm(vec2 p){
  float v=0.0; float a=0.5;
  for(int i=0;i<4;i++){ v+=a*noise(p); p=p*2.04+vec2(11.3,7.1); a*=0.5; }
  return v;
}

void main(){
  vec2 uv = gl_FragCoord.xy / u_res;
  float ar = u_res.x / u_res.y;
  float x = uv.x * ar;
  float t = u_time;

  float amp = 0.012 + u_slosh * 0.045;
  float surf = u_level
    + u_tilt * (uv.x - 0.5) * 0.30
    + amp * sin(x * 5.1 + t * 4.6)
    + amp * 0.62 * sin(x * 9.7 + t * (-6.8) + 1.7)
    + amp * 0.38 * sin(x * 14.3 + t * 8.9 + 4.2);

  float d = surf - uv.y;

  float inside = smoothstep(0.0, 0.012, d);
  float depth = clamp(d / max(u_level, 0.001), 0.0, 1.0);

  vec3 col = mix(u_tint * 1.15 + vec3(0.22), u_tint * 0.26, depth);
  float caust = fbm(vec2(x * 4.2, (uv.y + t * 0.14) * 4.2));
  col *= 0.8 + 0.42 * caust;
  col += u_tint * 0.45 * pow(max(0.0, d * 3.0), 1.5) * u_slosh;

  // the waterline: a broad glow and a hot core, both of which read above the
  // surface too — so they carry their own alpha
  float glow = exp(-abs(d) * 80.0) * 0.8;
  float core = exp(-abs(d) * 220.0) * 0.4;
  col += (u_tint + vec3(0.45)) * glow;
  col += vec3(1.0) * core;

  vec2 e = uv * (1.0 - uv);
  col *= 0.55 + 0.45 * pow(e.x * e.y * 16.0, 0.22);

  /* Everything above the surface is transparent, so the card's still shows
     through and the object reads as half-submerged rather than as a panel with
     a gradient painted on it. */
  float a = clamp(inside + glow + core, 0.0, 1.0);
  gl_FragColor = vec4(col, a);
}`;

const BASE = 0.56;

/** the site accent, used when a caller hands over no tint */
const DEFAULT_TINT: [number, number, number] = [1.0, 0.3, 0.11];

export default function LiquidTank({
  children,
  tint,
  still,
  liquid = true,
  className,
  onClick,
}: {
  children?: React.ReactNode;
  tint?: [number, number, number];
  /** the card's own image, seen above the waterline */
  still?: string;
  /**
   * Whether the card holds liquid. Off, it is a plain still card and no WebGL
   * context is created at all — the disciplines are the things that carry
   * liquid; a project is its image.
   */
  liquid?: boolean;
  className?: string;
  onClick?: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  /** bumped when the driver hands the context back, to rebuild the pipeline */
  const [generation, setGeneration] = useState(0);
  // a missing tint must not take the render loop down with it
  const tintRef = useRef<[number, number, number]>(tint ?? DEFAULT_TINT);
  tintRef.current = tint ?? DEFAULT_TINT;

  useEffect(() => {
    const el = canvas.current;
    const box = host.current;
    if (!el || !box || !liquid) return;

    /* The browser may take the context away (tab backgrounded, GPU reset, too
       many live contexts). Refusing the default lets it be handed back, and the
       generation bump rebuilds the program against the restored context. */
    const onLost = (e: Event) => {
      e.preventDefault();
    };
    const onRestored = () => setGeneration((g) => g + 1);
    el.addEventListener("webglcontextlost", onLost);
    el.addEventListener("webglcontextrestored", onRestored);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const gl = el.getContext("webgl", {
      antialias: false,
      alpha: true,
      premultipliedAlpha: false,
    });
    if (!gl || gl.isContextLost()) {
      box.style.background =
        "linear-gradient(to top, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.14) 54%, #0a0a0c 55%)";
      el.style.display = "none";
      return;
    }

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      return sh;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const locP = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(locP);
    gl.vertexAttribPointer(locP, 2, gl.FLOAT, false, 0, 0);

    const u = {
      res: gl.getUniformLocation(prog, "u_res"),
      time: gl.getUniformLocation(prog, "u_time"),
      level: gl.getUniformLocation(prog, "u_level"),
      tilt: gl.getUniformLocation(prog, "u_tilt"),
      slosh: gl.getUniformLocation(prog, "u_slosh"),
      tint: gl.getUniformLocation(prog, "u_tint"),
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(el.clientWidth * dpr));
      const h = Math.max(1, Math.round(el.clientHeight * dpr));
      if (el.width !== w || el.height !== h) {
        el.width = w;
        el.height = h;
        gl.viewport(0, 0, w, h);
      }
    };
    resize();
    window.addEventListener("resize", resize);

    const s = { level: BASE, gulp: 0, slosh: 0.4, tilt: 0, tiltTo: 0, lastX: -1 };
    const onMove = (e: PointerEvent) => {
      const r = box.getBoundingClientRect();
      const x = (e.clientX - r.left) / Math.max(1, r.width);
      if (s.lastX >= 0) s.slosh = Math.min(1.4, s.slosh + Math.abs(x - s.lastX) * 2.6);
      s.lastX = x;
      s.tiltTo = Math.max(-1, Math.min(1, (x - 0.5) * 2));
    };
    const onLeave = () => {
      s.lastX = -1;
      s.tiltTo = 0;
    };
    const onDown = () => {
      s.gulp = 1;
      s.slosh = Math.min(1.4, s.slosh + 0.7);
    };
    box.addEventListener("pointermove", onMove);
    box.addEventListener("pointerleave", onLeave);
    box.addEventListener("pointerdown", onDown);

    let raf = 0;
    let last = performance.now();
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;

      s.slosh *= Math.exp(-1.5 * dt);
      s.gulp *= Math.exp(-1.1 * dt);
      s.tilt += (s.tiltTo - s.tilt) * Math.min(1, dt * 5);
      s.level += (BASE - 0.36 * s.gulp - s.level) * Math.min(1, dt * 5.5);

      if (gl.isContextLost()) return;

      // the rail keeps all but a few cards transparent; skip those entirely
      const shown = Number(
        (box.closest("[data-engine='rail-item']") as HTMLElement | null)?.style
          .opacity ?? "1",
      );
      if (shown < 0.05) return;

      resize();
      const t = tintRef.current;
      gl.uniform2f(u.res, el.width, el.height);
      gl.uniform1f(u.time, reduced ? 2 : now / 1000);
      gl.uniform1f(u.level, s.level);
      gl.uniform1f(u.tilt, s.tilt);
      gl.uniform1f(u.slosh, reduced ? 0.25 : s.slosh);
      gl.uniform3f(u.tint, t[0], t[1], t[2]);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      box.removeEventListener("pointermove", onMove);
      box.removeEventListener("pointerleave", onLeave);
      box.removeEventListener("pointerdown", onDown);
      el.removeEventListener("webglcontextlost", onLost);
      el.removeEventListener("webglcontextrestored", onRestored);
      /* Deliberately NOT calling loseContext() here. React runs effects
         mount → cleanup → mount in development, and destroying the context on
         that first cleanup leaves the remount holding a dead one — a blank
         white card. The context dies with the canvas when it is collected. */
    };
  }, [generation, liquid]);

  return (
    <div ref={host} onClick={onClick} className={cn("liquid-tank", className)}>
      {still && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={still}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover"
          />
          <span
            aria-hidden
            className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/20 to-transparent"
          />
        </>
      )}
      {still && !liquid && (
        /* no waterline to darken the lower half, so the scrim has to */
        <span
          aria-hidden
          className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/10 to-black/90"
        />
      )}
      {liquid && (
        <canvas
          ref={canvas}
          aria-hidden
          className="absolute inset-0 h-full w-full"
        />
      )}
      <div className="relative z-10 flex h-full flex-col justify-between p-7 md:p-10">
        {children}
      </div>
    </div>
  );
}
