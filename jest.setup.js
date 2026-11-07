// expo-sqlite needs the native module, which Jest does not have. This stand-in
// is only for the key-value store behind preferences. Real SQL in later steps
// runs against a real SQLite engine in the integration tests.
jest.mock('expo-sqlite/kv-store', () => {
  const values = new Map();
  return {
    __esModule: true,
    default: {
      getItemSync: (key) => values.get(key) ?? null,
      setItemSync: (key, value) => values.set(key, value),
      clearSync: () => values.clear(),
    },
  };
});

jest.mock('expo-localization', () => ({
  getLocales: () => [{ languageCode: 'en' }],
}));

jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);
