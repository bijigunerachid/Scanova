# Scannova architecture

**Status:** proposed on 2026-11-06, with versions read from npm and Expo's SDK 58 version list on that date. Packages not yet needed by a finished step are still only planned, and `package.json` shows what is installed. The scanner module was proven on a real Android phone in step 1.2.

## Platform baseline

| Item         | Choice                                 | Note                                                                                                        |
| ------------ | -------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Expo SDK     | 58 (`expo` 58.0.23)                    | Current stable release                                                                                      |
| React Native | 0.88.1, React 19.3.0                   | Requires Node `^22.13`, `^24.3` or `>=26`. This machine has 24.22.1                                         |
| Android      | minSdk 24, targetSdk 36, compileSdk 37 | From React Native 0.88's version file                                                                       |
| Language     | JavaScript for the app                 | The scanner module needs a little Kotlin and Swift, because the OS APIs are only reachable from native code |
| Build        | Expo development builds                | Expo Go cannot load custom native code                                                                      |

## Scanner engine decision

**Decision:** write a small local Expo module, `modules/scannova-scanner`, that calls Apple's `VNDocumentCameraViewController` and Google's ML Kit `GmsDocumentScanner` directly.

Every package below was checked by reading its published source.

| Option                                                   | Findings                                                                                                                                                                                                                                                                                                                       | Verdict                                           |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------- |
| `react-native-document-scanner-plugin` 2.0.4             | Most used (about 494k downloads a month). Android mode is hardcoded to `SCANNER_MODE_FULL`, so filters can be baked into the original. No gallery option. Last push January 2026. Open issues report an iOS crash on a zero-page scan and an Android Gradle plugin problem, and React Native 0.88 uses Android Gradle plugin 9 | Rejected                                          |
| `@dariyd/react-native-document-scanner` 2.2.0            | Actively maintained, and the mode is configurable. But its Android manifest declares fine and coarse location permissions and it bundles `play-services-location`. No Expo config plugin                                                                                                                                       | Rejected: conflicts with the privacy requirements |
| `expo-document-scanner` 1.0.0                            | Clean permissions, and the mode is configurable. Needs Nitro Modules as an extra dependency. About 4k downloads a month                                                                                                                                                                                                        | Backup choice                                     |
| `@infinitered/react-native-mlkit-document-scanner` 5.0.0 | Android only                                                                                                                                                                                                                                                                                                                   | Rejected                                          |
| Commercial SDKs such as Scanbot                          | Paid, and contrary to the free initial business model                                                                                                                                                                                                                                                                          | Rejected                                          |
| OpenCV (`react-native-fast-opencv`)                      | Would mean building and maintaining our own detection and camera experience                                                                                                                                                                                                                                                    | Rejected for detection                            |

**Why the local module wins:**

- It runs ML Kit in base mode, so originals stay unfiltered.
- It adds only the camera permission, with no location code.
- It writes each page straight to a file instead of passing base64 through JavaScript.
- It handles cancelled scans and zero-page scans explicitly.
- It can report availability to the app, which is what triggers the manual fallback.

**The cost:** we own a little native code, and on Windows the iOS side can only be compiled through EAS. Both underlying APIs are small and officially supported, and the module sits behind one JavaScript interface. Switching to `expo-document-scanner` later would touch only `src/features/scanner`.

### Scanner interface

`src/features/scanner/scanner.js` is the only code that calls the native module. It checks everything the module returns.

| Function                 | Result                                                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `getScannerAvailability` | `ready`, `download-required` or `unavailable`, with a reason. A failed check counts as unavailable            |
| `prepareScanner`         | Asks Google Play services to download the scanner. It only starts the download, so check availability after   |
| `scanDocument`           | `{ status: 'cancelled' }` or `{ status: 'completed', pages }`, where a page is `{ uri, width, height, size }` |

A failure throws `ScannerError` with the code `unavailable`, `not-ready`, `in-progress`, `invalid-result` or `failed`. `useScanner` adds screen state and allows only one action at a time.

**Learned on a real phone (step 1.2):**

- ML Kit's `GmsDocumentScanner` extends `OptionalModuleApi`, so `ModuleInstall` can check for the scanner and request it ahead of time.
- ML Kit leaves a copy of every page in the app's cache, and the module removes it. See [security](security.md#temporary-scan-files).
- Sizes vary per page, because the scanner crops each one, so width and height are stored per page.
- `download-required` does not mean scanning is blocked. On a fresh emulator, `areModulesAvailable` stayed false, yet the scanner opened and captured. The app must therefore not disable scanning on this status.

