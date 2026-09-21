---
name: MINHO
description: A designer's portfolio run like a dark screening room, where the film leads and the type behaves like credits.
colors:
  base: "#000000"
  ink: "#f2f2f2"
  muted: "#8a8a8a"
  faint: "#767676"
  hair: "rgba(255, 255, 255, 0.12)"
  accent: "#ff4d1c"
  accent-soft: "rgba(255, 77, 28, 0.16)"
typography:
  display-1:
    fontFamily: "fiona, Didot, Bodoni 72, Georgia, serif"
    fontSize: "clamp(2.5rem, 7vw, 6rem)"
    fontWeight: 400
    lineHeight: 0.92
    letterSpacing: "-0.005em"
  display-2:
    fontFamily: "fiona, Didot, Bodoni 72, Georgia, serif"
    fontSize: "clamp(1.75rem, 5vw, 4rem)"
    fontWeight: 400
    lineHeight: 0.92
    letterSpacing: "-0.005em"
  display-3:
    fontFamily: "fiona, Didot, Bodoni 72, Georgia, serif"
    fontSize: "clamp(1.5rem, 3.4vw, 2.75rem)"
    fontWeight: 400
    lineHeight: 0.92
    letterSpacing: "-0.005em"
  display-4:
    fontFamily: "fiona, Didot, Bodoni 72, Georgia, serif"
    fontSize: "clamp(1.35rem, 2.4vw, 1.9rem)"
    fontWeight: 400
    lineHeight: 0.92
    letterSpacing: "-0.005em"
  body:
    fontFamily: "Helvetica Neue, Pretendard, Inter, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.8
  small:
    fontFamily: "Helvetica Neue, Pretendard, Inter, system-ui, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.7
  caption:
    fontFamily: "ui-monospace, SF Mono, JetBrains Mono, Menlo, monospace"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.35
    letterSpacing: "0.2em"
  label:
    fontFamily: "Helvetica Neue, Pretendard, Inter, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.22em"
  meta:
    fontFamily: "ui-monospace, SF Mono, JetBrains Mono, Menlo, monospace"
    fontSize: "0.6875rem"
    fontWeight: 400
    lineHeight: 1.3
    letterSpacing: "0.2em"
rounded:
  frame: "16px"
  pill: "9999px"
spacing:
  gutter: "20px"
  gutter-md: "48px"
  container: "1440px"
  nav: "64px"
components:
  button-primary:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.base}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "16px 24px"
  button-outline:
    textColor: "{colors.ink}"
    typography: "{typography.label}"
    rounded: "0px"
    padding: "16px 28px"
  button-glass:
    textColor: "{colors.muted}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "12px 16px"
  frame-card:
    backgroundColor: "#0a0a0c"
    rounded: "{rounded.frame}"
  nav-tab:
    textColor: "{colors.muted}"
    typography: "{typography.label}"
    padding: "14px 12px"
  nav-tab-active:
    textColor: "{colors.accent}"
    typography: "{typography.label}"
---

# Design System: MINHO

## Overview

**Creative North Star: "The Dark Screening Room"**

The house lights are down and the film is the lead. Everything else sets up the picture, then gets out of the way. Type behaves like a film's title cards and credits. A Didone title stands alone in the dark. Small spaced capitals credit the work beside it. Nothing competes with moving image for the eye.

