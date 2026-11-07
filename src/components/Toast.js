import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '../theme/ThemeProvider';
import { AppText } from './AppText';

export const TOAST_DURATION_MS = 4000;

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const { colors, radius, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState(null);
  const timer = useRef(null);

  const show = useCallback((text) => {
    clearTimeout(timer.current);
    setMessage(text);
    AccessibilityInfo.announceForAccessibility(text);
    timer.current = setTimeout(() => setMessage(null), TOAST_DURATION_MS);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  const value = useMemo(() => ({ show }), [show]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {message ? (
        <View
          pointerEvents="none"
          style={[styles.overlay, { bottom: insets.bottom + spacing.md, padding: spacing.md }]}
        >
          <View
            style={[
              styles.toast,
              {
                backgroundColor: colors.textPrimary,
                borderRadius: radius.md,
                paddingHorizontal: spacing.md,
                paddingVertical: spacing.sm,
              },
            ]}
            testID="toast"
          >
            <AppText color="background">{message}</AppText>
          </View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const toast = useContext(ToastContext);
  if (!toast) {
    throw new Error('useToast must be used inside ToastProvider');
  }
  return toast;
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    start: 0,
    end: 0,
    alignItems: 'center',
  },
  toast: {
    maxWidth: 480,
  },
});
