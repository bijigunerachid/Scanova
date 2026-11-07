import { NavigationBar } from 'expo-navigation-bar';
import { StatusBar } from 'expo-status-bar';

import { useTheme } from '../theme/ThemeProvider';

// Both styles name the icon colour, so a dark theme needs "light". The type
// comments in expo-navigation-bar 58.0.4 say the reverse, but its native code
// and a real phone confirm this. "auto" is not used because it follows the
// phone's setting, not the appearance chosen in the app.
export function SystemBars() {
  const { scheme } = useTheme();
  const iconStyle = scheme === 'dark' ? 'light' : 'dark';

  return (
    <>
      <StatusBar style={iconStyle} />
      <NavigationBar style={iconStyle} />
    </>
  );
}
