"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * A tank of liquid standing in a white gallery, simulated rather than animated.
 *
 * Three state variables drive it, and they behave like a fluid:
 *
 *   slosh  turbulence, gained from how fast the pointer sweeps the face and
 *          bled off exponentially
 *   tilt   the surface tips toward the pointer, chased with a first-order lag
 *   gulp   a press discharges the tank; the level drops and refills
 *
 * All three decay with `exp(-k · dt)`, so the feel is frame-rate independent.
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
 * A room, not a picture of one; water, not a coloured sheet.
 *
 * The camera sits inside a white box and looks at the back wall — that is where
 * the one-point perspective comes from. Every surface is a ray/plane
 * intersection against the six sides, so the space costs a handful of divides.
 * The coffered skylight is procedural and is the only light in here: the walls
 * are bright beneath it and fall off toward the floor, which is what makes the
 * ceiling belong to the room instead of sitting on top of it.
 *
 * The liquid is a height field, and it is *marched*, not solved — so it has
 * real relief and a real silhouette against the far wall. It is shaded the way
 * water is shaded and not the way a colour is: Fresnel decides how much of the
 * room it mirrors, Beer-Lambert decides what colour survives the trip down to
 * the floor and back, and the skylight's own reflection lands on the crests as
 * a hard specular glint. That glint is the difference between liquid and paint.
 */
const vec3 HALF = vec3(1.30, 0.75, 1.70);
const vec3 CEN  = vec3(0.0, 0.0, -0.60);
const float FLOORY = -0.75;

float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453123);}
/* Quintic, not cubic.
   Smoothstep interpolation leaves the second derivative discontinuous at every
   cell boundary. Nothing shows while the noise is only being summed — but the
   caustic ridge takes a derivative of it, and those creases came back as faint
   oval and polygon outlines drawn across the water, which is the one shape a
   fluid must never have. f*f*f*(f*(6f-15)+10) is flat to the second order at
   both ends, and the grid goes away. */
float noise(vec2 p){
  vec2 i=floor(p), f=fract(p);
  vec2 u=f*f*f*(f*(f*6.0-15.0)+10.0);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),u.x),
             mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),u.x),u.y);
}
float fbm(vec2 p){
  float v=0.0, a=0.5;
  for(int i=0;i<3;i++){ v+=a*noise(p); p=p*2.07+vec2(11.3,7.1); a*=0.5; }
  return v;
}

/* Where a ray that starts inside the box leaves it, and by which face. The
   normal points back into the room. */
float boxExit(vec3 ro, vec3 rd, out vec3 n){
  vec3 inv = 1.0 / rd;
  vec3 tf = max((CEN - HALF - ro) * inv, (CEN + HALF - ro) * inv);
  float t = min(min(tf.x, tf.y), tf.z);
  if (t == tf.x) n = vec3(-sign(rd.x), 0.0, 0.0);
  else if (t == tf.y) n = vec3(0.0, -sign(rd.y), 0.0);
  else n = vec3(0.0, 0.0, -sign(rd.z));
  return t;
}

/* Corners lose light. The face being shaded is excluded from its own occlusion:
   the distance to the nearest wall from a point that is *on* a wall is zero,
   which shades every wall as though it were jammed into a corner — that alone
   once rendered a white gallery near-black. */
float ao(vec3 p, vec3 n){
  vec3 d = HALF - abs(p - CEN) + abs(n) * 10.0;
  /* The ceiling is the light, so nothing darkens as it approaches it. Left in,
     it put the wall's darkest point directly beneath the brightest thing in
     the room and the wall came out brightest across its middle — the opposite
     of the reference, where the light washes down from the top. */
  if (p.y > CEN.y) d.y = 10.0;
  /* Neither are the vertical corners.
     A soft 6% band at each back corner was the last thing on these walls that
     read as a mark rather than as a room: a corner drawn as a blur instead of
     as a corner. The junction already carries itself — a side wall and the
     back wall are at different depths, so at a given height they meet at a
     crisp step of a few percent, and a step is what an eye reads as an edge.
     Measured either side of the seam: 0.749 against 0.714. */
  d.x = 10.0;
  d.z = 10.0;
  return 0.94 + 0.06 * smoothstep(0.0, 0.24, min(min(d.x, d.y), d.z));
}


