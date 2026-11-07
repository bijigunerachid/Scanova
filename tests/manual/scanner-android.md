# Scanner checklist: Android

The scanner screens belong to Google, so Maestro cannot reliably drive them. Run this by hand on a real phone after any change to `modules/scannova-scanner`.

Use a development build and open **Scanner proof (dev only)** from the start screen. Scan non-sensitive paper only, because these steps copy page files off the phone. Delete any copies afterwards.

## Availability

1. Open the screen. It shows either "ready" or "not downloaded yet".
2. If it says "not downloaded yet", tap **Download scanner**, wait, then tap **Check again**. A real phone in this state has not been tested yet, so record what happens and how long it takes.

## Scanning

| #   | Action                                                   | Expected result                                                                 |
| --- | -------------------------------------------------------- | ------------------------------------------------------------------------------- |
| 1   | Tap **Scan**, capture 1 page, finish                     | 1 page shown, upright, with real dimensions and size                            |
| 2   | Tap **Scan**, capture 3 different pages, finish          | 3 pages in the order captured, and the earlier scan is gone                     |
| 3   | Tap **Scan**, then Back or close without a page          | "The scan was cancelled", with no error                                         |
| 4   | Capture 2 pages, then discard and leave the scanner      | "The scan was cancelled", with no pages and no crash                            |
| 5   | Tap **Scan** twice quickly                               | One scanner opens                                                               |
| 6   | Turn the phone sideways inside the scanner, then finish  | Pages return and the app is still working                                       |
| 7   | Press Home inside the scanner, reopen the app, then scan | The scan finishes normally, or is reported as cancelled. It must not stay stuck |

## Files

With the phone connected over USB, debug builds only:

```powershell
adb shell run-as com.rachidbijigune.scannova find cache -type f
cmd /c "adb exec-out run-as com.rachidbijigune.scannova cat cache/scannova-tmp/<scan folder>/page-1.jpg > page-1.jpg"
```

- Pages are under `cache/scannova-tmp/scan-<id>/`, and only the latest scan is kept.
- `cache/mlkit_docscan_ui_client/` is empty or missing after every outcome: finished, cancelled and discarded. ML Kit's folder name is undocumented, so also look for any other new `.jpg` in the list. If a Google Play services update moves it, change the name in the module.
- The pulled file opens as a real JPEG with the dimensions shown on screen.
- No filter was applied: a colour page stays in colour.

## Offline

1. Turn on airplane mode with the scanner already downloaded.
2. Run row 1 again. It should succeed.
3. A fresh device without the scanner should show the "not downloaded yet" state rather than crash. This needs a device that has never used it.

## Permissions

```powershell
adb shell dumpsys package com.rachidbijigune.scannova | Select-String "android.permission.CAMERA"
```

Expected: no output, because the camera is used inside Google Play services.
