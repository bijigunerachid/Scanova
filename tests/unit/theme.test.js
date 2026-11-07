import { fireEvent, render, screen } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';

import { createPreferences } from '../../src/services/preferences';
import { resolveScheme, ThemeProvider, useTheme } from '../../src/theme/ThemeProvider';
import { colors } from '../../src/theme/tokens';

function memoryPreferences(initialAppearance) {
  const values = new Map();
  if (initialAppearance) values.set('preferences.appearance', initialAppearance);
  return createPreferences({
    getItemSync: (key) => values.get(key) ?? null,
    setItemSync: (key, value) => values.set(key, value),
  });
}

function Probe() {
  const theme = useTheme();
  return (
    <Pressable accessibilityRole="button" onPress={() => theme.setAppearance('dark')}>
      <Text testID="background">{theme.colors.background}</Text>
      <Text testID="appearance">{theme.appearance}</Text>
    </Pressable>
  );
}

describe('resolveScheme', () => {
  it('uses an explicit appearance over the system', () => {
    expect(resolveScheme('dark', 'light')).toBe('dark');
    expect(resolveScheme('light', 'dark')).toBe('light');
  });

  it('follows the system for the system appearance', () => {
    expect(resolveScheme('system', 'dark')).toBe('dark');
    expect(resolveScheme('system', 'light')).toBe('light');
  });

  it('defaults to light when the system reports nothing', () => {
    expect(resolveScheme('system', null)).toBe('light');
    expect(resolveScheme('system', 'unspecified')).toBe('light');
  });
});

describe('ThemeProvider', () => {
  it('starts from the saved appearance', async () => {
    await render(
      <ThemeProvider preferences={memoryPreferences('dark')}>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('background')).toHaveTextContent(colors.dark.background);
  });

  it('switches theme and saves the choice', async () => {
    const preferences = memoryPreferences('light');
    await render(
      <ThemeProvider preferences={preferences}>
        <Probe />
      </ThemeProvider>,
    );
    expect(screen.getByTestId('background')).toHaveTextContent(colors.light.background);

    await fireEvent.press(screen.getByRole('button'));

    expect(screen.getByTestId('background')).toHaveTextContent(colors.dark.background);
    expect(preferences.getAppearance()).toBe('dark');
  });

  it('throws a clear error when used without the provider', async () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    await expect(render(<Probe />)).rejects.toThrow('useTheme must be used inside ThemeProvider');
    spy.mockRestore();
  });
});