**Not tested:** if the app process is killed while the scanner is open, the result is expected to be lost. Step 4.1 must cover this as part of interrupted scan recovery.

## Other dependencies

All versions are pinned exactly, and only these are planned.

| Need                   | Package                                                                                               | Reason                                                                                                                                             |
| ---------------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Navigation             | `expo-router` 58.0.30                                                                                 | Required by the spec                                                                                                                               |
| Metadata               | `expo-sqlite` 58.0.15                                                                                 | Required by the spec                                                                                                                               |
| Files                  | `expo-file-system` 58.0.13                                                                            | Required by the spec                                                                                                                               |
| Image processing       | `@shopify/react-native-skia` 2.14.0                                                                   | GPU shaders can do perspective warps and thresholding, and it is on Expo's version list. `expo-image-manipulator` can only crop, rotate and resize |
| Gestures and animation | `react-native-gesture-handler` 3.5.0, `react-native-reanimated` 4.7.1, `react-native-worklets` 0.13.1 | Corner dragging and page reorder. Skia also requires the last two. Currently installed through `expo-router` and fixed by the lockfile             |
| System bars            | `expo-navigation-bar` 58.0.4, `expo-status-bar`                                                       | Keeps Android's system icons readable when the appearance chosen in the app differs from the phone's setting                                       |
| Lists                  | `@shopify/flash-list` 2.3.2                                                                           | Stays smooth with hundreds of documents                                                                                                            |
| Thumbnails             | `expo-image` 58.0.18                                                                                  | Downsampling and caching                                                                                                                           |
| Manual capture         | `expo-camera` 58.0.14, with audio recording disabled                                                  | Fallback only                                                                                                                                      |
| Gallery import         | `expo-image-picker` 58.0.10                                                                           | Required by the spec                                                                                                                               |
| PDF                    | `pdf-lib` 1.17.1                                                                                      | Embeds JPEG bytes unchanged, at exact page sizes                                                                                                   |
| PDF preview            | `react-native-pdf` 7.0.5                                                                              | To prove in step 6.2                                                                                                                               |
| Sharing                | `expo-sharing` 58.0.22                                                                                | Required by the spec                                                                                                                               |
| Language               | `i18next` 26.7.2, `react-i18next` 17.1.13, `expo-localization` 58.0.5                                 | Handles plurals, including Arabic rules later                                                                                                      |
| Icons and font         | `@expo/vector-icons` 15.x, `@expo-google-fonts/inter` 0.4.2                                           | Line icons and Inter                                                                                                                               |
| End-to-end tests       | Maestro, installed outside the app                                                                    | No app dependency                                                                                                                                  |

## Folder structure

```
scannova/
  app/                     Expo Router screens, kept thin
    (tabs)/                home, documents, folders, settings
    onboarding.js
    scan/                  native launch, manual capture, corner editor
    document/[id]/         pages, editor, PDF preview
    folder/[id].js
  modules/scannova-scanner/  Local Expo module (Kotlin and Swift)
  src/
    components/            Shared UI components
    features/
      scanner/             One interface, with native and manual engines
      editor/              Editor state and geometry
      documents/           Library logic and hooks
      folders/
      export/              PDF and backup
    database/              Connection, migrations, repositories
    services/              fileStore, imagePipeline, pdfBuilder
    hooks/
    theme/                 Design tokens
    localization/          en.json, fr.json
    utils/
    constants/
  tests/                   integration/ and e2e/ (Maestro flows)
  scripts/                 Demo data seed, the only source of demo data
```

**Layer rule:** screens call feature hooks, and hooks call services and repositories. Screens never run SQL or touch files directly. Only `src/database` contains SQL.

## Data model

The spec's tables are kept. The additions are marked below, and each one has a job.

