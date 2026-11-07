const KEYS = {
  appearance: 'preferences.appearance',
  language: 'preferences.language',
};

export const APPEARANCES = ['system', 'light', 'dark'];
export const LANGUAGE_CHOICES = ['system', 'en', 'fr'];

const ALLOWED = {
  appearance: APPEARANCES,
  language: LANGUAGE_CHOICES,
};

// Wraps a synchronous key-value store. Stored values are checked against the
// allowed lists. A storage failure falls back to the default, because a broken
// preference must never stop the app from opening.
export function createPreferences(storage, onError = () => {}) {
  function read(name) {
    try {
      const value = storage.getItemSync(KEYS[name]);
      return ALLOWED[name].includes(value) ? value : 'system';
    } catch (error) {
      onError(error);
      return 'system';
    }
  }

  function write(name, value) {
    if (!ALLOWED[name].includes(value)) {
      throw new RangeError(`Invalid ${name} preference: ${value}`);
    }
    try {
      storage.setItemSync(KEYS[name], value);
      return true;
    } catch (error) {
      onError(error);
      return false;
    }
  }

  return {
    getAppearance: () => read('appearance'),
    setAppearance: (value) => write('appearance', value),
    getLanguage: () => read('language'),
    setLanguage: (value) => write('language', value),
  };
}
