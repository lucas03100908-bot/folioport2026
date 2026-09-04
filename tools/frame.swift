import AVFoundation
import CoreImage
import Foundation
import AppKit

// Pull one frame out of a video and write it as a JPEG at a given size.
let a = CommandLine.arguments
guard a.count >= 5 else { exit(2) }
let asset = AVAsset(url: URL(fileURLWithPath: a[1]))
let out = URL(fileURLWithPath: a[2])
let at = Double(a[3]) ?? 0
let parts = a[4].split(separator: "x")
let W = Int(parts[0])!, H = Int(parts[1])!

let gen = AVAssetImageGenerator(asset: asset)
gen.appliesPreferredTrackTransform = true
gen.requestedTimeToleranceBefore = .zero
gen.requestedTimeToleranceAfter = .zero
let cg = try gen.copyCGImage(at: CMTime(seconds: at, preferredTimescale: 600), actualTime: nil)

// cover-crop to the target aspect, then scale
let src = CIImage(cgImage: cg)
let sw = src.extent.width, sh = src.extent.height
let targetAR = CGFloat(W) / CGFloat(H)
var crop = src.extent
if sw / sh > targetAR {
  let w = sh * targetAR
  crop = CGRect(x: (sw - w) / 2, y: 0, width: w, height: sh)
} else {
  let h = sw / targetAR
  crop = CGRect(x: 0, y: (sh - h) / 2, width: sw, height: h)
}
let scale = CGFloat(W) / crop.width
let img = src.cropped(to: crop)
  .transformed(by: CGAffineTransform(translationX: -crop.minX, y: -crop.minY))
  .transformed(by: CGAffineTransform(scaleX: scale, y: scale))

let ctx = CIContext()
let cs = CGColorSpace(name: CGColorSpace.sRGB)!
try ctx.writeJPEGRepresentation(of: img, to: out, colorSpace: cs,
                                options: [kCGImageDestinationLossyCompressionQuality as CIImageRepresentationOption: 0.86])
print("wrote \(W)x\(H) from t=\(at)s")
