import ScannovaScanner from '../../../modules/scannova-scanner';

export const AVAILABILITY = Object.freeze({
  READY: 'ready',
  DOWNLOAD_REQUIRED: 'download-required',
  UNAVAILABLE: 'unavailable',
});

export const SCAN_ERRORS = Object.freeze({
  UNAVAILABLE: 'unavailable',
  NOT_READY: 'not-ready',
  IN_PROGRESS: 'in-progress',
  INVALID_RESULT: 'invalid-result',
  FAILED: 'failed',
});

const NATIVE_ERRORS = {
  ERR_SCANNER_UNAVAILABLE: SCAN_ERRORS.UNAVAILABLE,
  ERR_SCANNER_NOT_READY: SCAN_ERRORS.NOT_READY,
  ERR_SCAN_IN_PROGRESS: SCAN_ERRORS.IN_PROGRESS,
};

export class ScannerError extends Error {
  constructor(code, message, cause) {
    super(message, { cause });
    this.name = 'ScannerError';
    this.code = code;
  }
}

function toScannerError(error) {
  return new ScannerError(NATIVE_ERRORS[error?.code] ?? SCAN_ERRORS.FAILED, error?.message, error);
}

function isPositiveInteger(value) {
  return Number.isInteger(value) && value > 0;
}

function isValidPage(page) {
  return (
    typeof page?.uri === 'string' &&
    page.uri.startsWith('file://') &&
    isPositiveInteger(page.width) &&
    isPositiveInteger(page.height) &&
    isPositiveInteger(page.size)
  );
}

export async function getScannerAvailability() {
  try {
    const result = await ScannovaScanner.getAvailabilityAsync();
    if (Object.values(AVAILABILITY).includes(result?.status)) {
      return { status: result.status, reason: result.reason ?? null };
    }
    return { status: AVAILABILITY.UNAVAILABLE, reason: 'invalid-response' };
  } catch {
    return { status: AVAILABILITY.UNAVAILABLE, reason: 'check-failed' };
  }
}

// Asks the platform to fetch the scanner ahead of time. This only starts the
// download, so call getScannerAvailability afterwards to see whether it is done.
export async function prepareScanner() {
  try {
    await ScannovaScanner.prepareAsync();
  } catch (error) {
    throw toScannerError(error);
  }
}

// Resolves to { status: 'cancelled' } or { status: 'completed', pages }, where
// each page is { uri, width, height, size }. Throws a ScannerError on failure.
export async function scanDocument() {
  let result;
  try {
    result = await ScannovaScanner.scanAsync();
  } catch (error) {
    throw toScannerError(error);
  }

  if (result?.status === 'cancelled') {
    return { status: 'cancelled' };
  }
  if (result?.status !== 'completed' || !Array.isArray(result.pages)) {
    throw new ScannerError(SCAN_ERRORS.INVALID_RESULT, 'The scanner returned an unknown result');
  }
  if (result.pages.length === 0) {
    return { status: 'cancelled' };
  }
  if (!result.pages.every(isValidPage)) {
    throw new ScannerError(SCAN_ERRORS.INVALID_RESULT, 'The scanner returned an unusable page');
  }
  return { status: 'completed', pages: result.pages };
}
