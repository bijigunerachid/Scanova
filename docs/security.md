# Scannova security and privacy

This page describes what is true of the code today. It is updated in the same step as any change that affects it.

## Current state (step 1.1)

- **Stored data:** only two preferences, appearance and language, in a local SQLite key-value store. Values are checked against an allowed list on both read and write.
- **Documents:** the app cannot create or store documents yet.
- **Network:** the app code makes no network calls. Development builds connect to the Metro server on the local network.
- **Accounts, analytics and ads:** none.
- **Secrets:** the project has none, so it has no env files. Any future credentials must stay out of git, with a committed `.example` file and validation at startup.
- **Android backup:** `allowBackup` is off.
- **Android permissions:** `RECORD_AUDIO`, external storage and `SYSTEM_ALERT_WINDOW` are blocked in `app.json`. On a real phone, the development build also has `INTERNET`, `ACCESS_NETWORK_STATE`, `ACCESS_LOCAL_NETWORK`, `CHANGE_WIFI_MULTICAST_STATE`, `SYSTEM_ALERT_WINDOW` and `VIBRATE`.
- **`INTERNET` in release builds:** the generated main manifest includes `INTERNET`, so release builds would have it unless it is removed. Development builds need it to reach Metro. A release build has not been made yet. Step 7.2 must inspect the release manifest and remove any permission the app does not need.
- **Development screens:** `app/dev/components.js` holds sample content for checking components. It redirects to the start screen when `__DEV__` is false, and its entry button is only rendered in development.

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
