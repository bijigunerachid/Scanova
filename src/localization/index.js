import { getLocales } from 'expo-localization';
import { createInstance } from 'i18next';
import { useCallback, useState } from 'react';
import { initReactI18next, useTranslation } from 'react-i18next';

import { appPreferences } from '../services/appPreferences';
import en from './en.json';
import fr from './fr.json';

export const SUPPORTED_LANGUAGES = ['en', 'fr'];
const FALLBACK_LANGUAGE = 'en';

export function resolveLanguage(choice, deviceLocales) {
  if (SUPPORTED_LANGUAGES.includes(choice)) {
    return choice;
  }
  const match = deviceLocales
    .map((locale) => locale.languageCode)
    .find((code) => SUPPORTED_LANGUAGES.includes(code));
  return match ?? FALLBACK_LANGUAGE;
}

const i18next = createInstance();

i18next.use(initReactI18next).init({
  resources: { en: { translation: en }, fr: { translation: fr } },
  lng: resolveLanguage(appPreferences.getLanguage(), getLocales()),
  fallbackLng: FALLBACK_LANGUAGE,
  interpolation: { escapeValue: false },
  initAsync: false,
});

export function useLanguage(preferences = appPreferences) {
  const { i18n } = useTranslation();
  const [choice, setChoiceState] = useState(() => preferences.getLanguage());

  const setChoice = useCallback(
    (value) => {
      preferences.setLanguage(value);
      setChoiceState(value);
      return i18n.changeLanguage(resolveLanguage(value, getLocales()));
    },
    [i18n, preferences],
  );

  return { choice, language: i18n.language, setChoice };
}

export default i18next;
