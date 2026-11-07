import ScannovaScanner from '../../modules/scannova-scanner';
import {
  AVAILABILITY,
  getScannerAvailability,
  prepareScanner,
  SCAN_ERRORS,
  ScannerError,
  scanDocument,
} from '../../src/features/scanner/scanner';

jest.mock('../../modules/scannova-scanner', () => ({
  __esModule: true,
  default: {
    getAvailabilityAsync: jest.fn(),
    prepareAsync: jest.fn(),
    scanAsync: jest.fn(),
  },
}));

const PAGE = {
  uri: 'file:///cache/scannova-tmp/page-1.jpg',
  width: 2480,
  height: 3508,
  size: 1000,
};

describe('getScannerAvailability', () => {
  it.each(Object.values(AVAILABILITY))('passes through %s', async (status) => {
    ScannovaScanner.getAvailabilityAsync.mockResolvedValue({ status });
    await expect(getScannerAvailability()).resolves.toEqual({ status, reason: null });
  });

  it('keeps the reason given by the native module', async () => {
    ScannovaScanner.getAvailabilityAsync.mockResolvedValue({
      status: 'unavailable',
      reason: 'play-services',
    });
    await expect(getScannerAvailability()).resolves.toEqual({
      status: 'unavailable',
      reason: 'play-services',
    });
  });

  it('treats an unknown status as unavailable', async () => {
    ScannovaScanner.getAvailabilityAsync.mockResolvedValue({ status: 'maybe' });
    await expect(getScannerAvailability()).resolves.toEqual({
      status: 'unavailable',
      reason: 'invalid-response',
    });
  });

  it('treats a failed check as unavailable, so the fallback can start', async () => {
    ScannovaScanner.getAvailabilityAsync.mockRejectedValue(new Error('boom'));
    await expect(getScannerAvailability()).resolves.toEqual({
      status: 'unavailable',
      reason: 'check-failed',
    });
  });
});

describe('prepareScanner', () => {
  it('maps a failed download request to not-ready', async () => {
    ScannovaScanner.prepareAsync.mockRejectedValue({ code: 'ERR_SCANNER_NOT_READY' });
    await expect(prepareScanner()).rejects.toMatchObject({ code: SCAN_ERRORS.NOT_READY });
  });
});

describe('scanDocument', () => {
  it('returns the pages of a completed scan', async () => {
    ScannovaScanner.scanAsync.mockResolvedValue({ status: 'completed', pages: [PAGE, PAGE] });
    await expect(scanDocument()).resolves.toEqual({ status: 'completed', pages: [PAGE, PAGE] });
  });

  it('reports a cancelled scan without an error', async () => {
    ScannovaScanner.scanAsync.mockResolvedValue({ status: 'cancelled' });
    await expect(scanDocument()).resolves.toEqual({ status: 'cancelled' });
  });

  it('treats a scan with zero pages as cancelled', async () => {
    ScannovaScanner.scanAsync.mockResolvedValue({ status: 'completed', pages: [] });
    await expect(scanDocument()).resolves.toEqual({ status: 'cancelled' });
  });

  it.each([
    ['ERR_SCANNER_UNAVAILABLE', SCAN_ERRORS.UNAVAILABLE],
    ['ERR_SCANNER_NOT_READY', SCAN_ERRORS.NOT_READY],
    ['ERR_SCAN_IN_PROGRESS', SCAN_ERRORS.IN_PROGRESS],
    ['ERR_SCAN_FAILED', SCAN_ERRORS.FAILED],
    ['SOMETHING_NEW', SCAN_ERRORS.FAILED],
  ])('maps native error %s to %s', async (nativeCode, code) => {
    const nativeError = Object.assign(new Error('native'), { code: nativeCode });
    ScannovaScanner.scanAsync.mockRejectedValue(nativeError);

    const error = await scanDocument().catch((caught) => caught);

    expect(error).toBeInstanceOf(ScannerError);
    expect(error.code).toBe(code);
    expect(error.cause).toBe(nativeError);
  });

  it.each([
    ['an unknown status', { status: 'weird' }],
    ['a missing result', null],
    ['pages that are not a list', { status: 'completed', pages: 'nope' }],
    ['a path that is not a file', { status: 'completed', pages: [{ ...PAGE, uri: 'https://x' }] }],
    ['a zero width', { status: 'completed', pages: [{ ...PAGE, width: 0 }] }],
    ['a fractional height', { status: 'completed', pages: [{ ...PAGE, height: 1.5 }] }],
    ['an empty file', { status: 'completed', pages: [{ ...PAGE, size: 0 }] }],
    ['one bad page among good ones', { status: 'completed', pages: [PAGE, {}] }],
  ])('rejects %s', async (_name, result) => {
    ScannovaScanner.scanAsync.mockResolvedValue(result);
    await expect(scanDocument()).rejects.toMatchObject({ code: SCAN_ERRORS.INVALID_RESULT });
  });
});
