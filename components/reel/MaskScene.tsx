"use client";

import { useEffect, useRef } from "react";
import { view } from "@/lib/state";

/**
 * The mask, lit by one lamp, looking at whoever is looking at it.
 *
 * Written straight against WebGL2 rather than through a scene library: the
 * whole scene is one mesh, one light and one shader, and the smallest library
 * that would draw it costs more than the model does. The mesh arrives as the
 * quantised buffer `tools/glb-to-mesh.mjs` writes (int16 positions, int8
 * normals, uint16 uvs), and the maps as WebP.
 *
 * Lighting is a single spotlight hung above and slightly in front, the way a
 * museum case is lit: a warm cone that falls off inside the frame, a cool fill
 * a twentieth of its strength so the shadow side is not a hole, and a rim term
 * that keeps the silhouette off the black. No shadow map — nothing here casts
 * onto anything but itself.
 */

import { MASK_MAPS, MASK_MESH_SRC } from "@/lib/content";

/** how far the mask turns at the edge of the frame, in radians */
const YAW = 0.62;
const PITCH = 0.34;
/** how quickly it catches up with the pointer, per second */
const FOLLOW = 3.4;

const VS = `#version 300 es
in vec3 a_pos;
in vec3 a_nrm;
in vec2 a_uv;
uniform mat4 u_proj;
uniform mat4 u_view;
uniform mat4 u_model;
uniform mat3 u_normal;
out vec3 v_world;
out vec3 v_nrm;
out vec2 v_uv;
void main() {
  vec4 world = u_model * vec4(a_pos, 1.0);
  v_world = world.xyz;
  v_nrm = u_normal * a_nrm;
  v_uv = a_uv;
  gl_Position = u_proj * u_view * world;
}`;

