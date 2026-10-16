"use client";

import { useEffect, useRef } from "react";
import { CATEGORY_TINT, type CategoryId } from "@/lib/content";

/**
 * What the water does to the room it is standing in.
 *
 * A tank full of lit liquid in a black void is the one thing in the chooser
 * that does not behave like an object: light leaves it and lands on nothing.
 * Hover a card and this puts that light back.
 *
 * The field is the gradient-mesh shader from the reference, run on a bare
 * WebGL context rather than through a scene library — the same way the tanks
 * themselves are drawn, and the reason there is no `ogl` in package.json for
 * one full-screen triangle. The distortion loop, the swirl, the waves and
 * the colour-dodge grain are the reference's; what changed is the palette.
 *
 * Three colours, all of them the hovered card's own water: a near-black at
 * the bottom of the ramp, the liquid itself in the middle, and a pale
 * highlight. `CATEGORY_TINT` is the shader's own tint for that discipline,
 * so the room and the tank cannot drift apart. Moving to another card lerps
 * the three, which is why there is one canvas here and not one per
 * discipline — three more live contexts for a background, on a screen that
 * already holds three tanks, is not a trade worth making.
 *
 * The canvas is masked twice in CSS: out of the nav's band and the rail
 * controls' band, which carry small dim type, and into an ellipse around the
 * card, which is the difference between a lamp in a dark room and a colour
 * laid over the whole screen.
 */

const VS = `attribute vec2 p;
varying vec2 vUv;
void main(){ vUv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }`;

/**
 * Iterations of the reference's distortion loop. Seven rather than its five:
 * each turn folds the field again, and the extra two are what make it
 * reorganise as it moves instead of sliding past in one piece. It is a
 * full-screen loop, so it is also the one number here with a real cost —
 * measured at DPR 1 it does not move the frame rate.
 */
const DISTORTION = 7;

const FS = `precision highp float;

uniform float uTime;
uniform float uSwirl;
uniform float uSpeed;
uniform float uScale;
uniform float uRotation;
uniform float uWaveAmp;
uniform float uWaveFreq;
uniform float uWaveSpeed;
uniform float uGrain;
uniform vec3 uColorA;
uniform vec3 uColorB;
uniform vec3 uColorC;
uniform vec2 uResolution;

varying vec2 vUv;

float wave(vec2 uv, float freq, float speed, float time) {
  return sin(uv.x * freq + time * speed) * cos(uv.y * freq + time * speed);
}

float random(vec2 st) {
  return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

vec3 colorDodge(vec3 base, vec3 blend) {
  return min(base / (1.0 - blend + 0.0001), 1.0);
}

void main() {
  float mr = min(uResolution.x, uResolution.y);
  vec2 uv = (vUv * 2.0 - 1.0) * uResolution / mr;

  uv = uv * uScale;

  float cosR = cos(uRotation);
  float sinR = sin(uRotation);
  uv = vec2(uv.x * cosR - uv.y * sinR, uv.x * sinR + uv.y * cosR);

  uv.x += wave(uv, uWaveFreq, uWaveSpeed, uTime) * uWaveAmp;
  uv.y += wave(uv + 10.0, uWaveFreq * 1.5, uWaveSpeed * 0.8, uTime) * uWaveAmp * 0.5;

  float angle = atan(uv.y, uv.x);
  float radius = length(uv);
  angle += uSwirl * radius;
  uv = vec2(cos(angle), sin(angle)) * radius;

  float d = -uTime * 0.5 * uSpeed;
  float a = 0.0;
  for (int i = 0; i < ${DISTORTION}; ++i) {
    float fi = float(i);
    a += cos(fi - d - a * uv.x);
    d += sin(uv.y * fi + a);
  }
  d += uTime * 0.5 * uSpeed;

  float mix1 = (sin(d) + 1.0) * 0.5;
  float mix2 = (cos(a) + 1.0) * 0.5;
  vec3 col = mix(uColorA, uColorB, mix1);
  col = mix(col, uColorC, mix2);

  /* The reference's grain, kept for what it does here as much as for the
     texture: a wide gradient running out of near-black bands into visible
     rings on an 8-bit screen, and a little noise is what breaks the step. */
  float grain = (random(gl_FragCoord.xy + uTime) - 0.5) * uGrain;
  col = colorDodge(col, vec3(0.5 + grain));

  gl_FragColor = vec4(col, 1.0);
}`;

/** linear-light channel to the sRGB value a screen is handed */
const toSrgb = (c: number) =>
  c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;

/**
 * One discipline's water as the shader's three stops.
 *
 * Darkest first: the field spends most of its area in the bottom half of
 * this ramp, and a ramp that starts at the liquid rather than below it turns
 * the screening room into a swimming pool.
 *
 * The highlight is the tint opened up to its own brightest — divided through
 * by its largest channel — rather than mixed toward white. Mixing toward
 * white is what a highlight does on paper; on a light it desaturates, and
 * the first build of this came out as a grey fog with no colour left in it.
 *
 * Then everything is halved, because the reference's grain pass is a colour
 * dodge against a mid grey: `col / (1 - 0.5)` is `col * 2`, applied to every
 * pixel. The doubling is part of that look, so it is compensated here rather
 * than removed — undo it in the shader and the grain stops reading.
 */
const ramp = (t: [number, number, number]): number[] => {
  const peak = Math.max(...t) || 1;
  const dark = t.map((c) => toSrgb(c * 0.05));
  const body = t.map((c) => toSrgb(c * 0.5));
  const lift = t.map((c) => toSrgb((c / peak) * 0.8));
  return [...dark, ...body, ...lift].map((c) => c * 0.5);
};

