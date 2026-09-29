/**
 * The room behind the mask.
 *
 * Drawn rather than photographed, and built from the flat vocabulary of a
 * minhwa folk painting: a cobalt field, a white moon and a red sun, ridges of
 * mountains stacked in layers, and a band of waves along the floor. Every
 * value is held far down — this is the wall of a dark room, not a picture on
 * it, and the only thing that should read as lit is the piece in front of it.
 *
 * `slice` on the viewBox, so the composition crops rather than stretches as
 * the case opens from a card to the whole screen.
 */
export default function MaskRoom() {
  return (
    <svg
      data-engine="reel-room"
      className="engine-driven pointer-events-none absolute inset-0 h-full w-full opacity-0"
      viewBox="0 0 1600 900"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="tal-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#010206" />
          <stop offset="42%" stopColor="#040a1e" />
          <stop offset="72%" stopColor="#071640" />
          <stop offset="100%" stopColor="#040c22" />
        </linearGradient>
        {/* the ridges go bluer and lighter as they come forward, which is how
            a painted range reads depth without any perspective at all */}
        <linearGradient id="tal-far" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#081c3c" />
          <stop offset="100%" stopColor="#040e22" />
        </linearGradient>
        <linearGradient id="tal-mid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#0a2942" />
          <stop offset="100%" stopColor="#04121d" />
        </linearGradient>
        <linearGradient id="tal-near" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#06201f" />
          <stop offset="100%" stopColor="#020a0c" />
        </linearGradient>
        <radialGradient id="tal-halo">
          <stop offset="60%" stopColor="#ff4d1c" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#ff4d1c" stopOpacity="0" />
        </radialGradient>
      </defs>

      <rect width="1600" height="900" fill="url(#tal-sky)" />

      {/* The pair that hangs over every one of these paintings: the moon on
          one side, the sun on the other, both up at once. Flat discs with a
          hard edge — the painting has no falloff, and neither do these. */}
      <circle cx="252" cy="206" r="44" fill="#eef3fb" opacity="0.82" />
      <circle cx="1352" cy="182" r="112" fill="url(#tal-halo)" />
      <circle cx="1352" cy="182" r="46" fill="#ff3a14" opacity="0.78" />

      {/* three ranges, the far one nearly the colour of the sky */}
      <path
        fill="url(#tal-far)"
        stroke="#13396b"
        strokeWidth="2"
        strokeOpacity="0.55"
        d="M-40 640 L150 392 L268 512 L420 300 L560 520 L700 360 L860 560 L1010 330 L1160 540 L1300 392 L1450 560 L1640 430 L1640 900 L-40 900 Z"
      />
      <path
        fill="url(#tal-mid)"
        stroke="#1b5772"
        strokeWidth="2.5"
        strokeOpacity="0.5"
        d="M-40 720 L120 560 L250 660 L430 470 L600 660 L760 520 L900 690 L1080 500 L1240 680 L1420 560 L1640 700 L1640 900 L-40 900 Z"
      />
      <path
        fill="url(#tal-near)"
        stroke="#1d4f4a"
        strokeWidth="3"
        strokeOpacity="0.45"
        d="M-40 806 L170 690 L360 790 L540 660 L720 800 L900 690 L1090 800 L1290 700 L1470 806 L1640 740 L1640 900 L-40 900 Z"
      />

      {/* the water: rows of the same arc, offset, the way it is painted */}
      <g stroke="#15505c" strokeWidth="3" fill="none" opacity="0.5">
        <path d="M-40 852 q40 -26 80 0 q40 26 80 0 q40 -26 80 0 q40 26 80 0 q40 -26 80 0 q40 26 80 0 q40 -26 80 0 q40 26 80 0 q40 -26 80 0 q40 26 80 0 q40 -26 80 0 q40 26 80 0 q40 -26 80 0 q40 26 80 0 q40 -26 80 0 q40 26 80 0 q40 -26 80 0 q40 26 80 0 q40 -26 80 0 q40 26 80 0 q40 -26 80 0" />
        <path d="M-80 886 q40 -26 80 0 q40 26 80 0 q40 -26 80 0 q40 26 80 0 q40 -26 80 0 q40 26 80 0 q40 -26 80 0 q40 26 80 0 q40 -26 80 0 q40 26 80 0 q40 -26 80 0 q40 26 80 0 q40 -26 80 0 q40 26 80 0 q40 -26 80 0 q40 26 80 0 q40 -26 80 0 q40 26 80 0 q40 -26 80 0 q40 26 80 0 q40 -26 80 0" />
      </g>
    </svg>
  );
}
