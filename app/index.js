import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '../src/components/AppText';
import { Button } from '../src/components/Button';
import { useTheme } from '../src/theme/ThemeProvider';

const LOGO_SIZE = 96;

export default function StartScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { spacing } = useTheme();

  return (
    <SafeAreaView style={styles.screen}>
      <View style={[styles.brand, { gap: spacing.sm, padding: spacing.lg }]}>
        <Image
          source={require('../assets/images/logo.png')}
          style={styles.logo}
          accessible={false}
        />
        <AppText accessibilityRole="header" variant="display" style={{ marginTop: spacing.sm }}>
          {t('app.name')}
        </AppText>
        <AppText color="textSecondary" style={styles.tagline} testID="tagline">
          {t('app.tagline')}
        </AppText>
      </View>
      {__DEV__ ? (
        <View style={{ padding: spacing.md, gap: spacing.sm }}>
          <Button
            label="Scanner proof (dev only)"
            variant="secondary"
            onPress={() => router.push('/dev/scanner')}
            testID="open-scanner-proof"
          />
          <Button
            label="Component gallery (dev only)"
            variant="secondary"
            onPress={() => router.push('/dev/components')}
            testID="open-gallery"
          />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  brand: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
  },
  tagline: {
    textAlign: 'center',
  },
});
