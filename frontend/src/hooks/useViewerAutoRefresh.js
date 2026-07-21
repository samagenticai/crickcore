import { useEffect, useRef } from "react";

/**
 * Polls while the viewer tab is open and refetches when the tab becomes visible again.
 * Used so live match status and Playing XI update without a manual refresh.
 */
export function useViewerAutoRefresh(callback, { enabled = true, intervalMs = 20000 } = {}) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    const run = () => savedCallback.current?.();

    const id = setInterval(run, intervalMs);

    const onVisible = () => {
      if (document.visibilityState === "visible") run();
    };

    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [enabled, intervalMs]);
}
