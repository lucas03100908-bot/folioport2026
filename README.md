# MINHO — scroll-driven portfolio

Next.js 15 · React 19 · TypeScript · GSAP (+ ScrollTrigger, Flip) · Lenis · Tailwind v4.
No WebGL. The visual identity is **video controlled by scroll**.

```bash
npm run dev     # http://localhost:3000
npm run build
```

## The four stages

| # | Stage | What carries it |
|---|-------|-----------------|
| 1 | `hero` | full-bleed background film, scrubbed by scroll, with a white "MINHO" over it in `mix-blend-mode: difference` — the footage inverts exactly where the letters overlap it |
| 2 | `work` | selection screen: one deck per discipline. Entering one opens `CategoryView` |
| 3 | `reel` | the reel opens: a card grows to full bleed as you scroll past it |
| 4 | `connect` | marquee field of live social links, with a spider that follows you across it |

## The engine

`lib/state.ts` exports `view` — one **mutable** object (never React state) holding scroll
progress, section index, per-stage reveal, eased pointer and scroll velocity, plus
`clamp / lerp / norm / mapRange / smoothstep / damp` helpers.

`components/ScrollEngine.tsx` renders nothing. Every frame it drives Lenis, updates `view`,
and writes `transform / opacity / filter` **directly** onto any node tagged `data-engine`:

| `data-engine` | driven by |
|---|---|
| `panel` (+ `data-stage`) | that stage's reveal → opacity, rise, blur |
| `deck-card` (+ `data-index`) | position in the deck → transform, opacity, z-order, brightness, pointer-events |
| `deck-counter` | the front card's ordinal |
| `hero-bg` | dolly scale 1.02 → 1.1, brightness falls off as you leave |
| `hero-bg-video` | `currentTime` = hero progress, throttled to ~30fps |
| `hero-title` | scale 1 → 1.06, translateZ, ±3.5° pointer tilt |
| `reel-frame` / `reel-veil` / `reel-glow` | the media's size, radius, veil and glow bed as it opens |
| `reel-title` | "Showreel 2026" dissolving as the film opens |
| `reel-cue-a` / `reel-cue-b` | which of the two cues is legible |
| `connect-field` / `connect-word` | opacity, blur, per-word pulse, pointer-events routing |
| `progress` / `rail-tick` / `cursor` | chrome |

### The reel

Scrolling through the reel's tall well grows the media from a card to full bleed. Over it sits
"Showreel 2026" as a heavy grotesque stamp (weight 900, not the Didone used elsewhere),
blended with `difference` so it inverts over the footage — the same trick as the hero.

The stamp **dissolves** as the film opens — opacity out, a slight swell, no lateral movement.
The reel carries its own on-screen type, and an overlay title sliding around on top of it is
just noise; by the time the film fills the screen the stamp is gone. Expansion completes at
~55% of the well, so the last stretch is spent watching the full-bleed film before the cue
points on.

**No scroll hijacking.** The usual version of this effect calls `preventDefault()` on wheel
and pins the page with `scrollTo(0, 0)` until the media is open. That fights Lenis, kills
keyboard and trackpad momentum, traps screen-reader users, and makes the scrollbar lie. Here
the expansion is a pure function of scroll offset through a tall section — same picture,
nothing stolen.

**Playback stays independent of scroll**: the film runs muted on a loop at
`SHOWREEL_PLAYBACK_RATE` (1.25×), started and stopped by an IntersectionObserver on the stage
and re-synced on `visibilitychange`. Scroll only changes the size of the window onto it.
Browsers reset `playbackRate` on load, so it is re-asserted on `loadedmetadata` *and*
`ratechange`.

### Two screens, and where scroll goes

**Selection screen** (`WorkStage`) — three decks, one per discipline. Each is drawn as a deck
seen from the side: three cards skewed −8° cascading down-right, the two behind desaturated
under a scrim until the deck is hovered. Pure CSS, so Tailwind's `translate-*` utilities are
safe here (see rule 3). Nothing on this screen reacts to scroll position.

**Inside a category** (`CategoryView`) — a full-screen layer under the nav. Page scroll is
*frozen* (Lenis stops) and the wheel, touch drags and arrow keys move `view.deck.target`
instead. `ScrollEngine` eases `view.deck.pos` toward it and positions every card from its
distance `d` to that position:

