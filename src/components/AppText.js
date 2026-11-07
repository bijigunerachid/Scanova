import { Text } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';

export function AppText({ variant = 'body', color = 'textPrimary', style, ...props }) {
  const { colors, typography } = useTheme();
  return <Text style={[typography[variant], { color: colors[color] }, style]} {...props} />;
}