/* The coffered skylight: a rectangle of lit panels divided by slim beams, with
   plain ceiling around it. Returns how much of the ceiling this point is, and
   writes how much of it is beam. */
float skylight(vec2 p, out float beam){
  vec2 g = abs(fract((p - vec2(0.0, CEN.z)) / 0.52) - 0.5) * 0.52;
  beam = 1.0 - smoothstep(0.030, 0.072, min(g.x, g.y));
  return (1.0 - smoothstep(0.72, 0.82, abs(p.x)))
       * (1.0 - smoothstep(1.16, 1.28, abs(p.y - CEN.z)));
}

vec3 room(vec3 p, vec3 n){
  float a = ao(p, n);
  float h = (p.y - FLOORY) / (2.0 * HALF.y);   // 0 at the floor, 1 at the ceiling

  if (n.y < -0.5){
    /* The ceiling is the light. Its panels are meant to be blown out — that is
       what a lit panel looks like — and the room can carry it now because the
       walls are brightest directly beneath it and darken on the way down. */
    /* The panels are the brightest thing in the frame, but the plaster around
       them is not dark. Dimming it by depth alone left a grey band between a
       blown-white coffer and a 0.78 wall — a stripe across the top of the card
       where the reference has a halo. So the plaster brightens toward the
       coffer instead, using the same edge the coffer fades on: one continuous
       run from beam to panel to cove to wall, with no step anywhere in it. */
    float beam;
    float lit = skylight(p.xz, beam);
    float away = clamp((p.z - (CEN.z - HALF.z)) / (2.0 * HALF.z), 0.0, 1.0);
    /* 3.4, not 1.15 — and the shoulder is what makes that possible.
       A lit panel really is several times the radiance of the wall it lights,
       and that ratio is the entire reason water reads as water: a mirror in a
       box where everything is the same brightness reflects nothing you can
       see. Held near 1.15 the room was evenly lit, the pool mirrored an even
       field, and no amount of Fresnel could put a highlight on it. Seen
       directly the panel still rolls off to white; seen in the water it is a
       bright band against the dimmer walls, which is the streak. */
    float panel = mix(3.4, 0.66, beam);
    float plain = 0.84 + 0.20 * lit;
    return vec3(1.0, 0.997, 0.99) * mix(plain, panel, lit)
         * mix(0.90, 1.04, away) * mix(1.0, a, 0.4);
  }
  if (n.y > 0.5){
    // the floor takes the pool of light the skylight throws
    float pool = 1.0 - smoothstep(0.0, 2.0, length(vec2(p.x, (p.z - CEN.z) * 0.72)));
    return vec3(1.0, 0.998, 0.993) * (0.68 + 0.24 * pool) * a;
  }
  /* Walls. One gradient, one cove of spill under the skylight, nothing else —
     no grain, no dither, no noise anywhere in this room.

     The gradient is steep and the cove is strong, and both are there for the
     water as much as for the wall. The camera sits low, so the pool mirrors
     this wall rather than the ceiling; when the wall was one flat value the
     reflection was one flat value too, and no amount of Fresnel could put a
     highlight on a mirror of a blank field. Now a facet tilting a few degrees
     swings its reflection between a dim lower wall and a blazing cove, which
     is what breaks the surface into streaks. */
  /* Which way a wall faces, not just how high it is.
     Shading these purely by height meant a side wall and the back wall came
     out identical wherever they met, and once the corner blur was taken off
     the room measured flat right across — 0.780 from edge to edge at mid
     height, with no edge anywhere in it. A box whose corners return the same
     number is not a box, and that is the thing still reading as a backdrop.
     The back wall looks down the long axis of the coffer and the side walls
     across its short one, so they do not receive the same light; the step at
     the junction is what makes the room close around the water. */
  float facing = abs(n.z) > 0.5 ? 1.0 : 0.87;
  /* and a wall runs away from you. Without this the side walls came out as
     two flat panels — 0.678 from the corner all the way to the frame edge —
     which is the other half of a room not reading as one. The same figure the
     ceiling already uses, so the two recede together. */
  float recede = mix(0.90, 1.04, clamp((p.z - (CEN.z - HALF.z)) / (2.0 * HALF.z), 0.0, 1.0));
  float lit = facing * recede;

  float fall = mix(0.48, 0.88, smoothstep(0.0, 0.96, h)) * lit;
  float cove = 0.80 * smoothstep(0.74, 1.0, h) * lit;
  /* No panel joints. They were the last patterned thing in the room, and near
     the back corners perspective packed them together into two grey vertical
     smudges that read as dirt on the wall. Nothing here is patterned now:
     light falling, and the corner closing. */
  return vec3(1.0, 0.998, 0.99) * (fall + cove) * a;
}

