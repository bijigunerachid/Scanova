# Scannova security and privacy

This page describes what is true of the code today. It is updated in the same step as any change that affects it.

## Current state (step 1.2)

- **Stored data:** only two preferences, appearance and language, in a local SQLite key-value store. Values are checked against an allowed list on both read and write.
- **Documents:** the app cannot store documents yet. The development-only scanner proof screen keeps the pages of its latest scan in the app's private cache. See [Temporary scan files](#temporary-scan-files).
- **Network:** the app code makes no network calls. Development builds connect to the Metro server on the local network. Google's ML Kit makes its own, as described in [Google ML Kit](#google-ml-kit).
- **Accounts and ads:** none.
- **Analytics:** Scannova adds none of its own, but ML Kit reports usage data to Google.
- **Camera on Android:** the app does not request the `CAMERA` permission. The scanner runs inside Google Play services and returns only the finished pages. Confirmed on a real phone.
- **Secrets:** the project has none, so it has no env files. Any future credentials must stay out of git, with a committed `.example` file and validation at startup.
- **Android backup:** `allowBackup` is off.
- **Android permissions:** `RECORD_AUDIO`, external storage and `SYSTEM_ALERT_WINDOW` are blocked in `app.json`. On a real phone, the development build also has `INTERNET`, `ACCESS_NETWORK_STATE`, `ACCESS_LOCAL_NETWORK`, `CHANGE_WIFI_MULTICAST_STATE`, `SYSTEM_ALERT_WINDOW` and `VIBRATE`.
- **`INTERNET` in release builds:** the generated main manifest includes `INTERNET`, so release builds would have it unless it is removed. Development builds need it to reach Metro. A release build has not been made yet. Step 7.2 must inspect the release manifest and remove any permission the app does not need.
- **Development screens:** `app/dev/components.js` holds sample content for checking components, and `app/dev/scanner.js` runs the real scanner. Both redirect to the start screen when `__DEV__` is false, and their entry buttons are only rendered in development. No release build has confirmed this yet.
- **Barcode scanner activity:** the debug manifest includes Google's code scanner through `expo-dev-launcher`, as a debug-only dependency. Step 7.2 must confirm it is absent from the release manifest.

## Temporary scan files

- Pages are written to `cache/scannova-tmp/scan-<id>/`, private to the app. Starting a new scan removes earlier ones, even if the new scan is then cancelled. They also remain until then, or until the OS clears the cache. The startup sweep in step 2.1 must remove leftovers.
- **ML Kit keeps its own copy of each page** in `cache/mlkit_docscan_ui_client/` and does not remove it. The module deletes that folder after every outcome. A real phone confirmed this for finished, cancelled and discarded scans. The folder name is undocumented, so `tests/manual/scanner-android.md` checks it again after each change.
- If the app is killed during a scan, that cleanup does not run. Step 2.1 must also sweep this folder at startup.

## Google ML Kit

Android scanning uses `play-services-mlkit-document-scanner`, which depends on Google's `datatransport` libraries.

- **What Google says it collects**, from its [ML Kit data disclosure](https://developers.google.com/ml-kit/android-data-disclosure) (last modified 2025-05-14): device model, OS and build, app package and version, identifiers, performance metrics, API configuration such as image format and resolution, input and output sizes, event types and error codes. The stated purpose is diagnostics and usage analytics.
- **Document content:** that page lists no image or document content. It has no specific entry for the document scanner, so this is Google's general statement and has not been measured for this feature.
- **Opting out:** the page describes no general way to turn this off.
- **Wording rule:** the app, privacy policy and store listing must not claim "no analytics" or "no data leaves the device" without describing this.
- **Before release (step 7.2):** test whether blocking `INTERNET` stops these reports and leaves the scanner working, then fill in Google Play's Data safety form from what is true of the release build.

Offline use works once the scanner has been downloaded. A real phone in airplane mode completed a scan.

## Known dependency advisories

Checked on 2026-11-07. `npm audit` reports 31 entries (30 moderate, 1 low), and `npm audit --omit=dev` reports 22 (21 moderate, 1 low). None is high or critical. They come from three root advisories, and the other entries are packages that depend on them:

- `glob` ([GHSA-3g3m-2fjr-6pw4](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4)), through Expo's command-line tooling and Jest
- `minimatch` ([GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249)), through the same tools
- `deepmerge` ([GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4)), through Jest

Jest appears in the `--omit=dev` count because `expo-router` lists `@testing-library/react-native` as a peer dependency.

**App bundle check:** the source map of the Android bundle (1,252 modules) contains no file from `glob`, `minimatch`, `deepmerge`, `jest` or `@expo/fingerprint`. Its one `@expo/cli` file is the module loader, `metro-require/require.js`. These advisories therefore affect development tools on the developer's machine, not the code in the app. The iOS bundle and release builds were not checked this way.

`npm audit fix --force` would replace Expo with an old major version (`expo@52.0.49` at this check), so it is not used. Re-check on each Expo update.

## Rules for later steps

- Scannova does not encrypt documents, and the app must not claim otherwise.
- Document contents are never sent to any service.
- Camera access is requested only when needed.