const FS = `#version 300 es
precision highp float;
in vec3 v_world;
in vec3 v_nrm;
in vec2 v_uv;
out vec4 fragColor;

uniform sampler2D u_color;
uniform sampler2D u_normalMap;
uniform sampler2D u_rough;
uniform vec3 u_eye;
uniform vec3 u_lightPos;
uniform vec3 u_lightDir;
uniform float u_ready;
uniform float u_horizon;

const vec3 LIGHT = vec3(1.0, 0.94, 0.86);
const vec3 FILL = vec3(0.92, 0.84, 0.70);  // the paper it stands on
const float CONE_IN = 0.9;   // cos of the hot core
const float CONE_OUT = 0.24;  // cos of the outer edge

/* Tangent frame from screen-space derivatives. The export carries no
   TANGENT attribute, and deriving one per pixel costs less than shipping a
   fourth vertex stream for a mesh this size. */
mat3 tbn(vec3 n, vec3 p, vec2 uv) {
  vec3 dp1 = dFdx(p), dp2 = dFdy(p);
  vec2 duv1 = dFdx(uv), duv2 = dFdy(uv);
  vec3 dp2perp = cross(dp2, n), dp1perp = cross(n, dp1);
  vec3 t = dp2perp * duv1.x + dp1perp * duv2.x;
  vec3 b = dp2perp * duv1.y + dp1perp * duv2.y;
  float inv = inversesqrt(max(dot(t, t), dot(b, b)));
  return mat3(t * inv, b * inv, n);
}

float ggx(float ndh, float a) {
  float a2 = a * a;
  float d = ndh * ndh * (a2 - 1.0) + 1.0;
  return a2 / max(3.14159265 * d * d, 1e-5);
}
float smithG(float ndv, float ndl, float a) {
  float k = a * 0.5;
  float gv = ndv / (ndv * (1.0 - k) + k);
  float gl = ndl / (ndl * (1.0 - k) + k);
  return gv * gl;
}

void main() {
  vec3 n = normalize(v_nrm);
  vec3 v = normalize(u_eye - v_world);
  if (!gl_FrontFacing) n = -n;

  vec3 tex = texture(u_normalMap, v_uv).xyz * 2.0 - 1.0;
  tex.xy *= 1.15;
  n = normalize(tbn(n, v_world, v_uv) * tex);

  vec3 albedo = texture(u_color, v_uv).rgb;
  /* glTF packs roughness in green and metalness in blue. The mask is wood
     and its metal channel is empty, so only roughness is read; the floor
     keeps the highlight from collapsing to a sparkle at grazing angles. */
  float rough = clamp(texture(u_rough, v_uv).g, 0.34, 0.95);
  float a = rough * rough;

  vec3 toLight = u_lightPos - v_world;
  float dist = length(toLight);
  vec3 l = toLight / dist;

  /* Spot: a cone that softens toward its edge, and inverse-square falloff so
     the top of the mask is hotter than the chin. */
  float cone = smoothstep(CONE_OUT, CONE_IN, dot(-l, u_lightDir));
  float atten = cone * 44.0 / (dist * dist);

  float ndl = max(dot(n, l), 0.0);
  float ndv = max(dot(n, v), 1e-4);
  vec3 h = normalize(l + v);
  float ndh = max(dot(n, h), 0.0);
  float vdh = max(dot(v, h), 0.0);

  vec3 f0 = vec3(0.06);  // lacquered wood, not raw
  vec3 fres = f0 + (1.0 - f0) * pow(1.0 - vdh, 5.0);
  vec3 spec = fres * ggx(ndh, a) * smithG(ndv, ndl, a) / (4.0 * ndv * max(ndl, 1e-4));

  vec3 direct = (albedo / 3.14159265 + spec) * LIGHT * ndl * atten;

  /* --- the other two lamps -------------------------------------------- */
  /* A studio, not a room: the key above and to the left carves the form, a
     cool violet from the lower right opens the shadow without filling it,
     and a hard rim behind the left shoulder cuts the piece off the paper.
     One lamp lit the mask evenly and flat; three give it a side to be dark
     on, which is what the comp has. */

  /* Violet fill, deliberately dim and deliberately cold: it is the colour of
     the shadow in the comp, and it only ever reaches what the key misses. */
  vec3 fillDir = normalize(vec3(0.85, -0.35, 0.55));
  float fillN = max(dot(n, fillDir), 0.0);
  vec3 fillLight = albedo * vec3(0.42, 0.34, 0.78) * fillN * 0.5;

  /* Rim from behind the left shoulder, on the silhouette only. */
  vec3 rimDir = normalize(vec3(-0.75, 0.42, -0.6));
  float rimN = pow(max(dot(n, rimDir), 0.0), 1.6) * pow(1.0 - ndv, 1.8);
  vec3 rimLight = vec3(1.0, 0.92, 0.84) * rimN * 1.5;

  /* Ambient is the paper's own bounce, and it stays small: a large ambient is
     exactly what made this read flat. */
  float sky = n.y * 0.5 + 0.5;
  vec3 ambient = albedo * FILL * mix(0.05, 0.14, sky) * (0.35 + 0.65 * u_horizon);

  /* The sheet under it throws a little warmth back up. */
  float up = max(-n.y, 0.0);
  vec3 bounce = albedo * vec3(1.0, 0.9, 0.78) * up * 0.1;

  float rim = pow(1.0 - ndv, 3.6) * cone * 0.4;
  vec3 col = direct + ambient + bounce + fillLight + rimLight + LIGHT * rim * albedo;

  /* Filmic shoulder, the same roll-off the water uses, then the sRGB the
     canvas is not doing for us. */
  col = col / (col + vec3(0.62)) * 1.28;
  col = pow(max(col, 0.0), vec3(1.0 / 2.2));

  /* 1/255 of dither: the background is near-black and a smooth falloff across
     2000px of frame bands without it. */
  float d = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
  col += (d - 0.5) / 255.0;

  fragColor = vec4(col * u_ready, u_ready);
}`;

type Mesh = {
  pos: Int16Array;
  nrm: Int8Array;
  uv: Uint16Array;
  idx: Uint16Array;
  halfHeight: number;
};

function parseMesh(buf: ArrayBuffer): Mesh {
  const head = new DataView(buf, 0, 32);
  if (String.fromCharCode(head.getUint8(0), head.getUint8(1), head.getUint8(2), head.getUint8(3)) !== "TALM")
    throw new Error("bad mesh");
  const verts = head.getUint32(8, true);
  const indices = head.getUint32(12, true);
  const halfHeight = head.getFloat32(20, true);
  let o = 32;
  const pos = new Int16Array(buf, o, verts * 3);
  o += verts * 6 + ((4 - ((verts * 6) % 4)) % 4);
  const nrm = new Int8Array(buf, o, verts * 4);
  o += verts * 4;
  const uv = new Uint16Array(buf, o, verts * 2);
  o += verts * 4;
  const idx = new Uint16Array(buf, o, indices);
  return { pos, nrm, uv, idx, halfHeight };
}

