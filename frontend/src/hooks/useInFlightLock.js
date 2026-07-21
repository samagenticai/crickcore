import { useCallback, useRef, useState } from "react";

/**
 * Prevents duplicate async actions from double-clicks or overlapping calls.
 * lockRef updates synchronously; isLocked drives disabled UI state.
 */
export function useInFlightLock() {
  const lockRef = useRef(false);
  const [isLocked, setIsLocked] = useState(false);

  const withLock = useCallback(async (fn) => {
    if (lockRef.current) return null;
    lockRef.current = true;
    setIsLocked(true);
    try {
      return await fn();
    } finally {
      lockRef.current = false;
      setIsLocked(false);
    }
  }, []);

  const isInFlight = useCallback(() => lockRef.current, []);

  return { isLocked, isInFlight, withLock };
}
