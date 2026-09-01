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