/* --- the four matrices this scene needs, and nothing else ---------------- */
const perspective = (fovy: number, aspect: number, near: number, far: number) => {
  const f = 1 / Math.tan(fovy / 2);
  return new Float32Array([
    f / aspect, 0, 0, 0,
    0, f, 0, 0,
    0, 0, (far + near) / (near - far), -1,
    0, 0, (2 * far * near) / (near - far), 0,
  ]);
};
const lookAt = (eye: number[], at: number[]) => {
  const z = norm([eye[0] - at[0], eye[1] - at[1], eye[2] - at[2]]);
  const x = norm(cross([0, 1, 0], z));
  const y = cross(z, x);
  return new Float32Array([
    x[0], y[0], z[0], 0,
    x[1], y[1], z[1], 0,
    x[2], y[2], z[2], 0,
    -dot(x, eye), -dot(y, eye), -dot(z, eye), 1,
  ]);
};
const cross = (a: number[], b: number[]) => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
const dot = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const norm = (a: number[]) => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};
/** yaw about Y, then pitch about X, a uniform scale, then a shift */
const modelMatrix = (yaw: number, pitch: number, s: number, shiftX = 0, shiftY = 0) => {
  const cy = Math.cos(yaw), sy = Math.sin(yaw);
  const cp = Math.cos(pitch), sp = Math.sin(pitch);
  return new Float32Array([
    cy * s, 0, -sy * s, 0,
    sy * sp * s, cp * s, cy * sp * s, 0,
    sy * cp * s, -sp * s, cy * cp * s, 0,
    shiftX, shiftY, 0, 1,
  ]);
};
/** the rotation part again, for normals (uniform scale, so no inverse needed) */
const normalMatrix = (yaw: number, pitch: number) => {
  const m = modelMatrix(yaw, pitch, 1);
  return new Float32Array([m[0], m[1], m[2], m[4], m[5], m[6], m[8], m[9], m[10]]);
};

