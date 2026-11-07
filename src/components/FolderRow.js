import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';

import { useTheme } from '../theme/ThemeProvider';
import { IconButton } from './IconButton';
import { ListRow } from './ListRow';

export function FolderRow({ name, documentCount, onPress, onMore, testID }) {
  const { t } = useTranslation();
  const { colors, iconSize, radius, touchTarget } = useTheme();

  return (
    <ListRow
      title={name}
      caption={t('folders.documentCount', { count: documentCount })}
      onPress={onPress}
      testID={testID}
      leading={
        <View
          style={{
            width: touchTarget,
            height: touchTarget,
            borderRadius: radius.sm,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: colors.backgroundSecondary,
          }}
        >
          <Feather name="folder" size={iconSize.default} color={colors.accent} />
        </View>
      }
      trailing={
        onMore ? (
          <IconButton
            icon="more-vertical"
            label={t('common.moreActions', { name })}
            onPress={onMore}
          />
        ) : null
      }
    />
  );
}
