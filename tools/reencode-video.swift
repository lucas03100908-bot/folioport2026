import AVFoundation
import CoreImage
import Foundation

// Re-encode a video with a keyframe every N frames, so that seeking to an
// arbitrary time costs at most N-1 frame decodes. Scroll-scrubbed video needs
// this; ordinary playback does not, which is why encoders default the other way.

let args = CommandLine.arguments
guard args.count >= 4 else {
  FileHandle.standardError.write("usage: reenc <in> <out> <gop> [maxWidth] [mbps]\n".data(using: .utf8)!)
  exit(2)
}
let inURL = URL(fileURLWithPath: args[1])
let outURL = URL(fileURLWithPath: args[2])
let gop = Int(args[3]) ?? 1
let maxWidth = args.count > 4 ? Int(args[4]) ?? 0 : 0
let mbps = args.count > 5 ? Double(args[5]) ?? 0 : 0

let asset = AVAsset(url: inURL)
guard let track = asset.tracks(withMediaType: .video).first else { exit(3) }
let natural = track.naturalSize.applying(track.preferredTransform)
let srcW = abs(natural.width), srcH = abs(natural.height)
var outW = srcW, outH = srcH
if maxWidth > 0 && srcW > CGFloat(maxWidth) {
  let s = CGFloat(maxWidth) / srcW
  outW = (srcW * s).rounded(); outH = (srcH * s).rounded()
}
outW -= outW.truncatingRemainder(dividingBy: 2)
outH -= outH.truncatingRemainder(dividingBy: 2)
let fps = track.nominalFrameRate
print("source \(Int(srcW))x\(Int(srcH)) @\(fps)fps -> \(Int(outW))x\(Int(outH)), gop \(gop)")

try? FileManager.default.removeItem(at: outURL)
let reader = try AVAssetReader(asset: asset)
let output = AVAssetReaderTrackOutput(
  track: track,
  outputSettings: [kCVPixelBufferPixelFormatTypeKey as String:
                     kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange])
output.alwaysCopiesSampleData = false
reader.add(output)

let bitrate = mbps > 0 ? Int(mbps * 1_000_000)
                       : Int(outW * outH * Double(max(fps, 24)) * 0.16)
let writer = try AVAssetWriter(outputURL: outURL, fileType: .mp4)
let input = AVAssetWriterInput(mediaType: .video, outputSettings: [
  AVVideoCodecKey: AVVideoCodecType.h264,
  AVVideoWidthKey: Int(outW),
  AVVideoHeightKey: Int(outH),
  AVVideoCompressionPropertiesKey: [
    AVVideoMaxKeyFrameIntervalKey: gop,
    AVVideoAverageBitRateKey: bitrate,
    AVVideoAllowFrameReorderingKey: false,   // no B-frames: nothing to unwind
    AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
  ],
])
input.expectsMediaDataInRealTime = false
input.transform = track.preferredTransform
let adaptor = AVAssetWriterInputPixelBufferAdaptor(
  assetWriterInput: input,
  sourcePixelBufferAttributes: [
    kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_420YpCbCr8BiPlanarVideoRange,
    kCVPixelBufferWidthKey as String: Int(outW),
    kCVPixelBufferHeightKey as String: Int(outH),
  ])
writer.add(input)

let ciContext = CIContext(options: [.useSoftwareRenderer: false])
writer.startWriting()
writer.startSession(atSourceTime: .zero)
reader.startReading()

let queue = DispatchQueue(label: "reenc")
let done = DispatchSemaphore(value: 0)
var count = 0
input.requestMediaDataWhenReady(on: queue) {
  while input.isReadyForMoreMediaData {
    guard let sample = output.copyNextSampleBuffer() else {
      input.markAsFinished(); writer.finishWriting { done.signal() }; return
    }
    let pts = CMSampleBufferGetPresentationTimeStamp(sample)
    guard let src = CMSampleBufferGetImageBuffer(sample) else { continue }
    if outW == srcW && outH == srcH {
      adaptor.append(src, withPresentationTime: pts)
    } else {
      var dst: CVPixelBuffer?
      CVPixelBufferPoolCreatePixelBuffer(nil, adaptor.pixelBufferPool!, &dst)
      if let dst {
        let scale = outW / CGFloat(CVPixelBufferGetWidth(src))
        let image = CIImage(cvPixelBuffer: src)
          .transformed(by: CGAffineTransform(scaleX: scale, y: scale))
        ciContext.render(image, to: dst)
        adaptor.append(dst, withPresentationTime: pts)
      }
    }
    count += 1
  }
}
done.wait()
print("wrote \(count) frames, status \(writer.status.rawValue) \(writer.error?.localizedDescription ?? "")")
