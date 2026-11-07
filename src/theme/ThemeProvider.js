import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

import { appPreferences } from '../services/appPreferences';
import { buildTypography, colors, iconSize, radius, spacing, touchTarget } from './tokens';

const ThemeContext = createContext(null);

export function resolveScheme(appearance, systemScheme) {
  if (appearance === 'light' || appearance === 'dark') {
    return appearance;
  }
  return systemScheme === 'dark' ? 'dark' : 'light';
}

export function ThemeProvider({ children, fontsLoaded = true, preferences = appPreferences }) {
  const systemScheme = useColorScheme();
  const [appearance, setAppearanceState] = useState(() => preferences.getAppearance());

  const setAppearance = useCallback(
    (value) => {
      preferences.setAppearance(value);
      setAppearanceState(value);
    },
    [preferences],
  );

  const value = useMemo(() => {
    const scheme = resolveScheme(appearance, systemScheme);
    return {
      appearance,
      setAppearance,
      scheme,
      colors: colors[scheme],
      typography: buildTypography(fontsLoaded),
      spacing,
      radius,
      iconSize,
      touchTarget,
    };
  }, [appearance, setAppearance, systemScheme, fontsLoaded]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useTheme must be used inside ThemeProvider');
  }
  return theme;
}
