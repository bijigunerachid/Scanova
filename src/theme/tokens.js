// Design tokens. docs/design-system.md explains how each one is used.

export const colors = {
  light: {
    primary: '#2563EB',
    primaryPressed: '#1D4ED8',
    onPrimary: '#FFFFFF',
    accent: '#2563EB',
    background: '#FFFFFF',
    backgroundSecondary: '#F8FAFC',
    surface: '#FFFFFF',
    textPrimary: '#0F172A',
    textSecondary: '#64748B',
    border: '#E2E8F0',
    success: '#16A34A',
    error: '#DC2626',
    scrim: 'rgba(15, 23, 42, 0.5)',
  },
  dark: {
    primary: '#2563EB',
    primaryPressed: '#1D4ED8',
    onPrimary: '#FFFFFF',
    accent: '#60A5FA',
    background: '#0F172A',
    backgroundSecondary: '#1E293B',
    surface: '#1E293B',
    textPrimary: '#F8FAFC',
    textSecondary: '#94A3B8',
    border: '#334155',
    success: '#22C55E',
    error: '#F87171',
    scrim: 'rgba(0, 0, 0, 0.6)',
  },
};

export const spacing = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, xxl: 48 };

export const radius = { sm: 8, md: 12, lg: 16, full: 999 };

export const touchTarget = 48;

export const iconSize = { row: 20, default: 24 };

export const fontFamilies = {
  regular: 'Inter_400Regular',
  semiBold: 'Inter_600SemiBold',
};

const typeScale = {
  display: { fontSize: 28, lineHeight: 36, weight: 'semiBold' },
  title: { fontSize: 22, lineHeight: 28, weight: 'semiBold' },
  heading: { fontSize: 17, lineHeight: 24, weight: 'semiBold' },
  body: { fontSize: 15, lineHeight: 22, weight: 'regular' },
  caption: { fontSize: 13, lineHeight: 18, weight: 'regular' },
  button: { fontSize: 15, lineHeight: 20, weight: 'semiBold' },
};

// Android cannot combine a custom font file with fontWeight, so each Inter
// weight is its own family. If Inter fails to load, the system font is used
// with a normal fontWeight, and the hierarchy still holds.
export function buildTypography(fontsLoaded) {
  const typography = {};
  for (const [name, { weight, ...metrics }] of Object.entries(typeScale)) {
    typography[name] = fontsLoaded
      ? { ...metrics, fontFamily: fontFamilies[weight] }
      : { ...metrics, fontWeight: weight === 'semiBold' ? '600' : '400' };
  }
  return typography;
}
