/**
 * The wall behind the mask: a minhwa landscape, drawn flat and outlined the
 * way the painting is — cobalt sky, a white moon and a red sun up at once,
 * ranges of blue-green peaks, two waterfalls, a field of waves, and red pines
 * holding the edges of the frame.
 *
 * Every shape is a flat fill with a dark outline: no gradients inside the
 * forms, no shading, no perspective. Depth is stacking order and nothing
 * else, which is how the painting does it.
 *
 * `slice` on the viewBox, anchored to the bottom: the composition crops
 * rather than stretches as the case opens, and a tall screen takes its crop
 * out of the sky rather than off the mountains.
 */

/** one pine: a red trunk, a few limbs, and a stack of dark canopies */
function Pine({ x, s, flip = false }: { x: number; s: number; flip?: boolean }) {
  return (
    <g transform={`translate(${x} 250) scale(${flip ? -s : s} ${s})`}>
      <path
        d="M0 620 C -18 430 -30 300 -14 140 L 26 140 C 40 300 30 440 18 620 Z"
        fill="#b83a1e"
        stroke="#160c08"
        strokeWidth="5"
      />
      <path d="M6 470 C -40 430 -70 380 -86 330" fill="none" stroke="#b83a1e" strokeWidth="14" strokeLinecap="round" />
      <path d="M12 330 C 52 300 78 262 96 214" fill="none" stroke="#b83a1e" strokeWidth="14" strokeLinecap="round" />
      {[
        [-96, 300, 62],
        [104, 186, 58],
        [6, 92, 72],
        [-64, 150, 50],
        [78, 322, 46],
      ].map(([cx, cy, r], i) => (
        <g key={i}>
          <circle cx={cx} cy={cy} r={r} fill="#123b22" stroke="#0a1c10" strokeWidth="5" />
          <circle cx={cx - r * 0.3} cy={cy - r * 0.2} r={r * 0.42} fill="#1d5c31" opacity="0.9" />
        </g>
      ))}
    </g>
  );
}

/**
 * One range: `count` peaks across the frame, each a little different, with
 * the contour lines the painting fills its peaks with. Generated rather than
 * hand-plotted, because the painting's ridges are many and small and a hand
 * set of twenty vertices reads as a zigzag.
 */
function range(baseY: number, peak: number, count: number, seed: number) {
  const step = 1680 / count;
  const h = (i: number) => peak * (0.62 + 0.38 * Math.abs(Math.sin(i * 1.7 + seed)));
  let d = `M-40 ${baseY + peak}`;
  const lines: string[] = [];
  for (let i = 0; i <= count; i++) {
    const x = -40 + i * step;
    const top = baseY - h(i);
    /* Each peak is two curves meeting at a rounded summit: the painting's
       mountains are drawn with a brush, not a ruler. */
    d += ` Q${(x - step * 0.34).toFixed(0)} ${(top + peak * 0.34).toFixed(0)} ${x.toFixed(0)} ${top.toFixed(0)}`;
    d += ` Q${(x + step * 0.34).toFixed(0)} ${(top + peak * 0.34).toFixed(0)} ${(x + step * 0.5).toFixed(0)} ${(baseY + peak * 0.3).toFixed(0)}`;
    // two contour lines running down each face, as they are painted
    lines.push(
      `M${x.toFixed(0)} ${(top + peak * 0.2).toFixed(0)} Q${(x - step * 0.26).toFixed(0)} ${(top + peak * 0.55).toFixed(0)} ${(x - step * 0.34).toFixed(0)} ${(baseY + peak * 0.16).toFixed(0)}`,
      `M${x.toFixed(0)} ${(top + peak * 0.2).toFixed(0)} Q${(x + step * 0.26).toFixed(0)} ${(top + peak * 0.55).toFixed(0)} ${(x + step * 0.34).toFixed(0)} ${(baseY + peak * 0.16).toFixed(0)}`,
      `M${x.toFixed(0)} ${(top + peak * 0.52).toFixed(0)} Q${(x - step * 0.16).toFixed(0)} ${(top + peak * 0.8).toFixed(0)} ${(x - step * 0.2).toFixed(0)} ${(baseY + peak * 0.22).toFixed(0)}`,
    );
  }
  d += ` L1640 ${baseY + peak} L1640 900 L-40 900 Z`;
  return { d, lines: lines.join(" ") };
}