export default function MaskScene({ className = "" }: { className?: string }) {
  const host = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = host.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl2", {
      alpha: true,
      antialias: true,
      premultipliedAlpha: true,
      powerPreference: "high-performance",
    });
    if (!gl) {
      canvas.dataset.failed = "1";
      return;
    }

    let disposed = false;
    let raf = 0;
    const state = {
      yaw: 0,
      pitch: 0,
      targetYaw: 0,
      targetPitch: 0,
      ready: 0,
      horizon: 0,
      idle: Math.random() * 6.28,
      visible: false,
    };

    const program = gl.createProgram()!;
    const compile = (type: number, source: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, source);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.error("[mask] shader:", gl.getShaderInfoLog(sh));
      }
      gl.attachShader(program, sh);
    };
    compile(gl.VERTEX_SHADER, VS);
    compile(gl.FRAGMENT_SHADER, FS);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error("[mask] link:", gl.getProgramInfoLog(program));
      canvas.dataset.failed = "1";
      return;
    }
    gl.useProgram(program);

    const u = {
      proj: gl.getUniformLocation(program, "u_proj"),
      view: gl.getUniformLocation(program, "u_view"),
      model: gl.getUniformLocation(program, "u_model"),
      normal: gl.getUniformLocation(program, "u_normal"),
      eye: gl.getUniformLocation(program, "u_eye"),
      lightPos: gl.getUniformLocation(program, "u_lightPos"),
      lightDir: gl.getUniformLocation(program, "u_lightDir"),
      ready: gl.getUniformLocation(program, "u_ready"),
      horizon: gl.getUniformLocation(program, "u_horizon"),
      color: gl.getUniformLocation(program, "u_color"),
      normalMap: gl.getUniformLocation(program, "u_normalMap"),
      rough: gl.getUniformLocation(program, "u_rough"),
    };

    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    let count = 0;
    let halfHeight = 0.5;

    /* ------------------------------------------------------------ load -- */
    /* Nothing is fetched until the stage is one viewport away. The mesh and
       its maps are 1.7MB that live on the third screen, and downloading them
       at page open would take bandwidth from the hero film, which is the
       thing actually on screen. */
    let started = false;
    const waiting: (() => void)[] = [];
    const whenNear = () =>
      new Promise<void>((resolve) => (started ? resolve() : waiting.push(resolve)));
    const near = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        started = true;
        for (const go of waiting.splice(0)) go();
        near.disconnect();
      },
      { rootMargin: "100% 0px 100% 0px", threshold: 0 },
    );
    near.observe(canvas);

    const texture = (slot: number, url: string, srgb: boolean) => {
      const tex = gl.createTexture()!;
      gl.activeTexture(gl.TEXTURE0 + slot);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      // a neutral pixel until the real map lands, so the first frames are sane
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
        new Uint8Array(srgb ? [140, 130, 120, 255] : [128, 128, 255, 255]));
      void (async () => {
        try {
          await whenNear();
          const res = await fetch(url);
          const bitmap = await createImageBitmap(await res.blob(), { imageOrientation: "none" });
          if (disposed) return;
          gl.activeTexture(gl.TEXTURE0 + slot);
          gl.bindTexture(gl.TEXTURE_2D, tex);
          gl.texImage2D(gl.TEXTURE_2D, 0, srgb ? gl.SRGB8_ALPHA8 : gl.RGBA8, bitmap.width, bitmap.height, 0,
            gl.RGBA, gl.UNSIGNED_BYTE, bitmap);
          gl.generateMipmap(gl.TEXTURE_2D);
          gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
          const aniso = gl.getExtension("EXT_texture_filter_anisotropic");
          if (aniso) {
            gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT,
              Math.min(8, gl.getParameter(aniso.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
          }
          bitmap.close();
        } catch {
          /* a missing map leaves its neutral pixel: the mask still reads */
        }
      })();
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      return tex;
    };
    const texColor = texture(0, MASK_MAPS.color, true);
    const texNormal = texture(1, MASK_MAPS.normal, false);
    const texRough = texture(2, MASK_MAPS.rough, false);
    gl.uniform1i(u.color, 0);
    gl.uniform1i(u.normalMap, 1);
    gl.uniform1i(u.rough, 2);

    const vao = gl.createVertexArray()!;
    const buffers: WebGLBuffer[] = [];
    void (async () => {
      try {
        await whenNear();
        const res = await fetch(MASK_MESH_SRC);
        const mesh = parseMesh(await res.arrayBuffer());
        if (disposed) return;
        halfHeight = mesh.halfHeight;
        count = mesh.idx.length;
        gl.bindVertexArray(vao);
        const attrib = (name: string, data: ArrayBufferView, size: number, type: number, normalized: boolean) => {
          const b = gl.createBuffer()!;
          buffers.push(b);
          gl.bindBuffer(gl.ARRAY_BUFFER, b);
          gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
          const loc = gl.getAttribLocation(program, name);
          gl.enableVertexAttribArray(loc);
          gl.vertexAttribPointer(loc, size, type, normalized, 0, 0);
        };
        attrib("a_pos", mesh.pos, 3, gl.SHORT, true);
        attrib("a_nrm", mesh.nrm, 4, gl.BYTE, true);
        attrib("a_uv", mesh.uv, 2, gl.UNSIGNED_SHORT, true);
        const ib = gl.createBuffer()!;
        buffers.push(ib);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.idx, gl.STATIC_DRAW);
        gl.bindVertexArray(null);
      } catch (err) {
        console.error("[mask] mesh:", err);
        canvas.dataset.failed = "1";
      }
    })();

    /* ---------------------------------------------------------- input -- */
    const onPointer = (e: PointerEvent) => {
      /* Measured against the window rather than the canvas: the frame grows
         from a card to the whole screen as you scroll, and a pointer read
         against the card would sit five card-widths away and peg the turn at
         full deflection before the case had even opened. The mask is looking
         at someone in the room, not at a point on its own surface. */
      const x = (e.clientX / window.innerWidth) * 2 - 1;
      const y = (e.clientY / window.innerHeight) * 2 - 1;
      state.targetYaw = Math.tanh(x * 1.15) * YAW;
      state.targetPitch = -Math.tanh(y * 1.15) * PITCH;
    };
    window.addEventListener("pointermove", onPointer, { passive: true });

    /* --------------------------------------------------------- frames -- */
    const io = new IntersectionObserver(
      (entries) => {
        state.visible = entries.some((e) => e.isIntersecting);
      },
      { threshold: 0.01 },
    );
    io.observe(canvas);

    let last = performance.now();
    let lastW = 0;
    let lastH = 0;
    const frame = (now: number) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - last) / 1000, 1 / 20);
      last = now;
      if (!state.visible || document.visibilityState !== "visible") return;

      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const dpr = Math.min(window.devicePixelRatio || 1, view.mobile ? 2 : 1.75);
      const w = Math.round(rect.width * dpr);
      const h = Math.round(rect.height * dpr);
      if (w !== lastW || h !== lastH) {
        canvas.width = w;
        canvas.height = h;
        lastW = w;
        lastH = h;
      }
      gl.viewport(0, 0, w, h);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      if (!count) return;

      /* Breathing, so it is never perfectly still — and, on a touch screen
         where there is no pointer to follow, the only thing that moves. */
      state.idle += dt;
      const sway = Math.sin(state.idle * 0.42) * 0.05;
      const nod = Math.sin(state.idle * 0.31 + 1.1) * 0.025;

      if (view.reduced) {
        state.yaw = 0.12;
        state.pitch = 0.04;
      } else {
        const k = 1 - Math.exp(-FOLLOW * dt);
        state.yaw += (state.targetYaw + sway - state.yaw) * k;
        state.pitch += (state.targetPitch + nod - state.pitch) * k;
      }
      state.ready = Math.min(1, state.ready + dt * 1.4);
      /* written by the scroll engine on the frame: 0 in the card, 1 once the
         case is the screen */
      const open = Number(canvas.parentElement?.dataset.open ?? 0);
      state.horizon += (open - state.horizon) * Math.min(1, dt * 3);

      /* The mask is framed by height, so a wide frame gives it air at the
         sides rather than cropping its chin. */
      const aspect = w / h;
      const fov = 0.62;
      const fit = Math.max(1, 1.05 / Math.max(aspect, 0.55));
      /* Closed, the piece fills its card; open, it is a small thing in a large
         dark room, which is what the room is for. */
      /* A tall screen has no width to spare, so the piece stays large there;
         a wide one can afford the room around it. */
      const framing = 1.28 + (aspect > 1 ? 0.78 : 0.2) * state.horizon;
      const dist = (halfHeight * framing * fit) / Math.tan(fov / 2);
      const eye = [0, 0.02, dist];

      gl.uniformMatrix4fv(u.proj, false, perspective(fov, aspect, dist * 0.2, dist * 3));
      gl.uniformMatrix4fv(u.view, false, lookAt(eye, [0, 0, 0]));
      /* On a wide screen the piece stands right of centre, which is what
         leaves the lower left of the frame to the type. It only moves once
         there is width to move in: on a phone it stays in the middle. */
      const shiftX = 0;
      /* Down, into the lower half of the sheet: the headline is the top of
         the page. */
      const shiftY = (aspect > 1 ? 0.06 : 0.0) * state.horizon * halfHeight;
      gl.uniformMatrix4fv(
        u.model,
        false,
        modelMatrix(state.yaw, state.pitch, 1, shiftX, shiftY),
      );
      /* Where the piece hangs, in the frame's own coordinates, so the wires
         above it and anything else the room hangs can follow it. */
      const halfWidth = Math.tan(fov / 2) * dist * aspect;
      canvas.parentElement?.style.setProperty(
        "--mask-x",
        `${(50 + (shiftX / halfWidth) * 50).toFixed(2)}%`,
      );
      gl.uniformMatrix3fv(u.normal, false, normalMatrix(state.yaw, state.pitch));
      gl.uniform3f(u.eye, eye[0], eye[1], eye[2]);

      /* One lamp, hung above and a little in front, aimed at the middle of
         the mask. Everything else in the room is off. */
      const lp = [0.28, 2.5, 0.92];
      gl.uniform3f(u.lightPos, lp[0], lp[1], lp[2]);
      const ld = norm([-lp[0], -lp[1], -lp[2]]);
      gl.uniform3f(u.lightDir, ld[0], ld[1], ld[2]);
      gl.uniform1f(u.ready, state.ready);
      /* The band comes up as the case opens: a closed case is a lit object on
         a shelf, an open one is the room it was taken out into. */
      gl.uniform1f(u.horizon, state.horizon);

      gl.bindVertexArray(vao);
      gl.drawElements(gl.TRIANGLES, count, gl.UNSIGNED_SHORT, 0);
      gl.bindVertexArray(null);
    };
    raf = requestAnimationFrame(frame);

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
      io.disconnect();
      near.disconnect();
      window.removeEventListener("pointermove", onPointer);
      for (const b of buffers) gl.deleteBuffer(b);
      gl.deleteVertexArray(vao);
      for (const t of [texColor, texNormal, texRough]) gl.deleteTexture(t);
      gl.deleteProgram(program);
    };
  }, []);

  return <canvas ref={host} aria-hidden className={className} />;
}
