import { Pressable } from 'react-native';
import Feather from '@expo/vector-icons/Feather';

import { useTheme } from '../theme/ThemeProvider';

export function IconButton({
  icon,
  label,
  onPress,
  color = 'textPrimary',
  size,
  disabled = false,
  testID,
}) {
  const { colors, iconSize, radius, touchTarget } = useTheme();

  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => ({
        width: touchTarget,
        height: touchTarget,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: radius.md,
        backgroundColor: pressed ? colors.backgroundSecondary : 'transparent',
        opacity: disabled ? 0.6 : 1,
      })}
    >
      <Feather name={icon} size={size ?? iconSize.default} color={colors[color]} />
    </Pressable>
  );
}
