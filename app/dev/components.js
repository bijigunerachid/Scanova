import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '../../src/components/AppText';
import { BottomSheet } from '../../src/components/BottomSheet';
import { Button } from '../../src/components/Button';
import { Card } from '../../src/components/Card';
import { ConfirmDialog } from '../../src/components/ConfirmDialog';
import { DocumentRow } from '../../src/components/DocumentRow';
import { EmptyState } from '../../src/components/EmptyState';
import { ErrorState } from '../../src/components/ErrorState';
import { FolderRow } from '../../src/components/FolderRow';
import { IconButton } from '../../src/components/IconButton';
import { ListRow } from '../../src/components/ListRow';
import { SearchBar } from '../../src/components/SearchBar';
import { Skeleton } from '../../src/components/Skeleton';
import { TextField } from '../../src/components/TextField';
import { useToast } from '../../src/components/Toast';
import { useLanguage } from '../../src/localization';
import { APPEARANCES, LANGUAGE_CHOICES } from '../../src/services/preferences';
import { useTheme } from '../../src/theme/ThemeProvider';

const SAMPLE_DATE = Date.UTC(2026, 10, 6);

function Section({ title, children }) {
  const { spacing } = useTheme();
  return (
    <View style={{ gap: spacing.sm }}>
      <AppText accessibilityRole="header" variant="heading">
        {title}
      </AppText>
      {children}
    </View>
  );
}

function Choices({ options, value, onChange, prefix }) {
  const { spacing } = useTheme();
  return (
    <View style={[styles.wrap, { gap: spacing.sm }]}>
      {options.map((option) => (
        <View key={option} style={styles.choice}>
          <Button
            label={option}
            variant={value === option ? 'primary' : 'secondary'}
            onPress={() => onChange(option)}
            testID={`${prefix}-${option}`}
          />
        </View>
      ))}
    </View>
  );
}

// Development-only screen for checking every component and theme. The sample
// content below never reaches a release build, because of the redirect.
export default function ComponentGallery() {
  const router = useRouter();
  const { t } = useTranslation();
  const { appearance, setAppearance, colors, spacing, typography } = useTheme();
  const { choice, setChoice } = useLanguage();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [name, setName] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  if (!__DEV__) {
    return <Redirect href="/" />;
  }

  return (
    <SafeAreaView style={styles.screen}>
      <View style={[styles.header, { paddingHorizontal: spacing.sm }]}>
        <IconButton icon="arrow-left" label={t('common.close')} onPress={() => router.back()} />
        <AppText accessibilityRole="header" variant="title">
          Components
        </AppText>
      </View>
      <ScrollView
        contentContainerStyle={{ padding: spacing.md, gap: spacing.lg }}
        testID="gallery-scroll"
      >
        <Section title="Appearance">
          <Choices
            options={APPEARANCES}
            value={appearance}
            onChange={setAppearance}
            prefix="appearance"
          />
        </Section>
        <Section title="Language">
          <Choices
            options={LANGUAGE_CHOICES}
            value={choice}
            onChange={setChoice}
            prefix="language"
          />
          <AppText testID="gallery-tagline">{t('app.tagline')}</AppText>
        </Section>
        <Section title="Type">
          {Object.keys(typography).map((variant) => (
            <AppText key={variant} variant={variant}>
              {variant}
            </AppText>
          ))}
        </Section>
        <Section title="Colour">
          <View style={[styles.wrap, { gap: spacing.sm }]}>
            {Object.entries(colors).map(([token, value]) => (
              <View
                key={token}
                accessibilityLabel={token}
                style={[styles.swatch, { backgroundColor: value, borderColor: colors.border }]}
              />
            ))}
          </View>
        </Section>
        <Section title="Buttons">
          <Button label="Primary" icon="camera" onPress={() => toast.show('Primary pressed')} />
          <Button label="Secondary" variant="secondary" icon="image" onPress={() => {}} />
          <Button
            label="Destructive"
            variant="destructive"
            icon="trash-2"
            onPress={() => setDialogOpen(true)}
            testID="open-dialog"
          />
          <Button label="Loading" loading onPress={() => {}} />
          <Button label="Disabled" disabled onPress={() => {}} />
        </Section>
        <Section title="Inputs">
          <SearchBar value={query} onChangeText={setQuery} placeholder="Search" />
          <TextField label="Name" value={name} onChangeText={setName} />
          <TextField label="Name" value="" onChangeText={() => {}} error="Enter a name" />
        </Section>
        <Section title="Rows">
          <Card style={styles.flush}>
            <DocumentRow
              title="Sample document with a long name that must truncate cleanly"
              updatedAt={SAMPLE_DATE}
              pageCount={3}
              onPress={() => {}}
              onMore={() => setSheetOpen(true)}
            />
            <FolderRow
              name="Sample folder"
              documentCount={1}
              onPress={() => {}}
              onMore={() => {}}
            />
            <ListRow title="List row" caption="Caption" onPress={() => {}} />
          </Card>
        </Section>
        <Section title="Bottom sheet">
          <Button
            label="Open sheet"
            variant="secondary"
            onPress={() => setSheetOpen(true)}
            testID="open-sheet"
          />
        </Section>
        <Section title="States">
          <Card style={styles.flush}>
            <Skeleton rows={2} />
          </Card>
          <Card>
            <EmptyState
              icon="file-text"
              message="Empty state message"
              actionLabel="Action"
              onAction={() => {}}
            />
          </Card>
          <Card>
            <ErrorState
              title={t('errors.unexpectedTitle')}
              message={t('errors.unexpectedMessage')}
              onRetry={() => {}}
            />
          </Card>
        </Section>
      </ScrollView>
      <BottomSheet visible={sheetOpen} title="Sheet title" onClose={() => setSheetOpen(false)}>
        <ListRow title="Sheet action" onPress={() => setSheetOpen(false)} testID="sheet-action" />
      </BottomSheet>
      <ConfirmDialog
        visible={dialogOpen}
        title="Dialog title"
        message="Dialog message explaining the consequence."
        confirmLabel="Confirm"
        onConfirm={() => setDialogOpen(false)}
        onCancel={() => setDialogOpen(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  choice: {
    flexGrow: 1,
  },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
  },
  flush: {
    padding: 0,
    overflow: 'hidden',
  },
});