/* ------------------------------------------------------------- the water -- */

/* Amplitude, so the march can bound the surface inside a thin slab and spend
   all its steps where the water actually is. */
float amplitude(){ return 0.070 + u_slosh * 0.034; }
float slabAmp(){ return amplitude() * 1.75; }

/* A crest, not a sine.
   Squaring a sine that has been lifted into 0..1 keeps the peak and pushes
   everything else down: narrow pointed crests over broad flat troughs, which
   is the shape a fluid surface takes and a sine never does. Summed sines gave
   a rolling quilt — smooth, symmetric, and the reason the pool read as a
   poured solid rather than as something being thrown around. */
float crest(float x){ float s = sin(x) * 0.5 + 0.5; return s * s; }

/* The bed is not flat, and that is deliberate.
   Optical depth is the only reason one patch of sea is a different colour from
   the next: over a shallow rise the light comes back off the sand and the
   water goes turquoise, and a metre further out it has nothing to come back
   from and goes deep blue-green. With a flat floor every ray travelled the
   same distance and the whole body came back one value — which is most of what
   "matte" was. */
/* Shallow, and that is the point.
   Refraction drags the sampled floor sideways by roughly the water's depth —
   at half a unit deep and a view this far off vertical that was a third of a
   dune, so the bed came back as warped cloth rather than as a floor, and no
   amount of transparency was going to make it read. Brought up to a fifth of
   a unit the offset halves, the sand holds its shape, and the caustics sharpen
   the way caustics only ever do in shallow water. The trough of the deepest
   wave still clears it by 0.06. */
float bedY(vec2 q){
  return FLOORY + 0.16
                + 0.090 * noise(q * 0.85 + vec2(3.7, 1.3))
                + 0.030 * noise(q * 2.1 - vec2(1.9, 4.4))
                + 0.016 * noise(q * 6.5 + vec2(2.2, 0.4));   // sand ripples
}

/* The bed has to look like a floor, not like a distance.
   Seeing through water to something is the whole reason water reads as water
   rather than as a coloured fill, and "something" has to have form: dunes that
   catch the light on one side and lose it on the other. This is the bed's own
   slope, lit from overhead — geometry, not a texture laid on it. */
float bedShade(vec2 q){
  float e = 0.05;
  float g = (bedY(q + vec2(e, 0.0)) - bedY(q - vec2(e, 0.0))) * 0.55
          - (bedY(q + vec2(0.0, e)) - bedY(q - vec2(0.0, e))) * 0.90;
  return clamp(0.82 + g * 22.0, 0.50, 1.32);
}

float baseLevel(){ return FLOORY + u_level * (2.0 * HALF.y) * 0.58; }

float height(vec2 q){
  float t = u_time;
  float h = crest(q.x * 2.2 + t * 1.00) * 1.00
          + crest(dot(q, vec2(0.74, -0.67)) * 3.3 - t * 1.40) * 0.60
          + crest(dot(q, vec2(-0.52, 0.85)) * 5.6 + t * 2.05) * 0.32;
  h += (noise(q * 3.0 + vec2(t * 0.20, -t * 0.16)) - 0.5) * 1.15;
  return amplitude() * (h - 0.86);
}

float surfaceY(vec2 q){
  return baseLevel() + u_tilt * q.x * 0.05 + height(q);
}

