import { View } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';

export function Card({ style, ...props }) {
  const { colors, radius, spacing } = useTheme();
  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: radius.md,
          padding: spacing.md,
        },
        style,
      ]}
      {...props}
    />
  );
}
