# Scannova

**Scan. Refine. Preserve.**

Scannova is an offline document scanner for Android and iOS. It needs no account, and documents stay on the device.

**Current state:** step 1.2 of the [roadmap](docs/roadmap.md). The foundation and a native scanner module exist, but document storage and the real scan flow do not yet. The app opens to a branded start screen, and development builds also include a component gallery and a scanner proof screen.

## Requirements

- Node `^22.13` or `^24.3`
- JDK 17
- Android SDK, with `ANDROID_HOME` set
- An Android phone with USB debugging, or an emulator

iOS builds need a Mac or EAS Build, and have not been run yet.

## Run the app

Expo Go is not used, because the scanner needs custom native code.

```powershell
npm ci
npm run android
```

The first Android build downloads several gigabytes and can take a long time. The phone and emulator builds in step 1.1 took about 7 to 8 minutes each on a 4-core laptop, after the downloads. Close other apps first if your computer has 16 GB of RAM or less.

### Windows setup

Android's C++ build fails with `Filename longer than 260 characters` unless both of these are done, as described in [Expo's guide](https://docs.expo.dev/troubleshooting/windows-long-paths/):

1. Turn on Windows long paths. `LongPathsEnabled` must be `1` in `HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem`.
2. Install CMake 3.31.6 and select it for your user. This is a per-computer setting, so it stays out of the repository.

```powershell
& "$env:LOCALAPPDATA\Android\Sdk\cmdline-tools\latest\bin\sdkmanager.bat" --install "cmake;3.31.6"
Add-Content "$env:USERPROFILE\.gradle\gradle.properties" "android.cmakeVersion=3.31.6"
```

After changing this, delete `android/app/.cxx` and `android/app/build` before building again.

### Emulator

If the emulator closes during startup on Intel integrated graphics, start it with software graphics:

```powershell
& "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe" -avd <name> -gpu swiftshader_indirect -no-snapshot
```

## Checks

| Command                | What it does                             |
| ---------------------- | ---------------------------------------- |
| `npm run check`        | ESLint, Prettier check and Jest together |
| `npm run lint`         | ESLint                                   |
| `npm run format:check` | Prettier check                           |
| `npm test`             | Unit and component tests                 |
| `npm run doctor`       | Expo project checks                      |
| `npm audit`            | Dependency vulnerabilities               |

The end-to-end flow is `tests/e2e/foundation.yaml`. It needs [Maestro](https://docs.maestro.dev) and a development build on a connected device:

```powershell
maestro test tests/e2e/foundation.yaml
```

The native scanner screens belong to Apple and Google, so they are checked by hand with [the Android scanner checklist](tests/manual/scanner-android.md).

## Project layout

- `app/`: screens, using Expo Router file-based routes
- `modules/scannova-scanner/`: local native module over ML Kit and VisionKit
- `src/components/`: shared UI
- `src/features/scanner/`: the scanner interface and its screen state
- `src/theme/`: design tokens and light and dark themes
- `src/localization/`: English and French
- `src/services/`: non-UI services, currently preferences
- `tests/`: unit, component, end-to-end and manual tests
- `scripts/`: tooling, currently the brand asset generator

To regenerate the icons and logo, run `powershell -File scripts/generate-brand-assets.ps1`.

## Documentation

- [Roadmap](docs/roadmap.md)
- [Architecture](docs/architecture.md)
- [Design system](docs/design-system.md)
- [Security and privacy](docs/security.md)
