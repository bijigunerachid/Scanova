import Storage from 'expo-sqlite/kv-store';

import { createPreferences } from './preferences';

export const appPreferences = createPreferences(Storage, (error) => {
  console.warn('Could not access saved preferences', error);
});
