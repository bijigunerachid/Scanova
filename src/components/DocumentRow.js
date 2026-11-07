import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import Feather from '@expo/vector-icons/Feather';

import { useTheme } from '../theme/ThemeProvider';
import { formatDate } from '../utils/formatDate';
import { IconButton } from './IconButton';
import { ListRow } from './ListRow';

const THUMBNAIL = { width: 48, height: 64 };

export function DocumentRow({
  title,
  updatedAt,
  pageCount,
  thumbnailUri,
  onPress,
  onMore,
  testID,
}) {
  const { t, i18n } = useTranslation();
  const { colors, iconSize, radius } = useTheme();
  const frame = {
    ...THUMBNAIL,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.backgroundSecondary,
  };

  return (
    <ListRow
      title={title}
      caption={`${formatDate(updatedAt, i18n.language)} · ${t('documents.pageCount', { count: pageCount })}`}
      onPress={onPress}
      testID={testID}
      leading={
        thumbnailUri ? (
          <Image
            source={{ uri: thumbnailUri }}
            style={frame}
            contentFit="cover"
            recyclingKey={thumbnailUri}
            accessible={false}
          />
        ) : (
          <View
            style={[frame, { alignItems: 'center', justifyContent: 'center' }]}
            testID="document-thumbnail-missing"
          >
            <Feather name="file-text" size={iconSize.default} color={colors.textSecondary} />
          </View>
        )
      }
      trailing={
        onMore ? (
          <IconButton
            icon="more-vertical"
            label={t('common.moreActions', { name: title })}
            onPress={onMore}
          />
        ) : null
      }
    />
  );
}
