import { useFonts } from 'expo-font';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as SystemUI from 'expo-system-ui';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { ErrorState } from '../src/components/ErrorState';
import { SystemBars } from '../src/components/SystemBars';
import { ToastProvider } from '../src/components/Toast';
import '../src/localization';
import { ThemeProvider, useTheme } from '../src/theme/ThemeProvider';

SplashScreen.preventAutoHideAsync().catch(() => {});

function AppNavigator() {
  const { colors } = useTheme();

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colors.background).catch(() => {});
  }, [colors.background]);

  return (
    <>
      <SystemBars />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ Inter_400Regular, Inter_600SemiBold });
  const ready = fontsLoaded || Boolean(fontError);

  useEffect(() => {
    if (ready) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [ready]);

  if (!ready) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider fontsLoaded={fontsLoaded}>
        <ToastProvider>
          <AppNavigator />
        </ToastProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function ErrorScreen({ retry }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.background }}>
      <ErrorState
        title={t('errors.unexpectedTitle')}
        message={t('errors.unexpectedMessage')}
        onRetry={retry}
      />
    </SafeAreaView>
  );
}

// Expo Router renders this outside RootLayout, so it needs its own providers.
export function ErrorBoundary({ retry }) {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider fontsLoaded={false}>
        <ErrorScreen retry={retry} />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
