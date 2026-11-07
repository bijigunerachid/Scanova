import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';

const THUMBNAIL = { width: 48, height: 64 };
const TITLE_LINE = { width: '60%', height: 16 };
const CAPTION_LINE = { width: '35%', height: 12 };

function SkeletonRow() {
  const { colors, radius, spacing } = useTheme();
  const block = { backgroundColor: colors.backgroundSecondary, borderRadius: radius.sm };

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
      }}
    >
      <View style={[block, THUMBNAIL]} />
      <View style={{ flex: 1, gap: spacing.sm }}>
        <View style={[block, TITLE_LINE]} />
        <View style={[block, CAPTION_LINE]} />
      </View>
    </View>
  );
}

// Static on purpose: the design system avoids decorative motion.
export function Skeleton({ rows = 5, testID }) {
  const { t } = useTranslation();
  return (
    <View
      accessible
      accessibilityLabel={t('common.loading')}
      accessibilityState={{ busy: true }}
      testID={testID}
    >
      {Array.from({ length: rows }, (_, index) => (
        <SkeletonRow key={index} />
      ))}
    </View>
  );
}
