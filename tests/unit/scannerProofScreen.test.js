import { act, fireEvent, renderHook, screen, waitFor } from '@testing-library/react-native';

import ScannerProof from '../../app/dev/scanner';
import ScannovaScanner from '../../modules/scannova-scanner';
import { PHASES, useScanner } from '../../src/features/scanner/useScanner';
import { renderWithProviders } from '../helpers/renderWithProviders';

jest.mock('../../modules/scannova-scanner', () => ({
  __esModule: true,
  default: {
    getAvailabilityAsync: jest.fn(),
    prepareAsync: jest.fn(),
    scanAsync: jest.fn(),
  },
}));

jest.mock('expo-router', () => ({
  Redirect: () => null,
  useRouter: () => ({ back: jest.fn() }),
}));

const PAGE = { uri: 'file:///cache/page-1.jpg', width: 2480, height: 3508, size: 2097152 };

async function renderReady() {
  ScannovaScanner.getAvailabilityAsync.mockResolvedValue({ status: 'ready' });
  await renderWithProviders(<ScannerProof />);
  await screen.findByText('The scanner is ready on this device.');
}

describe('scanner proof screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows the pages of a real result with their size', async () => {
    await renderReady();
    ScannovaScanner.scanAsync.mockResolvedValue({
      status: 'completed',
      pages: [PAGE, { ...PAGE, uri: 'file:///cache/page-2.jpg' }],
    });

    await fireEvent.press(screen.getByTestId('scanner-scan'));

    expect(await screen.findByText('Page 1: 2480 × 3508, 2.00 MB')).toBeTruthy();
    expect(screen.getByText('Page 2: 2480 × 3508, 2.00 MB')).toBeTruthy();
    expect(screen.queryByText('No pages yet.')).toBeNull();
  });

  it('says so when the scan is cancelled', async () => {
    await renderReady();
    ScannovaScanner.scanAsync.mockResolvedValue({ status: 'cancelled' });

    await fireEvent.press(screen.getByTestId('scanner-scan'));

    expect(await screen.findByText('The scan was cancelled. No pages were kept.')).toBeTruthy();
  });

  it('shows an error, and can try again', async () => {
    await renderReady();
    ScannovaScanner.scanAsync.mockRejectedValueOnce({ code: 'ERR_SCANNER_UNAVAILABLE' });

    await fireEvent.press(screen.getByTestId('scanner-scan'));
    expect(await screen.findByText('Scanner error: unavailable')).toBeTruthy();

    ScannovaScanner.scanAsync.mockResolvedValue({ status: 'completed', pages: [PAGE] });
    await fireEvent.press(screen.getByText('Try again'));

    expect(await screen.findByText('Page 1: 2480 × 3508, 2.00 MB')).toBeTruthy();
    expect(screen.queryByText('Scanner error: unavailable')).toBeNull();
  });

  it('opens only one scanner on a double tap', async () => {
    ScannovaScanner.getAvailabilityAsync.mockResolvedValue({ status: 'ready' });
    const { result } = await renderHook(() => useScanner());
    await waitFor(() => expect(result.current.phase).toBe(PHASES.IDLE));

    let finish;
    ScannovaScanner.scanAsync.mockReturnValue(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );

    // Both calls land before the screen can redraw with a disabled button.
    await act(async () => {
      result.current.scan();
      result.current.scan();
    });
    expect(ScannovaScanner.scanAsync).toHaveBeenCalledTimes(1);
    expect(result.current.phase).toBe(PHASES.SCANNING);

    await act(async () => finish({ status: 'cancelled' }));
    expect(result.current.phase).toBe(PHASES.IDLE);
    expect(result.current.cancelled).toBe(true);
  });

  it('blocks scanning when the scanner is unavailable, and gives the reason', async () => {
    ScannovaScanner.getAvailabilityAsync.mockResolvedValue({
      status: 'unavailable',
      reason: 'play-services',
    });
    await renderWithProviders(<ScannerProof />);

    expect(await screen.findByText('The scanner is not available on this device.')).toBeTruthy();
    expect(screen.getByTestId('scanner-reason')).toHaveTextContent('play-services');

    await fireEvent.press(screen.getByTestId('scanner-scan'));
    expect(ScannovaScanner.scanAsync).not.toHaveBeenCalled();
  });

  it('offers the download, then reads the new availability', async () => {
    ScannovaScanner.getAvailabilityAsync.mockResolvedValueOnce({ status: 'download-required' });
    await renderWithProviders(<ScannerProof />);
    const prepare = await screen.findByTestId('scanner-prepare');

    ScannovaScanner.prepareAsync.mockResolvedValue({ alreadyInstalled: false });
    ScannovaScanner.getAvailabilityAsync.mockResolvedValueOnce({ status: 'ready' });
    await fireEvent.press(prepare);

    await waitFor(() => expect(ScannovaScanner.prepareAsync).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('The scanner is ready on this device.')).toBeTruthy();
    expect(screen.queryByTestId('scanner-prepare')).toBeNull();
  });
});
