import i18n, { resolveLanguage } from '../../src/localization';
import en from '../../src/localization/en.json';
import fr from '../../src/localization/fr.json';
import { formatDate } from '../../src/utils/formatDate';

function flatten(object, prefix = '') {
  return Object.entries(object).flatMap(([key, value]) =>
    typeof value === 'object' ? flatten(value, `${prefix}${key}.`) : [`${prefix}${key}`],
  );
}

function placeholders(text) {
  return (text.match(/{{\w+}}/g) ?? []).sort();
}

function lookup(object, path) {
  return path.split('.').reduce((node, key) => node[key], object);
}

describe('translations', () => {
  it('has the same keys in English and French', () => {
    expect(flatten(fr).sort()).toEqual(flatten(en).sort());
  });

  it('uses the same placeholders in English and French', () => {
    for (const key of flatten(en)) {
      expect([key, placeholders(lookup(fr, key))]).toEqual([key, placeholders(lookup(en, key))]);
    }
  });

  it('has no empty strings', () => {
    for (const translations of [en, fr]) {
      for (const key of flatten(translations)) {
        expect(lookup(translations, key).trim()).not.toBe('');
      }
    }
  });

  it('applies plural rules for each language', async () => {
    await i18n.changeLanguage('en');
    expect(i18n.t('documents.pageCount', { count: 0 })).toBe('0 pages');
    expect(i18n.t('documents.pageCount', { count: 1 })).toBe('1 page');
    expect(i18n.t('documents.pageCount', { count: 2 })).toBe('2 pages');

    // French treats 0 as singular, unlike English.
    await i18n.changeLanguage('fr');
    expect(i18n.t('documents.pageCount', { count: 0 })).toBe('0 page');
    expect(i18n.t('documents.pageCount', { count: 2 })).toBe('2 pages');
    await i18n.changeLanguage('en');
  });
});

describe('resolveLanguage', () => {
  const french = [{ languageCode: 'fr' }];
  const arabicThenFrench = [{ languageCode: 'ar' }, { languageCode: 'fr' }];
  const unsupported = [{ languageCode: 'de' }];

  it('uses an explicit choice over the device language', () => {
    expect(resolveLanguage('en', french)).toBe('en');
  });

  it('follows the device language for the system choice', () => {
    expect(resolveLanguage('system', french)).toBe('fr');
  });

  it('uses the first supported device language', () => {
    expect(resolveLanguage('system', arabicThenFrench)).toBe('fr');
  });

  it('falls back to English', () => {
    expect(resolveLanguage('system', unsupported)).toBe('en');
    expect(resolveLanguage('system', [])).toBe('en');
  });
});

describe('formatDate', () => {
  const timestamp = Date.UTC(2026, 10, 6, 12);

  it('formats by language', () => {
    expect(formatDate(timestamp, 'en')).toContain('2026');
    expect(formatDate(timestamp, 'en')).toMatch(/Nov/);
    expect(formatDate(timestamp, 'fr')).toMatch(/nov/);
  });
});
