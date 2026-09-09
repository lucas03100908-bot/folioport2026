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

/*
 * A room, not a picture of one.
 *
 * The camera sits inside a box and looks at the back wall, which is what makes
 * the one-point perspective. Every surface is found by intersecting the ray
 * with the six planes analytically — no marching, no texture, no image — so
 * the whole space costs a handful of divides per pixel. The liquid is a height
 * field on the floor of that box, and it reflects the room by bouncing the ray
 * once and looking again.
 */
const vec3 HALF = vec3(1.25, 0.60, 1.45);
const vec3 CEN = vec3(0.0, 0.0, -0.45);

float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}

/* Where a ray that starts inside the box leaves it, and by which face. */
float boxExit(vec3 ro, vec3 rd, out vec3 n){
  vec3 inv = 1.0 / rd;
  vec3 tf = max((CEN - HALF - ro) * inv, (CEN + HALF - ro) * inv);
  float t = min(min(tf.x, tf.y), tf.z);
  if (t == tf.x) n = vec3(-sign(rd.x), 0.0, 0.0);
  else if (t == tf.y) n = vec3(0.0, -sign(rd.y), 0.0);
  else n = vec3(0.0, 0.0, -sign(rd.z));
  return t;
}

/* The coffered ceiling is the only light in the room, so it is also the thing
   the liquid has to have something to reflect. */
float panels(vec2 p){
  vec2 g = abs(fract(p * 0.9) - 0.5);
  return 1.0 - smoothstep(0.36, 0.45, max(g.x, g.y));
}

vec3 room(vec3 p, vec3 n){
  float back = clamp((p.z - (CEN.z - HALF.z)) / (2.0 * HALF.z), 0.0, 1.0);
  if (n.y < -0.5) return mix(vec3(0.05), u_tint * 0.5 + vec3(0.46), panels(p.xz));
  if (n.y > 0.5) return vec3(0.048 + 0.04 * back);
  return vec3(0.04 + 0.065 * back);
}

float waves(vec2 xz){
  float a = 0.005 + u_slosh * 0.028;
  return a * (sin(xz.x * 3.3 + u_time * 1.5)
            + sin(xz.y * 2.6 - u_time * 1.2) * 0.8
            + sin((xz.x + xz.y) * 5.1 + u_time * 2.3) * 0.45);
}

float surfaceY(vec2 xz){
  return CEN.y - HALF.y
       + u_level * (2.0 * HALF.y) * 0.62
       + u_tilt * xz.x * 0.075
       + waves(xz);
}

void main(){
  /* Framed off the card's shorter side, not its height. Normalising by height
     alone narrowed the horizontal field of view as the card got narrower, so
     on a phone — where the card is taller than it is wide — both side walls
     fell outside the frame and the room collapsed into horizontal bands: a
     ceiling, a back wall, a puddle, and no sense of a space at all. */
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / min(u_res.x, u_res.y);
  vec3 ro = vec3(0.0, 0.06, 1.05);
  vec3 rd = normalize(vec3(uv, -0.95));

  vec3 nR; float tR = boxExit(ro, rd, nR);
  vec3 col = room(ro + rd * tR, nR);

  if (abs(rd.y) > 0.0001){
    /* Onto the height field with a couple of Newton steps rather than a march:
       the waves are shallow, so the flat-plane guess is already close. */
    float t = (surfaceY(ro.xz) - ro.y) / rd.y;
    for (int i = 0; i < 3; i++){
      vec3 q = ro + rd * t;
      t -= (q.y - surfaceY(q.xz)) / rd.y;
    }
    vec3 p = ro + rd * t;
    if (t > 0.0 && t < tR && abs(p.x - CEN.x) < HALF.x && abs(p.z - CEN.z) < HALF.z){
      float e = 0.02;
      float h = surfaceY(p.xz);
      vec3 nL = normalize(vec3(h - surfaceY(p.xz + vec2(e, 0.0)), e,
                               h - surfaceY(p.xz + vec2(0.0, e))));
      vec3 rr = reflect(rd, nL);
      vec3 n2; float t2 = boxExit(p + nL * 0.002, rr, n2);
      vec3 refl = room(p + rr * t2, n2);

      float fres = pow(1.0 - max(0.0, dot(-rd, nL)), 3.0);
      float deep = clamp((h - (CEN.y - HALF.y)) / (2.0 * HALF.y), 0.0, 1.0);
      vec3 body = mix(u_tint * 0.26, u_tint * 0.88 + vec3(0.04), deep);
      col = mix(body, refl, clamp(0.16 + 0.78 * fres, 0.0, 1.0));
      col += u_tint * pow(fres, 2.0) * u_slosh * 0.3;
    }
  }

  /* The card sets type over this, and the ceiling is the brightest thing in
     the frame. Pull the top down so the eyebrow stays readable. */
  float y = gl_FragCoord.y / u_res.y;
  col *= 1.0 - 0.45 * smoothstep(0.5, 1.0, y);

  col += (hash(gl_FragCoord.xy) - 0.5) * 0.02;
  gl_FragColor = vec4(col, 1.0);
}`;

const BASE = 0.56;

/** the site accent, used when a caller hands over no tint */
const DEFAULT_TINT: [number, number, number] = [1.0, 0.28, 0.1];

export default function LiquidTank({
  children,
  tint,
  still,
  liquid = true,
  className,
  onClick,
  label,
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
  /** what the card announces itself as; only meaningful when it is pressable */
  label?: string;
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

  /* A card that does something is a button, not a div with a handler. As a
     div it took no focus, answered no Enter or Space, and announced itself as
     nothing — which meant the whole site, disciplines and projects both, could
     not be opened without a mouse. */
  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      ref={host as React.Ref<HTMLDivElement & HTMLButtonElement>}
      onClick={onClick}
      {...(onClick ? { type: "button" as const, "aria-label": label } : null)}
      className={cn("liquid-tank", className)}
    >
      {still && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={still}
            alt=""
            aria-hidden
            /* A missing still would otherwise leave the card's flat charcoal
               with a broken-image glyph on it. Hide the element and the card
               falls back to its own ground, which is a plausible card. */
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
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
      <span className="relative z-10 flex h-full flex-col justify-between p-7 md:p-10">
        {children}
      </span>
    </Tag>
  );
}
