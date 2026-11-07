import { Image } from 'expo-image';
import { Redirect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '../../src/components/AppText';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { EmptyState } from '../../src/components/EmptyState';
import { ErrorState } from '../../src/components/ErrorState';
import { IconButton } from '../../src/components/IconButton';
import { AVAILABILITY } from '../../src/features/scanner/scanner';
import { PHASES, useScanner } from '../../src/features/scanner/useScanner';
import { useTheme } from '../../src/theme/ThemeProvider';

const MAX_PREVIEW_WIDTH = 480;

const AVAILABILITY_TEXT = {
  [AVAILABILITY.READY]: 'The scanner is ready on this device.',
  [AVAILABILITY.DOWNLOAD_REQUIRED]:
    'Google Play services reports that parts of the scanner are not downloaded yet. Scanning may still work.',
  [AVAILABILITY.UNAVAILABLE]: 'The scanner is not available on this device.',
};

function formatMegabytes(bytes) {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// Development-only screen that proves the native scanner returns real files. The
// real scan flow arrives in step 4.1, so this never reaches a release build.
export default function ScannerProof() {
  const router = useRouter();
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const { phase, availability, pages, cancelled, errorCode, refresh, prepare, scan } = useScanner();

  if (!__DEV__) {
    return <Redirect href="/" />;
  }

  const busy = phase !== PHASES.IDLE;
  const status = availability?.status;

  return (
    <SafeAreaView style={styles.screen}>
      <View style={[styles.header, { paddingHorizontal: spacing.sm }]}>
        <IconButton icon="arrow-left" label={t('common.close')} onPress={() => router.back()} />
        <AppText accessibilityRole="header" variant="title">
          Scanner proof
        </AppText>
      </View>
      <ScrollView contentContainerStyle={{ padding: spacing.md, gap: spacing.md }}>
        <Card>
          <AppText testID="scanner-availability">
            {status ? AVAILABILITY_TEXT[status] : t('common.loading')}
          </AppText>
          {availability?.reason ? (
            <AppText color="textSecondary" testID="scanner-reason" variant="caption">
              {availability.reason}
            </AppText>
          ) : null}
        </Card>

        {status === AVAILABILITY.DOWNLOAD_REQUIRED ? (
          <Button
            label="Download scanner"
            variant="secondary"
            icon="download"
            loading={phase === PHASES.PREPARING}
            disabled={busy}
            onPress={prepare}
            testID="scanner-prepare"
          />
        ) : null}
        {status && status !== AVAILABILITY.READY ? (
          <Button
            label="Check again"
            variant="secondary"
            loading={phase === PHASES.CHECKING}
            disabled={busy}
            onPress={refresh}
            testID="scanner-refresh"
          />
        ) : null}
        <Button
          label="Scan"
          icon="camera"
          loading={phase === PHASES.SCANNING}
          disabled={busy || status === AVAILABILITY.UNAVAILABLE}
          onPress={scan}
          testID="scanner-scan"
        />

        {errorCode ? (
          <Card>
            <ErrorState
              title={t('errors.unexpectedTitle')}
              message={`Scanner error: ${errorCode}`}
              onRetry={scan}
            />
          </Card>
        ) : null}

        {pages.length === 0 && !errorCode ? (
          <Card>
            <EmptyState
              icon="file-text"
              message={cancelled ? 'The scan was cancelled. No pages were kept.' : 'No pages yet.'}
            />
          </Card>
        ) : null}

        {pages.map((page, index) => (
          <View key={page.uri} style={[styles.page, { gap: spacing.xs }]} testID="scanner-page">
            <Image
              accessibilityLabel={`Page ${index + 1}`}
              cachePolicy="none"
              contentFit="contain"
              source={{ uri: page.uri }}
              style={[styles.preview, { aspectRatio: page.width / page.height }]}
            />
            <AppText color="textSecondary" variant="caption">
              {`Page ${index + 1}: ${page.width} × ${page.height}, ${formatMegabytes(page.size)}`}
            </AppText>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  page: {
    width: '100%',
    maxWidth: MAX_PREVIEW_WIDTH,
    alignSelf: 'center',
  },
  preview: {
    width: '100%',
  },
});
