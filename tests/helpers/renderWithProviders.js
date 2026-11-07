import { render } from '@testing-library/react-native';

import { ToastProvider } from '../../src/components/Toast';
import '../../src/localization';
import { ThemeProvider } from '../../src/theme/ThemeProvider';

export function renderWithProviders(element, { preferences } = {}) {
  return render(
    <ThemeProvider preferences={preferences}>
      <ToastProvider>{element}</ToastProvider>
    </ThemeProvider>,
  );
}
