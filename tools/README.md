# tools

## reencode-video.swift

Re-encodes a video so that **every frame is a keyframe**.

Video encoders place keyframes sparingly — a few seconds apart — because
ordinary playback only ever moves forward. Scroll-scrubbed video is the
opposite case: it seeks constantly, and seeking to a time between keyframes
makes the decoder start at the previous one and roll forward to get there. With
a 28-frame gap that is up to 28 frames of work for one frame shown, and a
browser under load will simply hold on the keyframe instead — which is what
reads as judder.

`public/video/hero-bg.mp4` is scrubbed by scroll and is encoded this way.
`showreel.mp4` is not — it plays normally, never seeks, and would only get
bigger.

Needs no ffmpeg; it uses AVFoundation, which ships with macOS.

```bash
swiftc -O -o /tmp/reencode tools/reencode-video.swift
/tmp/reencode public/video/hero-bg.mp4 /tmp/out.mp4 1 0 6.6
#             <in>                     <out>         │ │ └ Mbps (0 = derive)
#                                                    │ └── max width (0 = keep)
#                                                    └──── keyframe interval
```

All-intra at a matched bitrate came out *smaller* than the original
inter-coded file (6.64MB against 7.35MB), so there is no size argument against
it for a film this short.

### Variants

Some films ship a second, lighter cut. Each exists because the main one is
built for a job the variant's viewer never asks of it:

| File | Size | Made with | Why |
|---|---|---|---|
| `hero-bg-mobile.mp4` | 1.6MB | `48 1280 1.6` | Below 900px the hero loops forward and is never scrubbed, so it needs no all-intra frames. Picked by `<source media="(max-width: 899px)">`. |

## glb-to-mesh.mjs

Turns a `.glb` into what the mask scene loads: one quantised mesh buffer and
WebP maps. It keeps the largest primitive and drops the rest of the scene, so
a backdrop cube in the export never reaches the page.

```bash
node tools/glb-to-mesh.mjs ~/Desktop/Spidey/tal.glb public/model tal
```

`tal.glb` went from 10.5MB to 1.32MB of mesh and 183KB of maps: positions to
int16 against the bounding box, normals to int8, uvs to uint16, and a 4096px
PNG roughness map — 5.9MB of it — down to a 512px WebP, which is all a
roughness term needs.
