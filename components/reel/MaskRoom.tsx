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

/**
 * One pine, drawn the way the painting draws them: a red trunk with the
 * pale rings down it, limbs that fork, and canopies that are clusters of
 * small dark dabs rather than a single blob.
 */
function Pine({ x, y, s, flip = false }: { x: number; y: number; s: number; flip?: boolean }) {
  const canopies: [number, number, number][] = [
    [-74, 226, 46],
    [82, 138, 42],
    [4, 66, 52],
    [-48, 112, 36],
    [62, 244, 33],
    [-108, 150, 30],
  ];
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -s : s} ${s})`}>
      <path
        d="M0 470 C -14 330 -24 230 -10 108 L 20 108 C 30 230 22 336 14 470 Z"
        fill="#b8563a"
        stroke="#241410"
        strokeWidth="4"
      />
      {/* the rings the painting marks its trunks with */}
      <g fill="none" stroke="#f0e7dc" strokeWidth="2.4">
        {[150, 214, 278, 342, 406].map((ty) => (
          <ellipse key={ty} cx="4" cy={ty} rx="5" ry="3.4" />
        ))}
      </g>
      <path d="M4 360 C -30 330 -52 292 -64 254" fill="none" stroke="#b8563a" strokeWidth="11" strokeLinecap="round" />
      <path d="M9 254 C 40 232 60 202 74 164" fill="none" stroke="#b8563a" strokeWidth="11" strokeLinecap="round" />
      <path d="M2 300 C -24 286 -44 256 -58 222" fill="none" stroke="#b8563a" strokeWidth="7" strokeLinecap="round" />
      {canopies.map(([cx, cy, r], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r={r} fill="#1b4b2f" stroke="#0c2114" strokeWidth="4" />
          {/* the dabs of needle that give each canopy its texture */}
          {Array.from({ length: 9 }, (_, k) => {
            const a = (k / 9) * Math.PI * 2 + i;
            const rr = r * (0.34 + 0.4 * ((k % 3) / 3));
            /* Rounded, not because two decimals are enough to draw with, but
               because Node and the browser print the tail of a float
               differently and React reads that as a hydration mismatch. */
            return (
              <circle
                key={k}
                cx={(cx + Math.cos(a) * rr).toFixed(2)}
                cy={(cy + Math.sin(a) * rr).toFixed(2)}
                r={(r * 0.2).toFixed(2)}
                fill="#2f7145"
              />
            );
          })}
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
        {/* The contour lines that fill every peak in the painting: nested
            chevrons running down each face, tightening toward the ridge. */}
        <g stroke="#0e3b6b" strokeWidth="2.2" fill="none" opacity="0.65">
          {[130, 268, 400].map((px) =>
            Array.from({ length: 6 }, (_, k) => {
              const drop = 18 + k * 20;
              return (
                <path
                  key={`${px}-${k}`}
                  d={`M${px - 34 - k * 9} ${560 + drop} Q${px} ${508 + drop} ${px + 34 + k * 9} ${560 + drop}`}
                />
              );
            }),
          )}
        </g>
        <g stroke="#10502f" strokeWidth="2.2" fill="none" opacity="0.6">
          {[120, 250, 380].map((px) =>
            Array.from({ length: 5 }, (_, k) => {
              const drop = 16 + k * 20;
              return (
                <path
                  key={`${px}-${k}`}
                  d={`M${px - 30 - k * 8} ${664 + drop} Q${px} ${618 + drop} ${px + 30 + k * 8} ${664 + drop}`}
                />
              );
            }),
          )}
        </g>
        {/* the fall and its foam */}
        <path d="M196 548 L216 548 L220 700 L192 700 Z" fill="#f4f1e8" stroke="#14304f" strokeWidth="4" />
        <path d="M204 552 L209 552 L211 696 L202 696 Z" fill="#3d86c4" opacity="0.8" />
        <ellipse cx="206" cy="704" rx="34" ry="13" fill="#f4f1e8" stroke="#14304f" strokeWidth="3" />
        {/* The wave field: scallops in rows, each row offset, with the little
            curls of foam the painting scatters between them. */}
        <rect x="-20" y="700" width="580" height="240" fill="#8d6a3f" />
        <g stroke="#2a1a0e" strokeWidth="3" fill="none">
          {[714, 748, 782, 816, 850, 884].map((wy, row) => (
            <path
              key={wy}
              d={`M${-40 - (row % 2) * 24} ${wy} ${"q28 -20 56 0 q28 20 56 0 ".repeat(6)}`}
            />
          ))}
        </g>
        <g fill="#f4f1e8" stroke="#2a1a0e" strokeWidth="2">
          {[
            [64, 742],
            [246, 776],
            [142, 826],
            [356, 812],
            [430, 866],
            [26, 878],
          ].map(([fx, fy]) => (
            <path
              key={`${fx}-${fy}`}
              d={`M${fx} ${fy} q-9 -12 2 -18 q10 -6 15 4 q9 -7 14 3 q5 11 -7 14 z`}
            />
          ))}
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
      /* The engine writes this element's opacity every frame, from outside
         React — including in the window between the server's HTML and
         hydration, which React would otherwise report as a mismatch. */
      suppressHydrationWarning
      viewBox="0 0 1600 940"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
    >
      <defs>
        {/* the ragged edge each fragment is torn along */}
        <clipPath id="tal-tear">
          <path d="M-40 150 L468 150 Q486 238 460 318 Q500 398 468 470 Q506 556 464 638 Q498 718 462 940 L-40 940 Z" />
        </clipPath>
        {/* the tooth of the paper everything is printed on */}
        <filter id="tal-grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" seed="7" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
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

      {/* the grain, over everything: it is one sheet, printed once */}
      <rect
        width="1600"
        height="940"
        filter="url(#tal-grain)"
        opacity="0.16"
        style={{ mixBlendMode: "multiply" }}
      />
    </svg>
  );
}
