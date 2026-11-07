import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';

import { useTheme } from '../theme/ThemeProvider';
import { AppText } from './AppText';

function variantColors(variant, colors, pressed) {
  if (variant === 'primary') {
    return {
      backgroundColor: pressed ? colors.primaryPressed : colors.primary,
      borderColor: pressed ? colors.primaryPressed : colors.primary,
      foreground: 'onPrimary',
    };
  }
  return {
    backgroundColor: pressed ? colors.backgroundSecondary : colors.surface,
    borderColor: colors.border,
    foreground: variant === 'destructive' ? 'error' : 'textPrimary',
  };
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  testID,
}) {
  const { colors, radius, spacing, touchTarget, iconSize } = useTheme();
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => {
        const palette = variantColors(variant, colors, pressed);
        return [
          styles.base,
          {
            minHeight: touchTarget,
            borderRadius: radius.md,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            backgroundColor: palette.backgroundColor,
            borderColor: palette.borderColor,
            opacity: inactive ? 0.6 : 1,
          },
        ];
      }}
    >
      {({ pressed }) => {
        const foreground = variantColors(variant, colors, pressed).foreground;
        return (
          <View style={[styles.content, { gap: spacing.sm }]}>
            {loading ? (
              <ActivityIndicator color={colors[foreground]} testID="button-spinner" />
            ) : icon ? (
              <Feather name={icon} size={iconSize.row} color={colors[foreground]} />
            ) : null}
            <AppText variant="button" color={foreground} style={styles.label}>
              {label}
            </AppText>
          </View>
        );
      }}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 1,
  },
  label: {
    flexShrink: 1,
    textAlign: 'center',
  },
});
