import { Pressable, StyleSheet, View } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';
import { AppText } from './AppText';

export function ListRow({ title, caption, leading, trailing, onPress, testID }) {
  const { colors, spacing, touchTarget } = useTheme();
  const accessibilityLabel = caption ? `${title}, ${caption}` : title;

  return (
    <View
      style={[
        styles.row,
        {
          minHeight: touchTarget + spacing.md,
          paddingHorizontal: spacing.md,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <Pressable
        accessibilityLabel={accessibilityLabel}
        accessibilityRole={onPress ? 'button' : undefined}
        disabled={!onPress}
        onPress={onPress}
        testID={testID}
        style={({ pressed }) => [
          styles.main,
          { gap: spacing.md, paddingVertical: spacing.sm, opacity: pressed ? 0.7 : 1 },
        ]}
      >
        {leading}
        <View style={styles.text}>
          <AppText variant="heading" numberOfLines={1}>
            {title}
          </AppText>
          {caption ? (
            <AppText variant="caption" color="textSecondary" numberOfLines={1}>
              {caption}
            </AppText>
          ) : null}
        </View>
      </Pressable>
      {trailing}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  main: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    flex: 1,
  },
});
