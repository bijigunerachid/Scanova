import { useTranslation } from 'react-i18next';
import { TextInput, View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';

import { useTheme } from '../theme/ThemeProvider';
import { IconButton } from './IconButton';

export function SearchBar({ value, onChangeText, placeholder, testID }) {
  const { t } = useTranslation();
  const { colors, iconSize, radius, spacing, touchTarget, typography } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        minHeight: touchTarget,
        paddingStart: spacing.md,
        gap: spacing.sm,
        borderRadius: radius.md,
        backgroundColor: colors.backgroundSecondary,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Feather name="search" size={iconSize.row} color={colors.textSecondary} />
      <TextInput
        accessibilityLabel={placeholder}
        accessibilityRole="search"
        autoCorrect={false}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        returnKeyType="search"
        selectionColor={colors.accent}
        testID={testID}
        value={value}
        style={[
          typography.body,
          { flex: 1, minHeight: touchTarget, paddingVertical: 0, color: colors.textPrimary },
        ]}
      />
      {value ? (
        <IconButton
          icon="x"
          size={iconSize.row}
          color="textSecondary"
          label={t('common.clear')}
          onPress={() => onChangeText('')}
        />
      ) : null}
    </View>
  );
}
