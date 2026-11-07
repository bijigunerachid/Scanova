# Scannova roadmap

**Status:** approved by the owner on 2026-11-06. Step 1.1 is merged. Step 1.2 passed its Android gate and awaits merge.

Related documents: [architecture](architecture.md) and [design system](design-system.md).

## Status of each phase

| Phase | Name                         | Status      |
| ----- | ---------------------------- | ----------- |
| 0     | Discovery                    | Done        |
| 1     | Foundation and scanner proof | In progress |
| 2     | Local storage                | Not started |
| 3     | Core screens                 | Not started |
| 4     | Scan flow                    | Not started |
| 5     | Editor                       | Not started |
| 6     | PDF and export               | Not started |
| 7     | Production readiness         | Not started |

## Technical risks

Ordered by how much damage each risk can do. "Checked" means it was read in package source or official docs during discovery. "To prove" means it can only be confirmed on a real build or device.

| #   | Risk                                                                                                                                  | Evidence                                                               | Response                                                                                                                                                                                                                                                                                        |
| --- | ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | No existing scanner wrapper fits a privacy-first app on React Native 0.88                                                             | Checked: see [the comparison](architecture.md#scanner-engine-decision) | Write a small local Expo module over the two official APIs. Prove it in step 1.2, before other work depends on it                                                                                                                                                                               |
| 2   | Android scanning is not fully offline on first use. Google Play services downloads the ML Kit scanner's models, logic and UI          | Checked: Google's docs. Partly measured in step 1.2                    | A real phone with the scanner already downloaded scanned in airplane mode. A download can be requested, but it never finished on the test emulator, so a real first-use download and airplane mode on a fresh install are still to prove. Show an honest state, and fall back to manual capture |
| 3   | ML Kit does not work everywhere. It needs Google Play services and 1.7 GB of RAM, so it fails on devices such as recent Huawei phones | Checked: Google's docs                                                 | Same manual capture fallback                                                                                                                                                                                                                                                                    |
| 4   | Native scanners own their whole screen and return only the flattened page. The raw photo and detected corners are not returned        | Checked: package source                                                | See [how the spec maps to native scanners](#how-the-spec-maps-to-native-scanners)                                                                                                                                                                                                               |
| 5   | iOS cannot be built or debugged on Windows. VisionKit scanning does not run in the simulator                                          | Well-known platform limit                                              | Build with EAS in the cloud and test on a physical iPhone. This needs an Apple Developer account                                                                                                                                                                                                |
| 6   | Skia may use too much memory on 12 MP images on mid-range Android phones                                                              | To prove                                                               | Measure at the start of Phase 5, and cap the working resolution if needed                                                                                                                                                                                                                       |
| 7   | `pdf-lib` holds the whole document in JavaScript memory and has had no release since 2021                                             | Checked: npm                                                           | Stress test 100 pages on a mid-range phone in Phase 6. If it fails, write a small streaming JPEG-to-PDF writer                                                                                                                                                                                  |
| 8   | App container paths change on iOS updates, which would break absolute file paths stored in the database                               | Well-known platform behaviour                                          | Store only relative paths in SQLite                                                                                                                                                                                                                                                             |
| 9   | Device backups may copy documents off the phone, which affects the privacy claims                                                     | Android setting is known. iOS exclusion to prove                       | Set `allowBackup: false` on Android. Check the iOS options in Phase 2 and describe the real behaviour in the privacy screen                                                                                                                                                                     |
| 10  | ML Kit reports usage data to Google, and keeps its own copy of each page in the app's cache                                           | Checked: Google's disclosure. Copy seen on a real phone                | The module removes the copy, and the wording rule is in [security](security.md#google-ml-kit). Test blocking `INTERNET` in step 7.2. If the reports cannot be stopped, the owner decides how to proceed                                                                                         |

## How the spec maps to native scanners

Some requirements change meaning once a native scanner is used. These are the honest outcomes.

| Spec item                                                                       | What Scannova will do                                                                                                                             |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Live preview, edge detection, four-corner correction, retake, multi-page, flash | Provided by VisionKit and ML Kit inside their own screens, which we cannot restyle                                                                |
| Front camera switching                                                          | Not offered on the scanner. The spec says "if appropriate", and the native scanners are built around the back camera                              |
| "Keep the original image"                                                       | For a native scan, the original is the page the scanner returned, already flattened. For a gallery import or manual capture, it is the full photo |
| Adjust boundaries after saving                                                  | Available in the editor for every page. On a native scan this is a second correction on the flattened page                                        |
| Filters                                                                         | Applied by Scannova, not ML Kit. The scanner runs in base mode so that its filters are never baked into the original                              |
| Automatic detection when unavailable                                            | Manual capture with `expo-camera`, then the corners are placed by hand. There is no decorative overlay that pretends to detect anything           |
| Gallery import                                                                  | Goes through the corner editor on both platforms, so behaviour is the same on each                                                                |

## Changes to the spec's plan

1. **Storage moves before the screens.** The spec builds the library UI in Phase 2 and storage in Phase 5, which would require fake data in between. The screens now read real data from the start.
2. **The scanner is proven first.** A real device build happens in step 1.2, not in Phase 3, because it is the largest risk.
3. **`pdf-lib` replaces `expo-print` for PDFs.** Expo documents that Android page margins from HTML depend on the WebView engine. `pdf-lib` embeds JPEG bytes unchanged at exact page sizes, and it can be tested in Node.
4. **`expo-secure-store` is dropped.** There are no secrets to store.
5. **`expo-sqlite/kv-store` replaces AsyncStorage.** It removes one dependency and gives synchronous reads for theme and language at startup. Confirmed on a real phone in step 1.1, where saved choices survive a full app restart.
6. **Auth, billing and background work do not apply.** There are no accounts and no payments. Recovery from interrupted scans covers the background work need.

## Phases and steps

Each step is one branch. The next step starts only after the previous branch is merged.

### Phase 0: Discovery

- `docs/roadmap`: this roadmap, the architecture and the design system.
- **Verified by:** reading package source and official docs. No app code exists yet.

### Phase 1: Foundation and scanner proof

- **1.1 `feature/foundation`:** Expo SDK 58 JavaScript project with exact versions, Expo Router, ESLint, Prettier, Jest, design tokens, light and dark themes, French and English, reusable UI components.
  - **Static checks and tests (2026-11-07):** ESLint with no problems, Prettier clean, 80 of 80 Jest tests passing, 6 deliberate code breaks each caught by tests, `expo-doctor` 20 of 20, JavaScript bundles for Android and iOS.
  - **Android build and devices (2026-11-07):** debug build for arm64 and x86_64. Run on the owner's Samsung Galaxy A30 (Android 11, about 411 wide) and a 1366 wide landscape tablet emulator (Android 16), with no JavaScript errors or app crashes logged.
  - **Driven by `adb` on the phone:** appearance and language switching, both surviving a full app restart, the `system` appearance following the phone, bottom sheet and dialog closing with Back, toast appearing and clearing, and the navigation bar icons in light and dark.
  - **Checked on the tablet:** start screen and gallery layout, dark theme and French. Buttons stretch across the whole width there. This is left for the tablet pass in step 7.1.
  - **Not verified:** the Maestro flow, because Maestro was not installed, so `tests/e2e/foundation.yaml` has never run. A 390 wide device, because the phone used is about 411 wide. Release builds and iOS.
- **1.2 `feature/scanner-proof`:** the local scanner module and a development build on the owner's Android phone.
  - **Gate result (2026-11-07): passed on Android.** A 3-page scan on the owner's Samsung Galaxy A30 returned 3 separate JPEG files (2773 × 3822, 2879 × 3893 and 2526 × 3351).
  - **Static checks and tests:** ESLint with no problems, Prettier clean, 109 of 109 Jest tests, 6 deliberate code breaks each caught by tests, `expo-doctor` 20 of 20, JavaScript bundles for Android and iOS, debug builds for arm64 and x86_64.
  - **On the phone:** scanned in airplane mode, cancelled with Close and with Back, discarded after capturing, two simultaneous taps opened one scanner, leaving with Home then reopening from the launcher did not get stuck, no app crashes logged, no `CAMERA` permission, and ML Kit's page copies removed after each outcome.
  - **On a fresh emulator:** the status was `download-required`, and the app did not block scanning, which opened and captured anyway. A requested download had not finished after 4 minutes. That emulator had no Google account and an old Play services version, so this may differ on real phones.
  - **Not verified:** a real first-use download, returning through the recent apps screen, the app being killed during a scan, release builds, a phone without Play services, and iOS, whose Swift code has not been compiled. Page order and upright, colour pages were not checked by a person against the paper. Turning the phone sideways during a scan was attempted, but whether the phone rotated was not confirmed. The development-only proof screen was seen only at about 411 wide, not at 390 or on the 1366 tablet, and its final "not downloaded yet" wording was not seen on a device. The Maestro flow from step 1.1 still has not run. Manual steps are in `tests/manual/scanner-android.md`.
- **Gate:** multi-page scanning returns real files on the Android phone. If this fails, the plan is reviewed before Phase 2, and the first alternative is `expo-document-scanner`.

### Phase 2: Local storage

- **2.1 `feature/storage`:** SQLite schema, migrations, repositories, private file store, cleanup of orphaned files including leftover scan caches, low-storage handling.
- **Verified by:** integration tests on a real SQLite engine, including a simulated failure partway through a save.

### Phase 3: Core screens

- **3.1 `feature/app-shell`:** splash, onboarding, tabs, home, empty states.
- **3.2 `feature/library`:** list, search, sort, rename, duplicate, delete, favourites, details, multi-select.
- **3.3 `feature/folders`:** create, rename, delete, move documents, folder contents.
- **3.4 `feature/settings`:** appearance, language, default page size and quality, storage usage, privacy, about.

### Phase 4: Scan flow

- **4.1 `feature/scan-flow`:** native scan through to a saved document, with recovery after an interrupted scan.
- **4.2 `feature/manual-capture`:** availability checks, `expo-camera` fallback, gallery import, four-corner editor.

### Phase 5: Editor

- **5.1 `feature/image-pipeline`:** the Skia memory measurement, then perspective correction, grayscale, black and white, enhanced, brightness and contrast.
- **5.2 `feature/editor`:** per-page crop, rotation, filters, reset and save, always reversible.
- **5.3 `feature/page-manager`:** reorder, delete, rotate, add page, rename.

### Phase 6: PDF and export

- **6.1 `feature/pdf-export`:** single and multi-page PDFs, A4 and original sizes, compression, sharing, cached output that is rebuilt after edits.
- **6.2 `feature/pdf-preview`:** `react-native-pdf` if it builds on this SDK, otherwise the system viewer.
- **6.3 `feature/backup-export`:** export everything to a ZIP, and clear messaging that uninstalling removes local documents. Restoring from a backup comes after the first release.

### Phase 7: Production readiness

- **7.1 `feature/quality`:** the device matrix, offline test, performance with 500 seeded documents, accessibility pass, tablet layout.
- **7.2 `feature/release`:** release builds, a check of the release manifest that removes unneeded permissions such as `INTERNET`, a test of the ML Kit reports with `INTERNET` blocked, French text for the iOS camera permission, app icon, store listings, privacy policy, name availability check.
- **7.3 `docs/handoff`:** `CONTRIBUTING.md`, a "What's next" section with launch and development tracks, and a local `CLAUDE.md` that is never committed.

## How each step is checked

- **Static checks:** ESLint, Prettier, `expo-doctor`, `npm audit`.
- **Unit tests:** Jest with `jest-expo`, for logic such as corner geometry and PDF layout.
- **Integration tests:** the repository SQL runs against a real SQLite engine in Node through `node:sqlite`, and real files are written to a temporary folder.
- **End-to-end tests:** Maestro on an Android device or emulator. It has not been run on Windows yet, so this is still to be confirmed.
- **PDF tests:** generated files are reopened with a separate PDF parser.
- **Screenshots:** a phone about 390 wide and a 1366 wide landscape tablet. This app has no desktop version, so the tablet stands in for the 1366 check. The owner's phone is about 411 wide, and results state the width actually used.

**Testing limits, stated plainly:**

- The native scanner screens belong to Apple and Google, so Maestro cannot reliably drive them. Those flows use a written device checklist, run by hand on real phones.
- End-to-end tests enter documents through the gallery import path instead.
- iOS end-to-end tests cannot run on Windows. iOS is checked by hand on an iPhone, using EAS builds.

## Owner decisions

Agreed with the owner:

1. This roadmap is approved, including the local scanner module.
2. Testing uses a physical Android phone.
3. iOS testing is not available now, so Android goes first. iOS code is still written, but it stays unverified until an iPhone and a paid Apple Developer account are available. iOS must be verified before an iOS release, and the 1.2 gate covers Android only.
4. The app identifier is `com.rachidbijigune.scannova`.
5. UI screenshots use a 390 wide phone and a 1366 wide landscape tablet.