/* Where this point stands relative to the mean surface: about -1 in a trough,
   about +1 on a crest. Foam and backscatter both key off it. */
float crestHeight(vec2 q){
  return (surfaceY(q) - baseLevel()) / (amplitude() * 1.5);
}

/* The marched surface gives the relief; this gives the material.
   Three octaves of chop, added to the normal and never to the marched height:
   nine noise lookups once per pixel instead of another field evaluation inside
   a twenty-four step loop, and at this scale the eye cannot tell the two apart
   except on the silhouette, which the swells already own.

   This is the piece that was missing. A smooth swell mirrors one patch of wall
   and returns one value, which is why the pool came out an even brown however
   the Fresnel was set. Chop makes neighbouring facets look at very different
   parts of the room — one at the blazing cove, the next at the dim wall by the
   waterline — and it is that variance, not brightness, that reads as liquid. */
vec3 waterNormal(vec2 q, out vec3 calm){
  float e = 0.014;
  float h = surfaceY(q);
  vec3 n = normalize(vec3(h - surfaceY(q + vec2(e, 0.0)), e,
                          h - surfaceY(q + vec2(0.0, e))));
  /* The swells alone, kept aside for refraction.
     Chop this fine belongs on the specular — it is what makes the surface
     sparkle — but running the refracted ray through it scattered the bed's
     image per pixel into noise, so there was never going to be a floor down
     there to see however transparent the water was made. Real ripples do
     wobble the bottom; they wobble it coherently. */
  calm = n;

  /* Chop is not uniform. A surface agitated identically everywhere is the one
     thing real water never is, and evenness at this scale reads as a material
     rather than as a fluid — so a slow, large field decides where it is rough
     and where it is nearly glass, and the two drift past each other. */
  vec2 g = vec2(0.0);
  float agit = 0.45 + 1.05 * noise(q * 0.70 + vec2(u_time * 0.07, -u_time * 0.05));
  /* Three octaves, and they can be this fine because they no longer reach
     the refraction. Water's surface is covered in ripples far smaller than its
     waves — that density is what makes it sparkle and what separates it from
     melted glass — and the only reason it had to be given up was that the same
     normal was scattering the bed. It is not the same normal any more. */
  float amp = (0.075 + u_slosh * 0.055) * agit;
  float f = 2.1;
  for (int i = 0; i < 3; i++){
    float fi = float(i);
    vec2 w = vec2(u_time * (0.30 + 0.13 * fi), -u_time * (0.24 + 0.10 * fi));
    float e2 = 0.09 / f;
    float c = noise(q * f + w);
    g += vec2(c - noise((q + vec2(e2, 0.0)) * f + w),
              c - noise((q + vec2(0.0, e2)) * f + w)) * (amp / e2);
    f *= 2.7;
    amp *= 0.55;
  }
  /* a touch of the chop reaches the refraction, and no more */
  calm = normalize(calm + vec3(g.x, 0.0, g.y) * 0.14);
  return normalize(n + vec3(g.x, 0.0, g.y));
}

/* Caustics, from the surface that actually causes them.
   The previous one lit the level set of an fbm — the set of points where the
   noise crosses a threshold. A level set of a smooth field is a family of
   closed contours, so it drew rings and cells across the water: contour lines,
   not light. It also drifted on its own clock, unrelated to the waves above
   it, which is the tell even when you cannot say what is wrong.

   Light focuses where the surface is curved like a lens, so this reads the
   surface's own Laplacian and looks for where the refracted footprint
   collapses. The bright web that comes out is the wave's, it moves when the
   wave moves, and it goes where the geometry says it goes. */
float caustic(vec2 q, float depth){
  float e = 0.03;
  float h = height(q);
  float lap = (height(q + vec2(e, 0.0)) + height(q - vec2(e, 0.0))
             + height(q + vec2(0.0, e)) + height(q - vec2(0.0, e))
             - 4.0 * h) / (e * e);
  float focus = 1.0 / max(0.16, abs(1.0 + depth * 2.4 * lap));
  return clamp(focus - 1.05, 0.0, 1.6);
}


