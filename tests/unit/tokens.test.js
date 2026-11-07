import { buildTypography, colors, fontFamilies, radius, spacing } from '../../src/theme/tokens';

function luminance(hex) {
  const [r, g, b] = [1, 3, 5]
    .map((start) => parseInt(hex.slice(start, start + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(first, second) {
  const [lighter, darker] = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (lighter + 0.05) / (darker + 0.05);
}

const TEXT_AA = 4.5;
const ICON_AA = 3;

describe.each(['light', 'dark'])('%s theme contrast', (scheme) => {
  const palette = colors[scheme];

  it.each([
    ['onPrimary', 'primary'],
    ['onPrimary', 'primaryPressed'],
    ['textPrimary', 'background'],
    ['textPrimary', 'surface'],
    ['textPrimary', 'backgroundSecondary'],
    ['textSecondary', 'background'],
    ['textSecondary', 'surface'],
    ['textSecondary', 'backgroundSecondary'],
    ['accent', 'background'],
    ['accent', 'surface'],
    ['error', 'surface'],
    ['background', 'textPrimary'],
  ])('%s on %s meets AA for text', (foreground, background) => {
    expect(contrast(palette[foreground], palette[background])).toBeGreaterThanOrEqual(TEXT_AA);
  });

  it.each([
    ['success', 'surface'],
    ['accent', 'backgroundSecondary'],
  ])('%s on %s meets AA for icons', (foreground, background) => {
    expect(contrast(palette[foreground], palette[background])).toBeGreaterThanOrEqual(ICON_AA);
  });
});

describe('tokens', () => {
  it('defines the same colours in both themes', () => {
    expect(Object.keys(colors.dark).sort()).toEqual(Object.keys(colors.light).sort());
  });

  it('keeps the exact brand colours from the product spec', () => {
    expect(colors.light).toMatchObject({
      primary: '#2563EB',
      primaryPressed: '#1D4ED8',
      background: '#FFFFFF',
      backgroundSecondary: '#F8FAFC',
      surface: '#FFFFFF',
      textPrimary: '#0F172A',
      textSecondary: '#64748B',
      border: '#E2E8F0',
      success: '#16A34A',
      error: '#DC2626',
    });
  });

  it('uses the 8-point spacing system, with 4 for tight pairs', () => {
    for (const value of Object.values(spacing)) {
      expect(value % 4).toBe(0);
    }
    expect(spacing.xs).toBe(4);
    expect(spacing.sm).toBe(8);
  });

  it('defines the radius scale', () => {
    expect(radius).toEqual({ sm: 8, md: 12, lg: 16, full: 999 });
  });
});

describe('buildTypography', () => {
  it('uses one Inter family per weight, without fontWeight, when fonts load', () => {
    const type = buildTypography(true);
    expect(type.title.fontFamily).toBe(fontFamilies.semiBold);
    expect(type.body.fontFamily).toBe(fontFamilies.regular);
    expect(type.title.fontWeight).toBeUndefined();
  });

  it('falls back to the system font with a real weight when fonts fail', () => {
    const type = buildTypography(false);
    expect(type.title.fontFamily).toBeUndefined();
    expect(type.title.fontWeight).toBe('600');
    expect(type.body.fontWeight).toBe('400');
  });
});