The room is black (#000). The only colour that belongs to the site rather than to the footage is one ember orange, used for what is live now: the active tab, the progress line, the thing under the pointer. The space is generous and deliberately empty, because in a screening room empty space is what makes the screen glow. Motion runs at two speeds. Controls answer instantly, like a projectionist's switch. Scenes move slowly, like a dissolve.

WebGL is allowed where it is the picture itself: the discipline tanks and the hero film. It is never there as decoration laid over the picture.

**Key Characteristics:**
- Black ground, footage and live water as the only large colour fields
- Didone display in uppercase for titles; a neutral grotesque in spaced capitals for credits
- One accent, reserved for live state
- Two motion speeds: 200ms for UI, 900ms for scenes
- Frames (anything holding moving image) share one radius; controls are pills

## Colors

A projection booth palette: black, three greys of house light, and one ember.

### Primary
- **Ember** (#ff4d1c): what is live right now. The active category tab and its underline, the scroll-progress hairline, the rail ticks, hover on links, the focus ring, text selection, the primary CTA. Never a fill for large areas; never body text.
- **Ember Glow** (rgba(255, 77, 28, 0.16)): the ember's hover wash behind outline buttons. Nowhere else.

### Neutral
- **Screen Black** (#000000): the room. Page, footer, and the WebGL clear colour, so the first frame never flashes.
- **Projection White** (#f2f2f2): titles and primary copy. Pure #fff only for type set directly on footage, where it has to cut through.
- **House Light** (#8a8a8a): secondary copy, inactive tabs, spec keys. 6.08:1 on black.
- **Exit Sign** (#767676): the quietest readable tier: fine print, cues, counters. 4.62:1 on black. This is the floor; nothing readable goes darker.
- **Hairline** (rgba(255, 255, 255, 0.12)): dividers and rules.

### Named Rules
**The Live Ember Rule.** The accent marks exactly one kind of thing: state that is live now. If an element is orange at rest and nothing about it is active, it is wrong.

**The Contrast Floor Rule.** Readable text never goes below Exit Sign (#767676, 4.62:1). Type set over moving image carries a scrim measured with the image at its brightest, not its average.

## Typography

**Display Font:** Fiona (Adobe Fonts kit `kuv1jiy`), with Didot, Bodoni 72, Georgia
**Body/UI Font:** Helvetica Neue, with Pretendard for Hangul, then Inter and system-ui
**Mono Font:** ui-monospace / SF Mono. Numerals and data only.

**Character:** A high-contrast Didone set in uppercase is the title card. A neutral grotesque in wide-tracked capitals is the credit roll. Together they read as cinema, not as a website.

### Hierarchy
- **Display 1** (400, clamp(2.5rem, 7vw, 6rem), 0.92): the one moment per stage. The connect field, the reel stamp.
- **Display 2** (400, clamp(1.75rem, 5vw, 4rem), 0.92): a title that owns its screen. Project detail title, discipline chooser.
- **Display 3** (400, clamp(1.5rem, 3.4vw, 2.75rem), 0.92): a title on a frame, and a stage heading. Project card titles, "Choose a discipline", footer social links, the dialog title.
- **Display 4** (400, clamp(1.35rem, 2.4vw, 1.9rem), 0.92): reserved for a short screen's stage heading.
- **Body** (400, 15px, 1.8): reading prose, mostly Korean project write-ups. Max measure 52ch.
- **Small** (400, 13px, 1.7): notes, card blurbs, dialog copy. Max 46ch.
- **Caption** (mono, 13px, 0.2em): numerals that sit on a frame or under the rail, such as "01 / 06".
- **Label** (600, 11px, 0.22em, uppercase): every control and credit: tabs, buttons, cues, card credits, footer fine print.
- **Meta** (mono, 11px, 0.2em): small numerals such as counts "(6)" and the loader's percentage.

Each role is a Tailwind utility (`text-display-2`, `text-label`, …) that sets size, leading, tracking and weight together. The `.display` and `.eyebrow` classes live in `@layer components`, so a utility on the same element always wins.

### Named Rules
**The Credit Rule.** Small spaced capitals credit the work: who, what, when. They sit beside or below a title, never above it as a kicker. A heading carries its own weight.

**The Mono-Is-Data Rule.** Monospace is for numerals and measured values only: counters, percentages, counts, spec values. A word in mono is a costume, so words use Label.

**The 11px Floor Rule.** No text renders below 11px. The old 9px and 10px tiers are gone.

## Layout

The page is a sequence of sticky stages: hero film, work rail, showreel, connect field. Each stage is one screen tall, pinned while the scroll plays it. Content never scrolls past a stage. The stage plays and then yields.

- **Container:** `max-w-page` (1440px), centred, for every stage and the nav.
- **Gutters:** `px-gutter` everywhere, never a bare `px-5 md:px-12`. It's 20px on phones and 48px from `md` (768px) up, and it never goes below the safe-area inset (the site uses `viewport-fit: cover`, so a sideways iPhone's notch sits inside the page).
- **Bottom edges:** anything anchored to the bottom of the screen uses `pb-safe-[…]` / `bottom-safe-[…]`, which add the home-indicator inset to the spacing.
- **Spacing:** Tailwind's 4px scale. Tight inside a group (8–14px between a title and its credit), generous between groups (24–40px), and more space above a heading than below it.
- **Breakpoints:** 900px is the one that changes behaviour: the pointer versus the phone, scroll versus swipe, and `view.mobile` in the engine. `md` and `lg` only adjust size.
- **Short screens** (max-height 560px, a phone turned sideways) are measured in height instead of width. See the `max-height` block in globals.css.
- **Stable headers:** a header row holds its height across states, so the rail under it never jumps when a discipline opens or closes.

### Named Rules
**The 44 Rule.** Every control is at least 44×44px to the finger (`hit`), however small it is drawn: arrows, the wordmark, text links and the email copy button included. Pointer-only controls hidden from touch (the side progress rail) may drop to 24px, the WCAG 2.5.8 floor.

**The One-Screen Stage Rule.** Every stage must fit its screen at 375×667, 390×844, 812×375, 1440×700 and 1440×900 with nothing essential below the fold, and at least 8px of air between the rail controls and the cue. Heights under 760px get the short-screen rail sizes in globals.css.

## Elevation & Depth

The room is flat and dark, and depth comes from light, not from stacked shadows. Frames sit forward on one long, soft drop shadow. Glass appears only where a panel lies over moving footage and has to separate from it: the nav, the detail panel's controls, the contact card. Depth inside an image comes from focus: blur for far, sharp for near (the connect field).

### Shadow Vocabulary
- **Frame rest** (`0 26px 60px -24px rgba(0,0,0,.85), inset 0 0 0 1px rgba(255,255,255,.07)`): a frame at rest.
- **Frame hover** (`0 34px 80px -26px rgba(0,0,0,.95), inset 0 0 0 1px rgba(255,255,255,.16)`): the frame lifts and its rim catches the light.
- **Glass** (`0 24px 70px -34px rgba(0,0,0,.95), inset 0 1px 0 rgba(255,255,255,.085)` + `blur(18px) saturate(150%)`): panels over footage only.

### Named Rules
**The Glass-Over-Film Rule.** Backdrop blur exists to separate a panel from moving image under it. Over a still black ground it is decoration, so it is not allowed there.

## Shapes

Two shapes only. **Frames** (the liquid tanks, the reel window, detail media, the contact card, the dialog) share one gently rounded corner (16px, `rounded-frame`). The reel window opens from 16px to 0 as it becomes the screen. **Controls** that float (back, close, dialog buttons, the tilt pill) are full pills. The outline CTA stays square, because it is set type rather than a floating control. Rules and dividers are 1px hairlines.

## Components

### Buttons
- **Primary (dialog):** Ember fill, black Label text, pill, 16px × 24px.
- **Outline CTA (MagneticButton):** 1px white/25 border, square, Label text. On hover the border turns ember, the button fills with Ember Glow and a radial ember light follows the pointer. The magnetic pull runs 420ms on the expo curve.
- **Glass control (Back, Close):** glass pill with House Light text; Ember on hover.
- **Press:** every button that is not magnetic scales to 0.97 on `:active` (a bare icon button scales to 0.94), so a tap is acknowledged.
- **Icon buttons (rail Previous/Next):** a 44px circle with a 1px white/15 ring, a 20×13px glyph, House Light; the ring and glyph turn Ember on hover and focus. The ring is what tells a thumb it is a button.

### Category tabs (nav)
Label type in House Light, 45px tall for touch. The active tab is Ember with a 1px ember underline that draws from the left (420ms, expo). On hover, the underline grows a third of the way as a hint.

### Frame card (liquid tank)
A WebGL room of seawater in a 16px frame. The chooser card carries the discipline name alone, centred, in Display 2 white with a close shadow for the Didone hairlines. A project card credits its type top-left (Caption-size Label, white/75) and its number top-right (mono Caption), with the title in Display 3, a Small blurb and a Label CTA at the bottom.

### Spec sheet (dotted rows)
The key is in Exit Sign capitals, a dotted leader runs across, and the value is in Projection White, all in mono at Caption size (13px). Below 768px the key sits above its value and the leader is dropped. It is used in the contact card and the project detail.

## Motion

Two speeds, three curves: UI answers fast and scenes breathe.

| Token | Value | Use |
|---|---|---|
| `--dur-press` | 140ms | `:active` press feedback |
| `--dur-ui` (default) | 200ms | hover and colour changes; any bare `transition-*` |
| `--dur-state` | 420ms | underline draw, magnetic pull, loader progress, fades of a helper |
| `--dur-scene` | 900ms | focus pulls, scene fades, the detail panel's entrance |
| `--ease-out` | cubic-bezier(0.23, 1, 0.32, 1) | all UI (default for Tailwind transitions) |
| `--ease-out-expo` | cubic-bezier(0.16, 1, 0.3, 1) | authored arrivals: underline, magnet, detail reveal (GSAP `expo.out`) |
| `--ease-dissolve` | cubic-bezier(0.4, 0, 0.2, 1) | cross-fades between scenes: the loader lifting, the hero film changing |

- The scroll engine and WebGL own continuous motion, and they are integrated per frame rather than tweened. Any clock that the cursor can speed up is integrated, never computed as `time × speed`.
- **Stage titles rise into frame** (`<Reveal>`): the line is clipped by its own box and lifts 105% over 900ms on the expo curve the first time it is 60% in view, and again when its text changes. Visible by default; only armed by script.
- **Frames answer the pointer:** a lift of 6px on hover (420ms, expo), a press to scale 0.985.
- One authored moment per stage. The project detail's entrance (media focus-pull, then the title rising word by word, then the details) is the only staggered sequence on the site.
- `prefers-reduced-motion`: CSS transitions collapse to instant, GSAP sets the end state, the tanks freeze on a still frame, and the connect field drops its blur.

## Do's and Don'ts

### Do:
- **Do** use a role utility (`text-label`, `text-display-3`, …) for every piece of text. A raw `text-[13px]` is a missing role, so add the role or reuse one.
- **Do** keep the ember for live state: the active tab, progress, hover, focus.
- **Do** give every non-magnetic button `active:scale-[0.97]`.
- **Do** measure type over footage with the scrim applied and the footage at its brightest.
- **Do** keep a header row's height when its content changes between states.
- **Do** give every section a real heading (visible or `sr-only`), so a screen reader can jump between stages.
- **Do** mark decorative video `aria-hidden`.

### Don't:
- **Don't** put a small caps label above a heading. Credits go beside or below.
- **Don't** set words in monospace. Mono is for numerals and measured values.
- **Don't** render text below 11px or darker than #767676.
- **Don't** use `duration-300` or `ease-in` for UI. Use the default 200ms ease-out, or name a token.
- **Don't** add a second accent colour or tint surfaces with the ember.
- **Don't** add glass or blur over a still black ground.
- **Don't** hard-code a page gutter or a bottom inset. Use `px-gutter` / `pb-safe-[…]`.
- **Don't** ship a control under 44px on touch.
- **Don't** mix radii. A frame is 16px, a floating control is a pill, and set type is square.