/* A soft shoulder instead of a hard clip.
   Everything in here is a real quantity of light, and some of it is genuinely
   brighter than the display: a lit ceiling panel, a specular glint on a crest.
   Truncating those at 1.0 turns them into flat white shapes — a 120-row slab
   of #ffffff across the top of the card, and glints with no falloff. This rolls
   them off asymptotically instead, so the brightest things stay the brightest
   and still have structure. */
vec3 shoulder(vec3 c){
  vec3 e = max(c - 0.86, 0.0);
  return min(c, vec3(0.86) + 0.14 * (vec3(1.0) - exp(-e / 0.14)));
}

void main(){
  /* Framed off the card's shorter side, not its height: normalising by height
     alone narrowed the horizontal field of view as the card got narrower, and
     on a phone both side walls fell outside the frame. */
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / min(u_res.x, u_res.y);
  vec3 ro = vec3(0.0, 0.24, 1.15);
  vec3 rd = normalize(vec3(uv, -1.05));

  vec3 nR; float tR = boxExit(ro, rd, nR);
  vec3 pR = ro + rd * tR;
  vec3 col = room(pR, nR);

  /* ----------------------------------------------- find the surface -- */
  float hit = -1.0;
  if (rd.y < -0.0005){
    float amp = slabAmp();
    float base = baseLevel();
    float t0 = max((base + amp - ro.y) / rd.y, 0.0);
    float t1 = min((base - amp - ro.y) / rd.y, tR);
    if (t1 > t0){
      float dt = (t1 - t0) / 24.0;
      float tp = t0;
      float dp = 1.0;
      for (int i = 1; i <= 24; i++){
        float t = t0 + dt * float(i);
        vec3 q = ro + rd * t;
        float d = q.y - surfaceY(q.xz);
        if (d < 0.0 && dp >= 0.0){
          float lo = tp, hi = t;
          for (int j = 0; j < 5; j++){
            float m = (lo + hi) * 0.5;
            vec3 qq = ro + rd * m;
            if (qq.y - surfaceY(qq.xz) < 0.0) hi = m; else lo = m;
          }
          hit = (lo + hi) * 0.5;
          break;
        }
        tp = t; dp = d;
      }
    }
  }

  vec3 pW = ro + rd * max(hit, 0.0);
  bool wet = hit > 0.0 && hit < tR
          && abs(pW.x - CEN.x) < HALF.x && abs(pW.z - CEN.z) < HALF.z;

  if (wet){
    vec3 calm;
    vec3 nrm = waterNormal(pW.xz, calm);
    vec3 v = -rd;

    /* Schlick. This is the whole reason the old one looked matte: it was an
       emissive fill with the mirror capped at a flat 19%, so no part of the
       surface was ever specular. Water is 2% face-on and near-total at a
       graze, and it is that spread — dark and saturated where you look into
       it, bright where you look across it — that reads as a liquid. */
    /* Left almost unclamped. The body underneath is nearly black on purpose —
       what you see on this surface is the room lying across it, which is the
       one thing that cannot be faked into looking wet. Capping this was what
       made the pool a slab of colour with a sheen painted on. */
    float F = clamp(0.04 + 0.96 * pow(1.0 - max(dot(nrm, v), 0.0), 5.0), 0.0, 0.94);

    vec3 rr = reflect(rd, nrm);
    vec3 n2; float t2 = boxExit(pW + nrm * 0.004, rr, n2);
    vec3 pr = pW + rr * t2;
    vec3 refl = room(pr, n2) * 0.95;
    /* A reflected ray that lands below the waterline is looking at water, not
       at dry wall. Faded across a band rather than switched: as a hard test it
       drew a clean diagonal line straight across the pool, exactly where the
       reflections crossed the far waterline. */
    /* A reflected ray landing below the waterline is looking along the water,
       not at dry wall — but along the water is not black. At 0.16 of the tint
       this was dropping near-black streaks across a shallow turquoise pool,
       which is a thing no sunlit water does. */
    refl = mix(refl, u_tint * 0.55 + vec3(0.16),
               smoothstep(0.0, 0.10, surfaceY(pr.xz) - pr.y));

    /* Down through the body to the bed, and what colour survives the trip.
       This is the part that had been a hack. Absorbing against (1 - tint)
       makes water that is merely dark; real water is selective, and the ratio
       is not subtle — it takes red out roughly eight times faster than blue,
       which is the entire reason the sea is the colour it is and not the
       colour of whatever is dissolved in it. EXT is that ratio. Everything
       teal about this now falls out of the physics rather than being painted
       on, which is also why it survives the tint being changed. */
    float steep = clamp((1.0 - nrm.y) * 4.4, 0.0, 1.0);
    float rel = crestHeight(pW.xz);
    vec2 drift = vec2(u_time * 0.26, -u_time * 0.20);

    vec3 rt = refract(rd, calm, 0.752);
    if (rt.y > -0.05) rt = normalize(vec3(rd.x, -0.7, rd.z));
    float travel = (pW.y - bedY(pW.xz)) / max(0.10, -rt.y);
    vec3 fh = pW + rt * travel;
    /* Sand, not plaster.
       This is the cue the whole thing was missing. A white floor seen through
       turquoise water returns turquoise, so there was nothing in the frame to
       say you were looking *through* anything — the bed could be contributing
       most of the pixel, as it was, and still read as more water. Water reads
       as water because what is under it is warm and what is in front of it is
       cool, and the eye separates those instantly. The room's floor keeps its
       own lighting; only the part under the water is sand, and the dry floor
       is never in shot. */
    vec3 bed = vec3(0.97, 0.89, 0.74)
             * room(vec3(clamp(fh.x, CEN.x - HALF.x, CEN.x + HALF.x), FLOORY,
                         clamp(fh.z, CEN.z - HALF.z, CEN.z + HALF.z)),
                    vec3(0.0, 1.0, 0.0));
    /* Lit, then focused. The floor of a lit room is lit — the caustic is the
       extra the surface throws onto it, not a mask over it. Multiplying by a
       term whose base was 0.30 meant the sand spent most of its area at less
       than a third of the light it should have had, and no reduction in
       extinction was ever going to make a floor that dark visible. */
    /* Once the water was shallow enough to see through, the same caustic gain
       blew the sand straight to white and took the floor back out of the
       picture the other way. Light on a floor is brighter than the floor, not
       four times the floor. */
    bed *= bedShade(fh.xz) * (0.95 + caustic(fh.xz, travel) * 0.45);
    /* The ratio is what makes it seawater; the magnitude is only how fast the
       bed disappears, and at full strength it was taking the bed down to
       (0.02, 0.13, 0.15) — so the caustics were being computed in full and
       then absorbed before anything could be seen of them. Six tenths of the
       way keeps the colour and lets the light on the sand back out, which is
       the only place caustics are ever visible anyway: the shallows. */
    /* Shallow water is transparent. That is not a stylistic choice about how
       blue to make it — it is the difference between water and ink. */
    /* Scaled to this tank, not to an ocean.
       At 0.40 the red channel came back at 14% in the shallows, so the sand
       arrived as pure cyan and read as glow rather than as a floor. Sand under
       a metre of water is pale and slightly cyan; it is only under several
       metres that it goes blue. Measured at 0.26: red survives at about half
       over a rise and about a tenth in the deep, which is the gradient that
       makes one body of water look shallow at one end. */
    vec3 EXT = vec3(10.4, 2.48, 1.44) * 0.26;
    vec3 trans = bed * exp(-travel * EXT);

    /* Entrained air.
       A crest that is breaking drags bubbles down with it, and they scatter
       white straight back out of the body before the water has any depth in
       which to absorb it. This is the half of "foam" that is not on the
       surface — it is why water under a breaking wave goes pale and opaque
       rather than staying clear, and it is most of what reads as a simulation
       rather than as a moving texture. */
    float aer = smoothstep(0.12, 0.85, rel)
              * smoothstep(0.38, 0.78, fbm(pW.xz * 5.5 + drift * 1.3));
    trans += (vec3(0.42) + u_tint * 1.05) * aer * 0.45;
    /* and what the body scatters back on its own, which is all you see once
       the bed is too far down to return anything */
    /* Weighted enough that the three disciplines still read apart. Once the
       teal came out of the extinction rather than out of the tint, a light
       weight here made all three cards the same water. */
    trans += u_tint * (1.0 - exp(-travel * 5.0)) * 0.36;

    vec3 water = mix(trans, refl, F);

    /* The ceiling's own highlight, very tight.
       A wide lobe put two blown white ellipses on the near water — a light
       that is not in the room. At 520 only a facet within a couple of degrees
       of level catches it, so with the chop above it comes out as scattered
       crisp sparkles rather than as a blob, which is what the surface of water
       under a big soft light actually does. */
    vec3 L = normalize(vec3(0.0, 1.0, -0.24));
    float nh = max(dot(nrm, normalize(L + v)), 0.0);
    water += vec3(1.0, 0.99, 0.97) * pow(nh, 480.0) * 3.2;
    water += vec3(1.0, 0.99, 0.97) * pow(nh, 60.0) * 0.22;

    /* Light coming up through a crest.
       A wave is thin where it stands up, so the ceiling shines through it and
       the crest glows from inside — the one cue that separates a body of water
       from a sheet of dark glass, and the thing a still image of the sea is
       always full of. */
    water += u_tint * smoothstep(0.05, 0.95, rel) * (1.0 - steep * 0.45) * 0.18;

    /* Whitecaps.
       Foam gathers where the surface is both steep and standing high, and it
       is patchy rather than continuous, so an advected noise decides where it
       actually breaks. This is the loudest thing in the frame on purpose: foam
       is bright, fully diffuse, and sits on near-black water, and that
       contrast is what no amount of gloss on a smooth swell could buy. */
    float foam = smoothstep(-0.05, 0.62, rel) * (0.35 + 0.65 * smoothstep(0.05, 0.42, steep));
    foam *= smoothstep(0.34, 0.66, fbm(pW.xz * 4.2 + drift));
    /* a second, finer band so the foam has its own grain instead of arriving
       as one smooth wash — what breaks it into flecks and streaks */
    foam *= 0.40 + 0.60 * smoothstep(0.25, 0.72, fbm(pW.xz * 11.0 - drift * 1.7));
    /* a third band, finer again. At a gain that saturated it, foam arrived as
       one smooth white blob sitting on the crest — the shape of the region it
       was allowed to cover, not the shape of foam. Broken at three scales it
       comes apart into flecks and holes, which is what breaking water does. */
    foam *= 0.52 + 0.48 * smoothstep(0.30, 0.62, noise(pW.xz * 26.0 + drift * 2.4));
    foam = clamp(foam * 4.4, 0.0, 1.0);
    water = mix(water, vec3(0.95, 0.975, 0.99), foam);

    col = water;

    // the meniscus, climbing the walls — foam against the glass, not tint
    float wall = min(HALF.x - abs(pW.x - CEN.x), HALF.z - abs(pW.z - CEN.z));
    col += (u_tint * 0.5 + vec3(0.42)) * exp(-wall * 22.0) * (0.18 + u_slosh * 0.34);
  } else if (nR.y < 0.5){
    /* The pool has to light the room it is standing in.
       Without this the two never exchange anything: a saturated body of water
       sits in a white box, the box stays exactly as white as it would be if
       the water were not there, and the frame reads as two renders sharing a
       card rather than as one place. A wall this close to that much coloured
       water picks up its colour, and the surface focuses the ceiling into
       bands that crawl up it — which is also what says the water is moving in
       the part of the frame where you cannot see the water. */
    float above = pR.y - surfaceY(pR.xz);
    if (above > 0.0 && above < 0.90){
      /* Kept low and kept short. Reaching three quarters of the way up the
         wall and stretched vertically, this came out as sheets running down
         the plaster — the room read as made of falling water. What a wall
         actually does at this distance is take a little of the colour and a
         little of the movement, in the hand's width above the surface. */
      /* Faded to nothing at the edge of its own window.
         An exponential cut off at a fixed height does not reach zero there —
         it was still worth 1.6% of the wall when the branch stopped paying it,
         and a 1.6% step across a smooth white gradient is a line. Measured at
         row 255, which is 0.44 above the waterline: exactly where the old
         cutoff sat. The window now closes on a smoothstep, so the term is
         genuinely zero by the time the branch ends. */
      float near = exp(-above * 4.2) * (1.0 - smoothstep(0.30, 0.90, above));
      vec2 wc = abs(nR.x) > 0.5 ? vec2(pR.z, pR.y) : vec2(pR.x, pR.y);
      /* A shimmer, not a caustic. The fbm ridge that draws light on the bed
         draws *lines*, and on a wall — compressed by perspective on the two
         sides — the lines came out as sheets of flame climbing the plaster.
         Plain noise instead: the wash moves, and it never resolves into a
         pattern, which is the one thing these walls must not grow. */
      float shimmer = 0.72 + 0.52 * noise(vec2(wc.x * 1.7, wc.y * 1.3)
                                          + vec2(u_time * 0.26, -u_time * 0.19));
      /* and lower at the contact. At full strength the last row of wall
         before the water came back at 0.96 against 0.63 — a bright hairline
         drawn along the waterline, which is the other edge you can see. */
      col += u_tint * near * 0.26 * shimmer;
    }
  }

  /* Sub-quantisation dither, and the distinction matters.
     The grain that was taken out of this room was worth about two and a half
     display levels — visible texture on a wall, and rightly gone. This is one
     level, triangular, which is beneath what a display can resolve as grain
     but is exactly enough to break a contour. Without it the walls quantise
     into bands: measured down the side wall, twenty-three flat runs four to
     eight pixels tall, each ending in a one-level step. A smooth gradient with
     a step in it is a line, and that is the edge that shows. */
  vec3 outc = shoulder(max(col, 0.0));
  outc += (hash(gl_FragCoord.xy) - hash(gl_FragCoord.yx + 17.3)) * (1.0 / 255.0);
  gl_FragColor = vec4(outc, 1.0);
}`;

const BASE = 0.56;

/** open water, used when a caller hands over no tint */
const DEFAULT_TINT: [number, number, number] = [0.05, 0.46, 0.52];

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

    /* A failed compile used to be invisible: WebGL keeps running, the draw call
       is a silent no-op, and the card renders as an empty transparent box that
       looks exactly like a styling mistake. The log is worth having, and so is
       the fallback — a bad shader now leaves a plausible card behind. */
    const fail = () => {
      box.style.background =
        "linear-gradient(to top, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.14) 54%, #0a0a0c 55%)";
      el.style.display = "none";
    };
    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        console.error("liquid-tank shader:", gl.getShaderInfoLog(sh));
        return null;
      }
      return sh;
    };
    const vs = compile(gl.VERTEX_SHADER, VS);
    const fs = compile(gl.FRAGMENT_SHADER, FS);
    if (!vs || !fs) {
      fail();
      return;
    }
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error("liquid-tank link:", gl.getProgramInfoLog(prog));
      fail();
      return;
    }
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

    /* The surface is marched now — 24 samples plus a binary refine per pixel,
       against 1 for the old solved plane, and the normal costs nine more noise
       lookups on top. The room is smooth gradients and the water is
       high-frequency, so neither reads as soft below device resolution; a
       phone is both the slowest GPU and the smallest card, so it renders at
       CSS pixels and spends nothing on a ratio nobody can see there. */
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 900 ? 1 : 1.4);
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
      /* Reduced motion holds a still frame, but the surface still has to *be* a
         surface — a flat plane at t=0 would show none of the relief the rest of
         the shading is built on, so it is frozen mid-swell instead. */
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
        /* The room is a white gallery and the card sets white type at both
           ends of it — the eyebrow against the lit ceiling, the title against
           the pool. Darkening the whole render would just make the room grey,
           so the type gets its own ground and the middle of the room, which
           is the part worth looking at, stays white. */
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(0,0,0,0.60)_0%,rgba(0,0,0,0.14)_20%,transparent_38%,rgba(0,0,0,0.18)_56%,rgba(0,0,0,0.58)_100%)]"
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
