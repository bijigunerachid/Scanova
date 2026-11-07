import { act, fireEvent, screen } from '@testing-library/react-native';
import { AccessibilityInfo, Pressable, Text } from 'react-native';

import { BottomSheet } from '../../src/components/BottomSheet';
import { Button } from '../../src/components/Button';
import { ConfirmDialog } from '../../src/components/ConfirmDialog';
import { DocumentRow } from '../../src/components/DocumentRow';
import { EmptyState } from '../../src/components/EmptyState';
import { ErrorState } from '../../src/components/ErrorState';
import { FolderRow } from '../../src/components/FolderRow';
import { IconButton } from '../../src/components/IconButton';
import { SearchBar } from '../../src/components/SearchBar';
import { Skeleton } from '../../src/components/Skeleton';
import { TextField } from '../../src/components/TextField';
import { TOAST_DURATION_MS, useToast } from '../../src/components/Toast';
import { touchTarget } from '../../src/theme/tokens';
import { renderWithProviders } from '../helpers/renderWithProviders';

function flatStyle(element) {
  const style = element.props.style;
  return Array.isArray(style) ? Object.assign({}, ...style.flat(Infinity)) : style;
}

describe('Button', () => {
  it('calls onPress', async () => {
    const onPress = jest.fn();
    await renderWithProviders(<Button label="Save" onPress={onPress} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Save' }));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('announces only the label, not the icon glyph', async () => {
    await renderWithProviders(<Button label="Save" icon="camera" onPress={() => {}} />);
    expect(screen.getByRole('button', { name: 'Save' })).toBeOnTheScreen();
  });

  it('meets the minimum touch target', async () => {
    await renderWithProviders(<Button label="Save" onPress={() => {}} />);
    const style = flatStyle(screen.getByRole('button', { name: 'Save' }));
    expect(style.minHeight).toBeGreaterThanOrEqual(touchTarget);
  });

  it('does not fire when disabled', async () => {
    const onPress = jest.fn();
    await renderWithProviders(<Button label="Save" onPress={onPress} disabled />);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toBeDisabled();
    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('shows a spinner, reports busy and blocks presses while loading', async () => {
    const onPress = jest.fn();
    await renderWithProviders(<Button label="Save" onPress={onPress} loading />);
    const button = screen.getByRole('button', { name: 'Save' });
    expect(screen.getByTestId('button-spinner')).toBeOnTheScreen();
    expect(button).toBeBusy();
    await fireEvent.press(button);
    expect(onPress).not.toHaveBeenCalled();
  });
});

describe('IconButton', () => {
  it('exposes its label and meets the touch target', async () => {
    const onPress = jest.fn();
    await renderWithProviders(<IconButton icon="x" label="Close" onPress={onPress} />);
    const button = screen.getByRole('button', { name: 'Close' });
    expect(flatStyle(button).width).toBeGreaterThanOrEqual(touchTarget);
    expect(flatStyle(button).height).toBeGreaterThanOrEqual(touchTarget);
    await fireEvent.press(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});

describe('DocumentRow', () => {
  const props = { title: 'Lease', updatedAt: Date.UTC(2026, 10, 6, 12), pageCount: 3 };

  it('shows the name, date and translated page count', async () => {
    await renderWithProviders(<DocumentRow {...props} onPress={() => {}} />);
    expect(screen.getByText('Lease')).toBeOnTheScreen();
    expect(screen.getByText(/2026 · 3 pages/)).toBeOnTheScreen();
  });

  it('shows a neutral icon, not a fake image, without a thumbnail', async () => {
    await renderWithProviders(<DocumentRow {...props} />);
    expect(screen.getByTestId('document-thumbnail-missing')).toBeOnTheScreen();
  });

  it('uses the real thumbnail when one exists', async () => {
    await renderWithProviders(<DocumentRow {...props} thumbnailUri="file:///thumb.jpg" />);
    expect(screen.queryByTestId('document-thumbnail-missing')).toBeNull();
  });

  it('labels the more actions button with the document name', async () => {
    const onMore = jest.fn();
    await renderWithProviders(<DocumentRow {...props} onMore={onMore} />);
    await fireEvent.press(screen.getByRole('button', { name: 'More actions for Lease' }));
    expect(onMore).toHaveBeenCalledTimes(1);
  });
});

describe('FolderRow', () => {
  it('uses singular and plural document counts', async () => {
    const view = await renderWithProviders(<FolderRow name="Tax" documentCount={1} />);
    expect(screen.getByText('1 document')).toBeOnTheScreen();
    await view.unmount();
    await renderWithProviders(<FolderRow name="Tax" documentCount={4} />);
    expect(screen.getByText('4 documents')).toBeOnTheScreen();
  });
});

describe('SearchBar', () => {
  it('only offers clear when there is text, and clearing empties it', async () => {
    const onChangeText = jest.fn();
    const view = await renderWithProviders(
      <SearchBar value="" onChangeText={onChangeText} placeholder="Search" />,
    );
    expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull();
    await view.unmount();

    await renderWithProviders(
      <SearchBar value="lease" onChangeText={onChangeText} placeholder="Search" />,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Clear' }));
    expect(onChangeText).toHaveBeenCalledWith('');
  });
});

describe('TextField', () => {
  it('passes typing through and shows its error', async () => {
    const onChangeText = jest.fn();
    await renderWithProviders(
      <TextField
        label="Name"
        value=""
        onChangeText={onChangeText}
        error="Enter a name"
        testID="field"
      />,
    );
    await fireEvent.changeText(screen.getByTestId('field'), 'Lease');
    expect(onChangeText).toHaveBeenCalledWith('Lease');
    expect(screen.getByText('Enter a name')).toBeOnTheScreen();
  });
});

describe('BottomSheet', () => {
  it('renders nothing when closed', async () => {
    await renderWithProviders(
      <BottomSheet visible={false} title="Actions" onClose={() => {}}>
        <Text>Rename</Text>
      </BottomSheet>,
    );
    expect(screen.queryByText('Rename')).toBeNull();
  });

  it('shows content when open and closes from the backdrop', async () => {
    const onClose = jest.fn();
    await renderWithProviders(
      <BottomSheet visible title="Actions" onClose={onClose}>
        <Text>Rename</Text>
      </BottomSheet>,
    );
    expect(screen.getByText('Rename')).toBeOnTheScreen();
    // The panel is modal for screen readers, so the backdrop is correctly hidden from them.
    await fireEvent.press(
      screen.getByTestId('bottom-sheet-backdrop', { includeHiddenElements: true }),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes with the screen reader escape gesture', async () => {
    const onClose = jest.fn();
    await renderWithProviders(
      <BottomSheet visible title="Actions" onClose={onClose}>
        <Text>Rename</Text>
      </BottomSheet>,
    );
    expect(screen.getByTestId('bottom-sheet-panel').props.onAccessibilityEscape).toBe(onClose);
  });
});

describe('ConfirmDialog', () => {
  const props = { visible: true, title: 'Delete?', message: 'Gone.', confirmLabel: 'Delete' };

  it('routes confirm and cancel to their own handlers', async () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    await renderWithProviders(
      <ConfirmDialog {...props} onConfirm={onConfirm} onCancel={onCancel} />,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));
    expect(onCancel).toHaveBeenCalledTimes(1);
    expect(onConfirm).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByRole('button', { name: 'Delete' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('blocks both actions while busy', async () => {
    const onConfirm = jest.fn();
    const onCancel = jest.fn();
    await renderWithProviders(
      <ConfirmDialog {...props} busy onConfirm={onConfirm} onCancel={onCancel} />,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Delete' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Cancel' }));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });
});

describe('states', () => {
  it('EmptyState runs its action', async () => {
    const onAction = jest.fn();
    await renderWithProviders(
      <EmptyState icon="file-text" message="Nothing yet" actionLabel="Scan" onAction={onAction} />,
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Scan' }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('EmptyState omits the button without an action', async () => {
    await renderWithProviders(<EmptyState icon="file-text" message="Nothing yet" />);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('ErrorState retries', async () => {
    const onRetry = jest.fn();
    await renderWithProviders(<ErrorState title="Failed" message="Oops" onRetry={onRetry} />);
    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('Skeleton reports loading to screen readers', async () => {
    await renderWithProviders(<Skeleton testID="skeleton" />);
    const skeleton = screen.getByTestId('skeleton');
    expect(skeleton.props.accessibilityLabel).toBe('Loading');
    expect(skeleton).toBeBusy();
  });
});

describe('Toast', () => {
  function Trigger() {
    const toast = useToast();
    return (
      <Pressable accessibilityRole="button" onPress={() => toast.show('Saved')}>
        <Text>Show</Text>
      </Pressable>
    );
  }

  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it('shows, announces, then disappears', async () => {
    const announce = jest.spyOn(AccessibilityInfo, 'announceForAccessibility');
    await renderWithProviders(<Trigger />);
    await fireEvent.press(screen.getByRole('button', { name: 'Show' }));

    expect(screen.getByTestId('toast')).toHaveTextContent('Saved');
    expect(announce).toHaveBeenCalledWith('Saved');

    await act(async () => {
      jest.advanceTimersByTime(TOAST_DURATION_MS);
    });
    expect(screen.queryByTestId('toast')).toBeNull();
    announce.mockRestore();
  });
});
