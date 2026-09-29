/**
 * The sheet itself: warm ivory paper with its own tooth.
 *
 * It used to carry a whole minhwa landscape; the comp this stage now follows
 * puts nothing behind the piece but paper, and lets the headline — knocked
 * out of the mask's own texture — carry the colour. A page with one loud
 * thing on it is louder than a page with three.
 */
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
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      <defs>
        {/* the tooth of the paper everything is printed on */}
        <filter id="tal-grain" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" seed="7" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
      </defs>

      <rect width="1600" height="940" fill="#f5f2e6" />
      {/* the sheet is not evenly lit: the lamp that lights the piece reaches
          the paper behind it too */}
      <radialGradient id="tal-paper-light" cx="0.5" cy="0.18" r="0.9">
        <stop offset="0%" stopColor="#fffdf4" />
        <stop offset="60%" stopColor="#f5f2e6" stopOpacity="0" />
      </radialGradient>
      <rect width="1600" height="940" fill="url(#tal-paper-light)" />
      <rect
        width="1600"
        height="940"
        filter="url(#tal-grain)"
        opacity="0.14"
        style={{ mixBlendMode: "multiply" }}
      />
    </svg>
  );
}
