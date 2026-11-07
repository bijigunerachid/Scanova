import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';

import { useTheme } from '../theme/ThemeProvider';
import { AppText } from './AppText';
import { Button } from './Button';

const ICON_SIZE = 40;

export function ErrorState({ title, message, onRetry, testID }) {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();

  return (
    <View
      accessibilityLiveRegion="assertive"
      testID={testID}
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        padding: spacing.xl,
        gap: spacing.md,
      }}
    >
      <Feather name="alert-circle" size={ICON_SIZE} color={colors.error} />
      <AppText accessibilityRole="header" variant="heading" style={{ textAlign: 'center' }}>
        {title}
      </AppText>
      <AppText color="textSecondary" style={{ textAlign: 'center' }}>
        {message}
      </AppText>
      {onRetry ? (
        <Button label={t('common.retry')} variant="secondary" icon="refresh-cw" onPress={onRetry} />
      ) : null}
    </View>
  );
}