const RAMPS: Record<CategoryId, number[]> = {
  realtime: ramp(CATEGORY_TINT.realtime),
  motion: ramp(CATEGORY_TINT.motion),
  ux: ramp(CATEGORY_TINT.ux),
};

export default function DisciplineGlow({
  ids,
  lit,
}: {
  /** the disciplines, in rail order */
  ids: CategoryId[];
  /** index of the card under the pointer, or null */
  lit: number | null;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  /* The colours the shader is actually showing, chased toward the hovered
     card's. Held outside React: they change every frame and nothing renders
     on them. */
  const shown = useRef<number[]>([...(RAMPS[ids[0]] ?? RAMPS.realtime)]);
  const target = useRef<number[]>(shown.current);
  /* Whether anything is lit, read by the loop. The fade itself is CSS on the
     canvas; this is only what decides when drawing can stop. */
  const awake = useRef(false);

  const id = lit === null ? null : ids[lit];
  if (id) target.current = RAMPS[id];
  awake.current = lit !== null;

  useEffect(() => {
    const el = canvas.current;
    if (!el) return;

    const gl = el.getContext("webgl", { antialias: false, alpha: false });
    if (!gl || gl.isContextLost()) return;

    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.error("discipline-glow shader:", gl.getShaderInfoLog(sh));
        return null;
      }
      return sh;
    };
    const vs = compile(gl.VERTEX_SHADER, VS);
    const fs = compile(gl.FRAGMENT_SHADER, FS);
    /* A failed compile is silent in WebGL — the draw becomes a no-op and the
       canvas stays black, which here is indistinguishable from working. */
    if (!vs || !fs) return;

    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error("discipline-glow link:", gl.getProgramInfoLog(prog));
      return;
    }
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 3, -1, -1, 3]),
      gl.STATIC_DRAW,
    );
    const locP = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(locP);
    gl.vertexAttribPointer(locP, 2, gl.FLOAT, false, 0, 0);

    const u = (n: string) => gl.getUniformLocation(prog, n);
    const uTime = u("uTime");
    const uRes = u("uResolution");
    const uA = u("uColorA");
    const uB = u("uColorB");
    const uC = u("uColorC");

    /*
     * The reference's numbers, opened up.
     *
     * The two clocks run at two and a half times its speed, and they move
     * together: `uSpeed` drives the distortion loop and `uWaveSpeed` the
     * water underneath it, and changing either alone slides the two apart
     * until the field shears.
     *
     * Past that, more life comes from how far the field deforms rather than
     * from how fast it travels — speed alone turns a background into
     * something that has to be ignored, which is the opposite of the brief.
     * So the swell is twice the reference's and set longer (`uWaveAmp` up,
     * `uWaveFreq` down): the same water, moving in larger bodies rather than
     * in more ripples. The swirl is up for the curl it puts in the flow, and
     * the loop runs two extra turns for structure that reorganises as it
     * goes instead of sliding past in one piece.
     */
    gl.uniform1f(u("uSwirl"), 0.85);
    gl.uniform1f(u("uSpeed"), 2.25);
    gl.uniform1f(u("uScale"), 1.1);
    gl.uniform1f(u("uRotation"), 90);
    gl.uniform1f(u("uWaveAmp"), 0.21);
    gl.uniform1f(u("uWaveFreq"), 6.5);
    gl.uniform1f(u("uWaveSpeed"), 0.5);
    gl.uniform1f(u("uGrain"), 0.06);

    /* A background does not need the device's pixels. At DPR 1 this is a
       quarter of the fragments of a retina pass, on a field whose smallest
       feature is many pixels across — there is nothing in it to resolve. */
    const size = () => {
      const w = Math.max(1, Math.round(el.clientWidth));
      const h = Math.max(1, Math.round(el.clientHeight));
      if (el.width !== w || el.height !== h) {
        el.width = w;
        el.height = h;
      }
      gl.viewport(0, 0, w, h);
      gl.uniform2f(uRes, w, h);
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(el);

    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let last = performance.now();
    let clock = 0;
    /* How long the loop keeps running after the last card is left: the CSS
       fade is still playing, and stopping mid-fade freezes a half-lit field
       on screen. */
    let idle = 0;

    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      if (awake.current) idle = 0;
      else idle += dt;
      if (!awake.current && idle > 1.4) return;

      if (!reduced) clock += dt;

      /* Chased rather than cut: moving between cards walks the ramp across
         instead of swapping it, which on a field this large is the
         difference between a change of light and a flicker. */
      const t = shown.current;
      const g = target.current;
      const k = Math.min(1, dt * 3.2);
      for (let i = 0; i < 9; i++) t[i] += (g[i] - t[i]) * k;

      gl.uniform1f(uTime, clock);
      gl.uniform3f(uA, t[0], t[1], t[2]);
      gl.uniform3f(uB, t[3], t[4], t[5]);
      gl.uniform3f(uC, t[6], t[7], t[8]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  return (
    <div
      aria-hidden
      className="disc-glow-field pointer-events-none absolute inset-0 z-0 overflow-hidden"
    >
      {/* The light is a pool around the card, not a wash over the screen.
          Without the mask the corners furthest from the tank came up as
          bright as the air beside it, which is a colour filter, not a room
          with a lamp in it. */}
      <div className="disc-glow-pool absolute inset-0">
        <canvas
          ref={canvas}
          className="disc-glow-canvas absolute inset-0 h-full w-full"
          data-lit={lit === null ? undefined : "1"}
        />
      </div>
    </div>
  );
}
