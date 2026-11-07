import { createPreferences } from '../../src/services/preferences';

function memoryStorage(initial = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItemSync: (key) => values.get(key) ?? null,
    setItemSync: (key, value) => values.set(key, value),
  };
}

describe('createPreferences', () => {
  it('defaults to system for appearance and language', () => {
    const preferences = createPreferences(memoryStorage());
    expect(preferences.getAppearance()).toBe('system');
    expect(preferences.getLanguage()).toBe('system');
  });

  it('saves and reads valid values', () => {
    const preferences = createPreferences(memoryStorage());
    expect(preferences.setAppearance('dark')).toBe(true);
    expect(preferences.setLanguage('fr')).toBe(true);
    expect(preferences.getAppearance()).toBe('dark');
    expect(preferences.getLanguage()).toBe('fr');
  });

  it('keeps values across instances that share storage', () => {
    const storage = memoryStorage();
    createPreferences(storage).setAppearance('light');
    expect(createPreferences(storage).getAppearance()).toBe('light');
  });

  it('rejects values outside the allowed list', () => {
    const storage = memoryStorage();
    const preferences = createPreferences(storage);
    expect(() => preferences.setAppearance('neon')).toThrow(RangeError);
    expect(() => preferences.setLanguage('xx')).toThrow(RangeError);
    expect(preferences.getAppearance()).toBe('system');
  });

  it('ignores corrupted stored values', () => {
    const preferences = createPreferences(
      memoryStorage({ 'preferences.appearance': 'neon', 'preferences.language': '42' }),
    );
    expect(preferences.getAppearance()).toBe('system');
    expect(preferences.getLanguage()).toBe('system');
  });

  it('falls back to defaults and reports when storage fails', () => {
    const failure = new Error('disk full');
    const onError = jest.fn();
    const preferences = createPreferences(
      {
        getItemSync: () => {
          throw failure;
        },
        setItemSync: () => {
          throw failure;
        },
      },
      onError,
    );
    expect(preferences.getAppearance()).toBe('system');
    expect(preferences.setAppearance('dark')).toBe(false);
    expect(onError).toHaveBeenCalledTimes(2);
    expect(onError).toHaveBeenCalledWith(failure);
  });
});
