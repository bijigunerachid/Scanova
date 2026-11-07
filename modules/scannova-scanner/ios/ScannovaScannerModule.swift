import ExpoModulesCore
import UIKit
import VisionKit

private let tempDirectory = "scannova-tmp"

// Not compiled or run yet: iOS needs a Mac or EAS Build and a real iPhone. See
// the owner decisions in docs/roadmap.md.
public class ScannovaScannerModule: Module {
  private var activeSession: ScanSession?

  public func definition() -> ModuleDefinition {
    Name("ScannovaScanner")

    AsyncFunction("getAvailabilityAsync") { () -> [String: String] in
      VNDocumentCameraViewController.isSupported
        ? ["status": "ready"]
        : ["status": "unavailable", "reason": "unsupported-device"]
    }

    // VisionKit ships with iOS, so there is nothing to download.
    AsyncFunction("prepareAsync") { () -> [String: Bool] in
      ["alreadyInstalled": true]
    }

    AsyncFunction("scanAsync") { (promise: Promise) in
      guard self.activeSession == nil else {
        promise.reject("ERR_SCAN_IN_PROGRESS", "A scan is already in progress")
        return
      }
      guard VNDocumentCameraViewController.isSupported else {
        promise.reject("ERR_SCANNER_UNAVAILABLE", "This device cannot run the document scanner")
        return
      }
      guard let presenter = self.appContext?.utilities?.currentViewController() else {
        promise.reject("ERR_SCAN_FAILED", "There is no screen to start the scanner from")
        return
      }

      let session = ScanSession(promise: promise) { [weak self] in
        self?.activeSession = nil
      }
      self.activeSession = session
      clearEarlierScans()

      let camera = VNDocumentCameraViewController()
      camera.delegate = session
      presenter.present(camera, animated: true)
    }.runOnQueue(.main)
  }
}

// A new scan removes earlier ones even if it is then cancelled, because the app
// has already stopped showing them. The app moves pages it keeps before then.
private func clearEarlierScans() {
  let files = FileManager.default
  let root = files.temporaryDirectory.appendingPathComponent(tempDirectory)
  let existing = (try? files.contentsOfDirectory(at: root, includingPropertiesForKeys: nil)) ?? []
  for item in existing where item.lastPathComponent.hasPrefix("scan-") {
    try? files.removeItem(at: item)
  }
}

private final class ScanSession: NSObject, VNDocumentCameraViewControllerDelegate {
  private let promise: Promise
  private let onFinish: () -> Void

  init(promise: Promise, onFinish: @escaping () -> Void) {
    self.promise = promise
    self.onFinish = onFinish
  }

  func documentCameraViewControllerDidCancel(_ controller: VNDocumentCameraViewController) {
    controller.dismiss(animated: true)
    promise.resolve(["status": "cancelled"])
    onFinish()
  }

  func documentCameraViewController(
    _ controller: VNDocumentCameraViewController,
    didFailWithError error: Error
  ) {
    controller.dismiss(animated: true)
    promise.reject("ERR_SCAN_FAILED", "The scanner ended with an error")
    onFinish()
  }

  func documentCameraViewController(
    _ controller: VNDocumentCameraViewController,
    didFinishWith scan: VNDocumentCameraScan
  ) {
    controller.dismiss(animated: true)

    guard scan.pageCount > 0 else {
      promise.resolve(["status": "cancelled"])
      onFinish()
      return
    }

    // The session stays active while pages are written, so a second scan cannot
    // start and remove the files of the first.
    DispatchQueue.global(qos: .userInitiated).async {
      do {
        let pages = try self.writePages(of: scan)
        self.promise.resolve(["status": "completed", "pages": pages])
      } catch {
        self.promise.reject("ERR_SCAN_FAILED", "The scanned pages could not be saved")
      }
      DispatchQueue.main.async { self.onFinish() }
    }
  }

  private func writePages(of scan: VNDocumentCameraScan) throws -> [[String: Any]] {
    let files = FileManager.default
    let folder = files.temporaryDirectory
      .appendingPathComponent(tempDirectory)
      .appendingPathComponent("scan-\(UUID().uuidString)")
    try files.createDirectory(at: folder, withIntermediateDirectories: true)

    do {
      return try (0..<scan.pageCount).map { index in
        try autoreleasepool {
          let image = scan.imageOfPage(at: index)
          guard let data = image.jpegData(compressionQuality: 0.9), let bitmap = image.cgImage else {
            throw CocoaError(.fileWriteUnknown)
          }
          let file = folder.appendingPathComponent("page-\(index + 1).jpg")
          try data.write(to: file, options: .atomic)
          return [
            "uri": file.absoluteString,
            "width": bitmap.width,
            "height": bitmap.height,
            "size": data.count,
          ]
        }
      }
    } catch {
      try? files.removeItem(at: folder)
      throw error
    }
  }
}