- `d ≈ 0` — front and centre, full brightness, **the only card with `pointer-events: auto`**
- `0 < d < ~3` — fanned out behind, dimmed and scaled down
- `d ≥ ~3` — invisible; the rest of the deck is never drawn
- `d < 0` — already passed: lifts away and dissolves

The cards carry the same constant −8° skew and down-right cascade as the selection decks, so
both screens read as the same object. So the deck is *not* driven by page scroll — that was a deliberate change. Hover is reported
through `data-hover` on the card and eased with `damp()`, so scroll position and hover lift
share one owner of `transform`. Card hover *affordances* (border, the "Open" arrow, image
opacity) are plain CSS, because they touch no transform.

### The spiders

`components/ui/spider-cursor.tsx` draws three spiders to a transparent canvas, in the accent
orange. **There is no body** — the animal is the bundle of strands converging on a point.

The legs are the whole trick: rather than a fixed rig, each spider reaches for whichever of a
few hundred anchor points scattered over the screen happen to be nearest, so legs come in
wildly different lengths. Everything about a strand is then driven by how near its foot is:

| | far | near |
|---|---|---|
| line width | 0.45 | 3.1 |
| alpha | 0.12 | 0.95 |
| foot radius | 0.5 | 5.2 |
| wobble | 0.5 | 3.4 |

That spread is the depth. A single uniform stroke reads flat no matter how it is animated —
thickness, brightness and foot size have to disagree across the frame for the eye to sort the
legs into near and far. Each strand is also stepped through a two-sine noise field so it
wavers instead of ruling a straight line. `components/connect/Spider.tsx` wraps it with
everything portfolio-specific.

Two departures from the version this is adapted from, both load-bearing:

- **The canvas is cleared, not painted black.** The original fills the frame with an opaque
  black disc every tick. Here that would bury a screen full of links.
- **It never takes the pointer.** `pointer-events: none` end to end — and `main` is
  click-through too, see below.

Keeping it from becoming noise:

- **Click and they bolt.** Each picks a heading away from the click, jitters it, and runs flat
  out (speed cap and easing both loosen while fleeing); 1.8s after the last click they come
  back to the cursor. The listener is on `window` in the capture phase, so the click still
  reaches the link underneath — the animals react *and* the link opens.
- When the pointer goes idle for 3.5s they stroll to one of the link words and light it
  (`[data-spider-near]`, colour only — the engine owns those elements' inline opacity for the
  pulse, and inline always wins). The spiders *are* the call to action, so the screen carries
  one line of copy.
- They walk. No darting, no scale, no sound.

On touch devices the gyroscope drives them instead, **inverted** — tilt right and they walk
left, as if resting on the glass. iOS will not hand over orientation without a gesture, so a
single pill asks once; if it is declined nothing breaks and the links still work. Under
`prefers-reduced-motion` the component renders nothing at all.

**`main` is `pointer-events: none`.** It is `z-10` and spans the document, so on the connect
screen it sat on top of the link field and swallowed every click meant for it — the links were
dead and looked fine. Only the hero and work stages take the pointer back.

### Light and depth on the connect screen

The screen is dark and out of focus, and the spiders carry the light. `ConnectField` draws the
marquee twice:

- **`.connect-far`** — dimmed and gaussian-blurred (`blur(3.5px)`). The far distance, and the
  layer that actually holds the `<a>` tags.
- **`.connect-near`** — the same geometry, lit and in focus, masked down to three soft circles
  that `<Spider/>` parks on the spiders every frame.

So wherever they walk, those words come forward — lit *and* sharpened — while the rest stays
back. Focus is what sells the depth; brightness alone reads as a flat spotlight.

The mask moves through CSS custom properties (`--sx1/--sy1` … `--sx3/--sy3`) rather than a
rebuilt gradient string, and updates every other frame: moving a mask forces the masked layer
to re-rasterise, and this one is a screen full of type. The sharp copy is inert
(`aria-hidden`, no pointer events) — the base layer underneath is identical in position, so
clicks and screen readers hit the real links wherever the light happens to be.

### The footer

`Footer` is `z-20`. The connect layers are `fixed` and full-viewport at `z-11`/`z-12`, so at
`z-10` the blurred link field painted straight over the spec sheet and washed it out. It also
carries two added layers: a gradient that dissolves the link field into solid black on the way
in, so the footer arrives rather than collides, and a `.glass` panel around the spec sheet
itself.

### Glass

