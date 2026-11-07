package expo.modules.scannovascanner

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.graphics.BitmapFactory
import android.net.Uri
import com.google.android.gms.common.ConnectionResult
import com.google.android.gms.common.GoogleApiAvailability
import com.google.android.gms.common.moduleinstall.ModuleInstall
import com.google.android.gms.common.moduleinstall.ModuleInstallRequest
import com.google.mlkit.common.MlKitException
import com.google.mlkit.vision.documentscanner.GmsDocumentScannerOptions
import com.google.mlkit.vision.documentscanner.GmsDocumentScanning
import com.google.mlkit.vision.documentscanner.GmsDocumentScanningResult
import expo.modules.kotlin.Promise
import expo.modules.kotlin.functions.Queues
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.io.IOException
import java.util.UUID
import java.util.concurrent.atomic.AtomicReference
import kotlinx.coroutines.launch

private const val SCAN_REQUEST_CODE = 23721
private const val TEMP_DIRECTORY = "scannova-tmp"

// ML Kit keeps its own copy of each page here and never removes it. This name was
// observed on a real phone and is not documented, so tests/manual checks it.
private const val ML_KIT_CACHE_DIRECTORY = "mlkit_docscan_ui_client"

class ScannovaScannerModule : Module() {
  // Holds the promise of the scan in progress. Only one scan can run at a time.
  private val pendingScan = AtomicReference<Promise?>(null)

  // Base mode keeps ML Kit's filters out of the returned page, so the original
  // stays unfiltered. Gallery import is handled by the app, with its own editor.
  private val scanner by lazy {
    GmsDocumentScanning.getClient(
      GmsDocumentScannerOptions.Builder()
        .setScannerMode(GmsDocumentScannerOptions.SCANNER_MODE_BASE)
        .setResultFormats(GmsDocumentScannerOptions.RESULT_FORMAT_JPEG)
        .setGalleryImportAllowed(false)
        .build()
    )
  }

  override fun definition() = ModuleDefinition {
    Name("ScannovaScanner")

    AsyncFunction("getAvailabilityAsync") { promise: Promise ->
      resolveAvailability(promise)
    }

    AsyncFunction("prepareAsync") { promise: Promise ->
      requestDownload(promise)
    }

    AsyncFunction("scanAsync") { promise: Promise ->
      startScan(promise)
    }.runOnQueue(Queues.MAIN)

    OnActivityResult { _, payload ->
      if (payload.requestCode == SCAN_REQUEST_CODE) {
        handleScanResult(payload.resultCode, payload.data)
      }
    }

    OnDestroy {
      pendingScan.set(null)
    }
  }

  private fun requireContext(): Context =
    appContext.reactContext ?: throw IOException("The app context is not available")

  private fun availability(status: String, reason: String? = null): Map<String, String> =
    if (reason == null) mapOf("status" to status) else mapOf("status" to status, "reason" to reason)

  private fun resolveAvailability(promise: Promise) {
    val context = requireContext()
    val playServices = GoogleApiAvailability.getInstance().isGooglePlayServicesAvailable(context)
    if (playServices != ConnectionResult.SUCCESS) {
      promise.resolve(availability("unavailable", "play-services"))
      return
    }

    ModuleInstall.getClient(context)
      .areModulesAvailable(scanner)
      .addOnSuccessListener { response ->
        promise.resolve(availability(if (response.areModulesAvailable()) "ready" else "download-required"))
      }
      .addOnFailureListener {
        promise.resolve(availability("unavailable", "module-check-failed"))
      }
  }

  private fun requestDownload(promise: Promise) {
    val request = ModuleInstallRequest.newBuilder().addApi(scanner).build()
    ModuleInstall.getClient(requireContext())
      .installModules(request)
      .addOnSuccessListener { response ->
        promise.resolve(mapOf("alreadyInstalled" to response.areModulesAlreadyInstalled()))
      }
      .addOnFailureListener { error ->
        promise.reject("ERR_SCANNER_NOT_READY", "The scanner download could not be requested", error)
      }
  }