const FAR = range(560, 150, 13, 0.4);
const NEAR = range(676, 122, 9, 2.1);

export default function MaskRoom() {
  return (
    <svg
      data-engine="reel-room"
      className="engine-driven pointer-events-none absolute inset-0 h-full w-full opacity-0"
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="tal-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a1470" />
          <stop offset="55%" stopColor="#1226a8" />
          <stop offset="100%" stopColor="#1a33c0" />
        </linearGradient>
      </defs>

      <rect width="1600" height="900" fill="url(#tal-sky)" />

      {/* both up at once, flat and hard-edged, as they are painted */}
      <circle cx="268" cy="196" r="40" fill="#f4f6ff" />
      <circle cx="1336" cy="178" r="38" fill="#e02216" />

      <g stroke="#08122e" strokeWidth="4" strokeLinejoin="round">
        {/* the far range, a single blue mass */}
        <path fill="#1b5fa8" d={FAR.d} />
        {/* the near range in green, the way the painting graduates */}
        <path fill="#1f7a45" d={NEAR.d} />
      </g>

      {/* the lines inside each peak — the painting's whole texture */}
      <path d={FAR.lines} stroke="#0d2b5e" strokeWidth="2.5" fill="none" opacity="0.7" />
      <path d={NEAR.lines} stroke="#0f5a34" strokeWidth="2.5" fill="none" opacity="0.65" />

      {/* two waterfalls, white with a blue seam */}
      <g>
        <path d="M424 600 L446 600 L450 756 L420 756 Z" fill="#f2f6ff" stroke="#08122e" strokeWidth="4" />
        <path d="M432 604 L438 604 L440 752 L430 752 Z" fill="#2f74c8" opacity="0.8" />
        <path d="M980 612 L1002 612 L1006 760 L976 760 Z" fill="#f2f6ff" stroke="#08122e" strokeWidth="4" />
        <path d="M988 616 L994 616 L996 756 L986 756 Z" fill="#2f74c8" opacity="0.8" />
      </g>

      {/* the field of waves the painting stands its mountains in */}
      <g>
        <rect x="-40" y="752" width="1680" height="200" fill="#8a5a2f" />
        <g stroke="#1a0f08" strokeWidth="4" fill="none">
          <path d="M-40 780 q46 -34 92 0 q46 34 92 0 q46 -34 92 0 q46 34 92 0 q46 -34 92 0 q46 34 92 0 q46 -34 92 0 q46 34 92 0 q46 -34 92 0 q46 34 92 0 q46 -34 92 0 q46 34 92 0 q46 -34 92 0 q46 34 92 0 q46 -34 92 0 q46 34 92 0 q46 -34 92 0 q46 34 92 0" />
          <path d="M-86 834 q46 -34 92 0 q46 34 92 0 q46 -34 92 0 q46 34 92 0 q46 -34 92 0 q46 34 92 0 q46 -34 92 0 q46 34 92 0 q46 -34 92 0 q46 34 92 0 q46 -34 92 0 q46 34 92 0 q46 -34 92 0 q46 34 92 0 q46 -34 92 0 q46 34 92 0 q46 -34 92 0 q46 34 92 0" />
          <path d="M-40 888 q46 -34 92 0 q46 34 92 0 q46 -34 92 0 q46 34 92 0 q46 -34 92 0 q46 34 92 0 q46 -34 92 0 q46 34 92 0 q46 -34 92 0 q46 34 92 0 q46 -34 92 0 q46 34 92 0 q46 -34 92 0 q46 34 92 0 q46 -34 92 0 q46 34 92 0 q46 -34 92 0 q46 34 92 0" />
        </g>
        {/* foam where the falls land */}
        <g fill="#f2f6ff" stroke="#08122e" strokeWidth="3">
          <ellipse cx="435" cy="762" rx="42" ry="15" />
          <ellipse cx="991" cy="766" rx="42" ry="15" />
        </g>
      </g>

      <Pine x={84} s={0.62} />
      <Pine x={1524} s={0.66} flip />
    </svg>
  );
}
