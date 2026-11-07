import { useTranslation } from 'react-i18next';
import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useReducedMotion } from '../hooks/useReducedMotion';
import { useTheme } from '../theme/ThemeProvider';
import { AppText } from './AppText';

const MAX_SHEET_WIDTH = 560;

export function BottomSheet({ visible, title, onClose, children, testID }) {
  const { t } = useTranslation();
  const { colors, radius, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      animationType={reducedMotion ? 'none' : 'slide'}
      onRequestClose={onClose}
      testID={testID}
    >
      <View style={styles.container}>
        <Pressable
          accessibilityLabel={t('common.close')}
          accessibilityRole="button"
          onPress={onClose}
          style={[StyleSheet.absoluteFill, { backgroundColor: colors.scrim }]}
          testID="bottom-sheet-backdrop"
        />
        <View
          accessibilityViewIsModal
          onAccessibilityEscape={onClose}
          testID="bottom-sheet-panel"
          style={[
            styles.sheet,
            {
              backgroundColor: colors.surface,
              borderTopLeftRadius: radius.lg,
              borderTopRightRadius: radius.lg,
              paddingTop: spacing.md,
              paddingBottom: Math.max(insets.bottom, spacing.md),
            },
          ]}
        >
          {title ? (
            <AppText
              accessibilityRole="header"
              variant="heading"
              style={{ paddingHorizontal: spacing.md, paddingBottom: spacing.sm }}
            >
              {title}
            </AppText>
          ) : null}
          {children}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  sheet: {
    width: '100%',
    maxWidth: MAX_SHEET_WIDTH,
  },
});