  private fun startScan(promise: Promise) {
    val activity = appContext.currentActivity
    if (activity == null) {
      promise.reject("ERR_SCAN_FAILED", "There is no screen to start the scanner from", null)
      return
    }
    if (!pendingScan.compareAndSet(null, promise)) {
      promise.reject("ERR_SCAN_IN_PROGRESS", "A scan is already in progress", null)
      return
    }
    runCatching { clearEarlierScans(activity) }

    scanner.getStartScanIntent(activity)
      .addOnSuccessListener { intentSender ->
        try {
          activity.startIntentSenderForResult(intentSender, SCAN_REQUEST_CODE, null, 0, 0, 0)
        } catch (error: Exception) {
          settle { it.reject("ERR_SCAN_FAILED", "The scanner could not be opened", error) }
        }
      }
      .addOnFailureListener { error ->
        settle { it.reject(errorCodeFor(error), "The scanner could not be started", error) }
      }
  }

  private fun errorCodeFor(error: Exception): String =
    when ((error as? MlKitException)?.errorCode) {
      MlKitException.UNSUPPORTED -> "ERR_SCANNER_UNAVAILABLE"
      MlKitException.UNAVAILABLE -> "ERR_SCANNER_NOT_READY"
      else -> "ERR_SCAN_FAILED"
    }

  private fun handleScanResult(resultCode: Int, data: Intent?) {
    appContext.backgroundCoroutineScope.launch {
      val outcome = runCatching { readScanResult(resultCode, data) }
      // Runs for every outcome, so a cancelled or failed scan leaves nothing behind.
      runCatching { File(requireContext().cacheDir, ML_KIT_CACHE_DIRECTORY).deleteRecursively() }
      outcome.fold(
        onSuccess = { result -> settle { it.resolve(result) } },
        onFailure = { error ->
          settle { it.reject("ERR_SCAN_FAILED", "The scanned pages could not be saved", error) }
        }
      )
    }
  }

  private fun readScanResult(resultCode: Int, data: Intent?): Map<String, Any> {
    if (resultCode == Activity.RESULT_CANCELED) {
      return mapOf("status" to "cancelled")
    }
    if (resultCode != Activity.RESULT_OK) {
      throw IOException("The scanner ended with an error")
    }
    val pages = GmsDocumentScanningResult.fromActivityResultIntent(data)?.pages.orEmpty()
    if (pages.isEmpty()) {
      return mapOf("status" to "cancelled")
    }
    return mapOf("status" to "completed", "pages" to copyPages(requireContext(), pages))
  }

  // The promise stays pending while pages are copied, so a second scan cannot
  // start and remove the files of the first.
  private fun settle(action: (Promise) -> Unit) {
    pendingScan.getAndSet(null)?.let(action)
  }

  // A new scan removes earlier ones even if it is then cancelled, because the app
  // has already stopped showing them. The app moves pages it keeps before then.
  private fun clearEarlierScans(context: Context) {
    File(context.cacheDir, TEMP_DIRECTORY)
      .listFiles()
      ?.filter { it.name.startsWith("scan-") }
      ?.forEach { it.deleteRecursively() }
  }

  // Each scan goes in its own folder inside the app's cache.
  private fun copyPages(
    context: Context,
    pages: List<GmsDocumentScanningResult.Page>
  ): List<Map<String, Any>> {
    val folder = File(File(context.cacheDir, TEMP_DIRECTORY), "scan-${UUID.randomUUID()}")
    if (!folder.mkdirs()) {
      throw IOException("The scan folder could not be created")
    }

    try {
      return pages.mapIndexed { index, page ->
        val file = File(folder, "page-${index + 1}.jpg")
        val input = context.contentResolver.openInputStream(page.imageUri)
          ?: throw IOException("A scanned page could not be opened")
        input.use { source -> file.outputStream().use { target -> source.copyTo(target) } }

        val bounds = BitmapFactory.Options().apply { inJustDecodeBounds = true }
        BitmapFactory.decodeFile(file.path, bounds)
        if (bounds.outWidth <= 0 || bounds.outHeight <= 0) {
          throw IOException("A scanned page is not a readable image")
        }

        mapOf(
          "uri" to Uri.fromFile(file).toString(),
          "width" to bounds.outWidth,
          "height" to bounds.outHeight,
          "size" to file.length()
        )
      }
    } catch (error: Exception) {
      folder.deleteRecursively()
      throw error
    }
  }
}
