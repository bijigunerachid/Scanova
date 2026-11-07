import { useTranslation } from 'react-i18next';
import { Modal, StyleSheet, View } from 'react-native';

import { useTheme } from '../theme/ThemeProvider';
import { AppText } from './AppText';
import { Button } from './Button';

const MAX_DIALOG_WIDTH = 400;

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  busy = false,
}) {
  const { t } = useTranslation();
  const { colors, radius, spacing } = useTheme();

  return (
    <Modal
      visible={visible}
      transparent
      statusBarTranslucent
      navigationBarTranslucent
      animationType="fade"
      onRequestClose={busy ? undefined : onCancel}
    >
      <View style={[styles.container, { backgroundColor: colors.scrim, padding: spacing.lg }]}>
        <View
          accessibilityViewIsModal
          style={[
            styles.dialog,
            {
              backgroundColor: colors.surface,
              borderRadius: radius.md,
              padding: spacing.lg,
              gap: spacing.md,
            },
          ]}
        >
          <AppText accessibilityRole="header" variant="heading">
            {title}
          </AppText>
          <AppText color="textSecondary">{message}</AppText>
          <View style={{ gap: spacing.sm }}>
            <Button label={confirmLabel} variant="destructive" onPress={onConfirm} loading={busy} />
            <Button
              label={t('common.cancel')}
              variant="secondary"
              onPress={onCancel}
              disabled={busy}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialog: {
    width: '100%',
    maxWidth: MAX_DIALOG_WIDTH,
  },
});
