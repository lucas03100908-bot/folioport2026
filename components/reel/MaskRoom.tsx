/**
 * The sheet the mask is printed on.
 *
 * A collage, pasted up in the order a collage is: cream paper, a fan of flat
 * rays opening from behind the piece, and a minhwa landscape torn into two
 * pieces and set down the left and right edges — pines, peaks, a waterfall
 * and a field of waves — with the moon over one and the sun over the other.
 *
 * Everything is flat fill and outline. The only gradients are the two
 * spheres, which are balls rather than discs.
 *
 * `slice` on the viewBox, anchored low: a tall screen takes its crop out of
 * the paper above the collage rather than off the landscape.
 */

const RAY_COLOURS = ["#b7cede", "#9db79b", "#e4d5a6", "#f3eee2", "#c9d8e4", "#aebfa4"];

/** the fan behind the piece: flat wedges radiating from where it stands */
function rays() {
  const out = [];
  const count = 26;
  const span = ((Math.PI * 2) / count) * 0.62;
  for (let i = 0; i < count; i++) {
    const a0 = (i / count) * Math.PI * 2;
    const a1 = a0 + span;
    const r = 1400;
    const x0 = 800 + Math.cos(a0) * r;
    const y0 = 470 + Math.sin(a0) * r;
    const x1 = 800 + Math.cos(a1) * r;
    const y1 = 470 + Math.sin(a1) * r;
    out.push(
      <path
        key={i}
        d={`M800 470 L${x0.toFixed(0)} ${y0.toFixed(0)} L${x1.toFixed(0)} ${y1.toFixed(0)} Z`}
        fill={RAY_COLOURS[i % RAY_COLOURS.length]}
        opacity={i % 2 ? 0.7 : 0.9}
      />,
    );
  }
  return out;
}

/** one pine: a red trunk, a few limbs, and a stack of dark canopies */
function Pine({ x, y, s, flip = false }: { x: number; y: number; s: number; flip?: boolean }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      <path
        d="M0 470 C -14 330 -24 230 -10 108 L 20 108 C 30 230 22 336 14 470 Z"
        fill="#b8563a"
        stroke="#241410"
        strokeWidth="4"
      />
      <path d="M4 360 C -30 330 -52 292 -64 254" fill="none" stroke="#b8563a" strokeWidth="11" strokeLinecap="round" />
      <path d="M9 254 C 40 232 60 202 74 164" fill="none" stroke="#b8563a" strokeWidth="11" strokeLinecap="round" />
      {[
        [-72, 230, 48],
        [80, 142, 44],
        [4, 70, 55],
        [-48, 115, 38],
        [60, 247, 35],
      ].map(([cx, cy, r], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r={r} fill="#1f5133" stroke="#10281a" strokeWidth="4" />
          <circle cx={cx - r * 0.28} cy={cy - r * 0.22} r={r * 0.4} fill="#2f7145" />
        </g>
      ))}
    </g>
  );
}

/** one torn-out piece of the painting: peaks, a fall, and the wave field */
function Fragment({ flip = false }: { flip?: boolean }) {
  return (
    <g transform={flip ? "translate(1600 0) scale(-1 1)" : undefined}>
      <g clipPath="url(#tal-tear)">
        {/* peaks */}
        <g stroke="#14304f" strokeWidth="4" strokeLinejoin="round">
          <path
            fill="#2d6fa8"
            d="M-20 560 Q60 430 130 520 Q200 410 268 520 Q330 430 400 530 Q470 450 540 540 L540 900 L-20 900 Z"
          />
          <path
            fill="#2f7a4a"
            d="M-20 648 Q50 566 120 626 Q190 546 250 636 Q310 566 380 646 Q450 586 540 656 L540 900 L-20 900 Z"
          />
        </g>
        <g stroke="#123f6b" strokeWidth="2.5" fill="none" opacity="0.55">
          <path d="M130 528 Q100 570 92 616 M130 528 Q160 570 170 616 M268 528 Q240 572 232 620 M268 528 Q296 572 306 620" />
        </g>
        {/* the fall and its foam */}
        <path d="M196 548 L216 548 L220 700 L192 700 Z" fill="#f4f1e8" stroke="#14304f" strokeWidth="4" />
        <path d="M204 552 L209 552 L211 696 L202 696 Z" fill="#3d86c4" opacity="0.8" />
        <ellipse cx="206" cy="704" rx="34" ry="13" fill="#f4f1e8" stroke="#14304f" strokeWidth="3" />
        {/* the wave field it all stands in */}
        <rect x="-20" y="700" width="580" height="220" fill="#8d6a3f" />
        <g stroke="#2a1a0e" strokeWidth="3.5" fill="none">
          <path d="M-20 726 q34 -24 68 0 q34 24 68 0 q34 -24 68 0 q34 24 68 0 q34 -24 68 0 q34 24 68 0 q34 -24 68 0 q34 24 68 0" />
          <path d="M-54 768 q34 -24 68 0 q34 24 68 0 q34 -24 68 0 q34 24 68 0 q34 -24 68 0 q34 24 68 0 q34 -24 68 0 q34 24 68 0" />
          <path d="M-20 810 q34 -24 68 0 q34 24 68 0 q34 -24 68 0 q34 24 68 0 q34 -24 68 0 q34 24 68 0 q34 -24 68 0 q34 24 68 0" />
        </g>
        <Pine x={104} y={286} s={0.86} />
        <Pine x={368} y={330} s={0.68} flip />
      </g>
      {/* the paper's own edge, left white where it was torn */}
      <path
        d="M-40 150 L468 150 Q486 238 460 318 Q500 398 468 470 Q506 556 464 638 Q498 718 462 940"
        fill="none"
        stroke="#f6f2e8"
        strokeWidth="14"
        strokeLinejoin="round"
        opacity="0.95"
      />
    </g>
  );
}

export default function MaskRoom() {
  return (
    <svg
      data-engine="reel-room"
      className="engine-driven pointer-events-none absolute inset-0 h-full w-full opacity-0"
      viewBox="0 0 1600 940"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
    >
      <defs>
        {/* the ragged edge each fragment is torn along */}
        <clipPath id="tal-tear">
          <path d="M-40 150 L468 150 Q486 238 460 318 Q500 398 468 470 Q506 556 464 638 Q498 718 462 940 L-40 940 Z" />
        </clipPath>
        <radialGradient id="tal-moon-ball" cx="0.36" cy="0.32">
          <stop offset="0%" stopColor="#f7f5ef" />
          <stop offset="62%" stopColor="#d7d3ca" />
          <stop offset="100%" stopColor="#9b9890" />
        </radialGradient>
        <radialGradient id="tal-sun-ball" cx="0.34" cy="0.3">
          <stop offset="0%" stopColor="#e8705f" />
          <stop offset="58%" stopColor="#cf4234" />
          <stop offset="100%" stopColor="#8e2318" />
        </radialGradient>
      </defs>

      <rect width="1600" height="940" fill="#f1ece1" />

      {/* the fan, turning slowly enough that you only notice it later */}
      <g data-engine="reel-rays" className="tal-rays" opacity="0.9">
        {rays()}
      </g>

      <Fragment />
      <Fragment flip />

      {/* a ball each, lit from the upper left, as the comp has them */}
      <circle cx="322" cy="322" r="60" fill="url(#tal-moon-ball)" />
      <circle cx="1288" cy="276" r="64" fill="url(#tal-sun-ball)" />
    </svg>
  );
}
