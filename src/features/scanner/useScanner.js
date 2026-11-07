import { useCallback, useEffect, useRef, useState } from 'react';

import { getScannerAvailability, prepareScanner, scanDocument, SCAN_ERRORS } from './scanner';

export const PHASES = Object.freeze({
  CHECKING: 'checking',
  IDLE: 'idle',
  PREPARING: 'preparing',
  SCANNING: 'scanning',
});

export function useScanner() {
  const [phase, setPhase] = useState(PHASES.CHECKING);
  const [availability, setAvailability] = useState(null);
  const [pages, setPages] = useState([]);
  const [cancelled, setCancelled] = useState(false);
  const [errorCode, setErrorCode] = useState(null);
  const busy = useRef(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  // Runs one action at a time, because a double tap must not open two scanners.
  const run = useCallback(async (nextPhase, action) => {
    if (busy.current) {
      return;
    }
    busy.current = true;
    setPhase(nextPhase);
    setErrorCode(null);
    try {
      await action();
    } catch (error) {
      if (mounted.current) {
        setErrorCode(error?.code ?? SCAN_ERRORS.FAILED);
      }
    } finally {
      busy.current = false;
      if (mounted.current) {
        setPhase(PHASES.IDLE);
      }
    }
  }, []);

  const checkAvailability = useCallback(async () => {
    const result = await getScannerAvailability();
    if (mounted.current) {
      setAvailability(result);
    }
  }, []);

  const refresh = useCallback(
    () => run(PHASES.CHECKING, checkAvailability),
    [run, checkAvailability],
  );

  const prepare = useCallback(
    () =>
      run(PHASES.PREPARING, async () => {
        await prepareScanner();
        await checkAvailability();
      }),
    [run, checkAvailability],
  );

  const scan = useCallback(
    () =>
      run(PHASES.SCANNING, async () => {
        // A new scan replaces the temporary files of the previous one.
        setPages([]);
        setCancelled(false);
        const result = await scanDocument();
        if (!mounted.current) {
          return;
        }
        if (result.status === 'cancelled') {
          setCancelled(true);
        } else {
          setPages(result.pages);
        }
      }),
    [run],
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { phase, availability, pages, cancelled, errorCode, refresh, prepare, scan };
}
