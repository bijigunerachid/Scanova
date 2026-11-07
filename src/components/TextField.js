import { useId } from 'react';
import { TextInput, View } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';
import { AppText } from './AppText';

export function TextField({ label, error, style, testID, ...inputProps }) {
  const { colors, radius, spacing, touchTarget, typography } = useTheme();
  const labelId = useId();

  return (
    <View style={[{ gap: spacing.xs }, style]}>
      <AppText nativeID={labelId} variant="caption" color="textSecondary">
        {label}
      </AppText>
      <TextInput
        accessibilityLabel={label}
        accessibilityLabelledBy={labelId}
        accessibilityHint={error}
        placeholderTextColor={colors.textSecondary}
        selectionColor={colors.accent}
        testID={testID}
        style={[
          typography.body,
          {
            minHeight: touchTarget,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
            borderWidth: 1,
            borderRadius: radius.sm,
            borderColor: error ? colors.error : colors.border,
            backgroundColor: colors.surface,
            color: colors.textPrimary,
          },
        ]}
        {...inputProps}
      />
      {error ? (
        <AppText accessibilityLiveRegion="polite" variant="caption" color="error">
          {error}
        </AppText>
      ) : null}
    </View>
  );
}