```sql
CREATE TABLE folders (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at INTEGER NOT NULL
);

CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  title_search TEXT NOT NULL,          -- added: see "Search" below
  status TEXT NOT NULL DEFAULT 'draft', -- added: 'draft' or 'ready', for interrupted scans
  folder_id TEXT REFERENCES folders(id) ON DELETE SET NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  page_count INTEGER NOT NULL DEFAULT 0,
  thumbnail_path TEXT,
  pdf_path TEXT,                       -- cleared whenever a page changes
  file_size INTEGER NOT NULL DEFAULT 0,
  is_favorite INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE pages (
  id TEXT PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  original_image_path TEXT NOT NULL,
  processed_image_path TEXT,           -- NULL means the original is used unchanged
  page_order INTEGER NOT NULL,
  filter_type TEXT NOT NULL DEFAULT 'original',
  rotation INTEGER NOT NULL DEFAULT 0,
  crop_quad TEXT,                      -- added: four corners as JSON, so a crop can be re-edited
  brightness REAL NOT NULL DEFAULT 0,  -- added: spec feature with no column
  contrast REAL NOT NULL DEFAULT 0,    -- added: spec feature with no column
  width INTEGER NOT NULL,              -- added: needed for original page size PDFs
  height INTEGER NOT NULL,             -- added: same
  created_at INTEGER NOT NULL
);

CREATE INDEX idx_documents_updated ON documents(status, updated_at DESC);
CREATE INDEX idx_documents_title ON documents(status, title_search);
CREATE INDEX idx_documents_folder ON documents(folder_id, updated_at DESC);
CREATE INDEX idx_documents_favorite ON documents(is_favorite, updated_at DESC);
CREATE INDEX idx_pages_document ON pages(document_id, page_order);
```

- **Search:** SQLite's `NOCASE` only folds ASCII, so "Résumé" would not match "resume". `title_search` stores the lowercased title without accents, which matters for French.
- **Reversible edits:** the original file is never changed. An edit stores its parameters and writes a new processed file, and reset clears both.
- **Deleting a folder** keeps its documents and moves them out of the folder.
- **Migrations** use `PRAGMA user_version`, and each runs in a transaction. Foreign keys are switched on for every connection, and WAL mode is on.

## File storage

```
<app documents>/scannova-data/
  originals/<pageId>.jpg
  processed/<pageId>-<editId>.jpg
  thumbnails/<documentId>-<editId>.jpg
  exports/<documentId>.pdf
<app cache>/scannova-tmp/       Removed at startup
```

- **Relative paths only** are stored in SQLite, because the iOS container path can change between updates.
- **Save order:** write the files, commit the transaction, then delete anything replaced. A crash can leave an extra file but never a database row pointing at nothing.
- **Startup sweep:** removes files with no database row and recovers draft documents, offering to keep or discard them.
- **Missing files:** show a clear per-page error state, never a crash.
- **Low storage:** check free space before a scan or export, and report failures in plain language.

## Image pipeline

Everything runs on the device with Skia, using offscreen surfaces:

1. Load the original.
2. Warp it using a homography computed from `crop_quad`. The geometry is plain JavaScript and is unit tested.
3. Apply rotation, then the filter.
4. Encode to JPEG and write the file.

| Filter                  | Method                                                                                      |
| ----------------------- | ------------------------------------------------------------------------------------------- |
| Grayscale               | Luminance colour matrix                                                                     |
| Black and white         | Adaptive threshold shader, which copes with uneven lighting better than one fixed threshold |
| Enhanced                | Background normalisation plus contrast shader                                               |
| Brightness and contrast | Colour matrix                                                                               |

Previews use a downscaled copy, and full resolution is only processed on save. The memory limits are measured at the start of Phase 5.

Saved images are re-encoded, which also strips EXIF data such as GPS location from gallery imports. Orientation is applied to the pixels first.

## PDF

`pdfBuilder` reads each page's JPEG and embeds it unchanged. A4 pages fit and centre the image. Original-size pages match the image's dimensions at a stated DPI. The result goes to a temporary file and moves to `exports/` only when complete, so a failed export never replaces a good PDF.

## Privacy and security

- No account, analytics, ads or network calls in the app code.
- Scanning and processing happen on the device. On Android, Google Play services may download the scanner module itself, and that download contains no document content.
- Permissions: camera only. The Android photo picker needs no storage permission, and any unneeded permission is blocked in `app.json`, including `RECORD_AUDIO`.
- Android `allowBackup` is off. The iOS backup behaviour is checked in Phase 2 and described accurately in the app.
- **Documents are not encrypted by Scannova.** They rely on the OS app sandbox and device encryption, and the app must never claim otherwise.
- The project needs no secrets. If EAS or store credentials are added later, they stay out of git, with committed `.example` files and validation.