`.glass` (and `.glass-rim` for a lit edge) in `globals.css` — a frosted surface used only where
a panel sits over moving footage and has to separate from it: the nav bar, the deck cards, the
category tiles, the detail panel and its close button, the gyro pill. It is deliberately kept
off full-screen layers, because `backdrop-filter` over a playing video is expensive. It also
degrades to a flat dark panel under `prefers-reduced-transparency`.

## Three rules this codebase depends on

**1. Nothing between the title and the film may create a stacking context.**
`mix-blend-mode` only blends with a backdrop it is not isolated from. A `z-index` on any
wrapper above `<HeroTitle/>` — or an ancestor `filter` / `opacity` / `transform` /
`will-change` — silently turns the inversion off and leaves plain white type. That is why the
hero's copy panel is a *sibling* of the title rather than its parent, and why the title's
wrapper has no `z-index`.

**2. Never scroll the document behind Lenis's back.**
`scrollIntoView` / `window.scrollTo` move the DOM while Lenis keeps its own position, and the
engine then reads a stale scroll — every scroll-driven layer freezes. Use `scrollToStage()`
from `ScrollEngine.tsx`. A watchdog in the frame loop also snaps Lenis back onto the document
if they disagree for ~6 frames (covers anchor jumps and browser scroll restoration).

**3. GSAP and Tailwind v4 fight over `translate`.**
GSAP writes `translate: none` on anything it tweens, and Tailwind v4's `translate-x-*`
utilities use the independent `translate` property — so a tweened element loses its
utility offsets. `DisplayCards` keeps the fan offsets on the card and tweens a wrapper.

## Filling it in: `/studio`

Run `npm run dev` and open **http://localhost:3000/studio**. Every project gets a drop zone and
a link field: drop a still, paste the URL its *View Project* button should open, press Save.

That writes the image to `public/thumbs/<id>.<ext>` and records both values in
`lib/project-overrides.json`, which `lib/content.ts` merges over the placeholders. So the
result is **committed with the repo** — no database, no CMS, and the built site stays fully
static. A project with no link yet shows "Link coming soon" instead of a dead button.

**The studio is development-only.** `app/api/studio/route.ts` returns 404 in a production
build: a deployed site must never expose a write endpoint, and its filesystem is read-only
anyway. It validates regardless — the project id must match a known project (which is also
what makes path traversal impossible, since the written filename is built from that id and
never from the upload), the extension comes from a MIME allow-list rather than the uploaded
filename, links must be `http`/`https`, and the body is capped at 12 MB.

## Placeholders to replace

Search the repo for `TODO_COPY`, `TODO_URL`, `TODO_ASSET`. The stills are done; what is left is
per-project copy and links.

- **Fiona (Adobe Fonts)** — display type. Create a web project at fonts.adobe.com containing
  Fiona, then `cp .env.local.example .env.local` and set `NEXT_PUBLIC_TYPEKIT_ID` to the kit
  id. Until it is set nothing is requested and the Didone fallback stack in `globals.css`
  (Didot / Bodoni 72 / Playfair / Georgia) carries the same character. The hero title uses
  SVG `textLength` with `lengthAdjust="spacing"`, so it lands at the same width either way —
  only the letterforms change when Fiona loads.

- **`lib/content.ts`** — `role` / `tools` / `type` / `summary` for all 12 projects,
  each `projectUrl`, `SOCIALS` (Instagram / Threads / YouTube), `CONTACT` email.
- **`public/video/hero-bg.mp4`** — the full-bleed film behind the hero (currently the
  Firefly particle clip, ~23 MB). It autoplays and loops. **Compress it** — target 3–5 MB,
  ~1600px wide, H.264 plus a WebM sibling.
- **`public/video/hero-fill.mp4`** — the iridescent chrome loop masked inside the
  letterforms. Paused; scroll scrubs it. It gates the preloader, so keep it small.
- **`public/video/showreel.mp4`** — in place (5 MB).
- **`public/thumbs/*.webp`** — all 12 stills are in place (1.5 MB total, 1600px wide, q80).
  The originals came in at ~104 MB; anything new should be run through the same treatment, or
  just dropped on `/studio`, which does not resize — so downscale before uploading.

## Fallbacks

- **mobile (< 900px)** — static gradient fill in the title, autoplay loop instead of
  scrubbing, split layouts fold to one centred column.
- **`prefers-reduced-motion`** — no Lenis (native scroll), no word reveal, no marquee,
  static poster instead of the reel, static title fill.
- **video unsupported / errored** — the `<rect>` gradient under the `foreignObject` stays
  visible, so the title never disappears.
