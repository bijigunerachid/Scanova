import { render } from '@testing-library/react-native';

import { SystemBars } from '../../src/components/SystemBars';
import { createPreferences } from '../../src/services/preferences';
import { ThemeProvider } from '../../src/theme/ThemeProvider';

const mockStatusBar = jest.fn(() => null);
const mockNavigationBar = jest.fn(() => null);

jest.mock('expo-status-bar', () => ({
  StatusBar: (props) => mockStatusBar(props),
}));

jest.mock('expo-navigation-bar', () => ({
  NavigationBar: (props) => mockNavigationBar(props),
}));

function preferencesWith(appearance) {
  const values = new Map([['preferences.appearance', appearance]]);
  return createPreferences({
    getItemSync: (key) => values.get(key) ?? null,
    setItemSync: (key, value) => values.set(key, value),
  });
}

async function renderBars(appearance) {
  await render(
    <ThemeProvider preferences={preferencesWith(appearance)}>
      <SystemBars />
    </ThemeProvider>,
  );
}

describe('SystemBars', () => {
  beforeEach(() => {
    mockStatusBar.mockClear();
    mockNavigationBar.mockClear();
  });

  it('uses dark icons on both system bars in the light theme', async () => {
    await renderBars('light');
    expect(mockStatusBar).toHaveBeenLastCalledWith({ style: 'dark' });
    expect(mockNavigationBar).toHaveBeenLastCalledWith({ style: 'dark' });
  });

  it('uses light icons on both system bars in the dark theme', async () => {
    await renderBars('dark');
    expect(mockStatusBar).toHaveBeenLastCalledWith({ style: 'light' });
    expect(mockNavigationBar).toHaveBeenLastCalledWith({ style: 'light' });
  });
});
