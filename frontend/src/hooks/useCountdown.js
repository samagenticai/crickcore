import { useEffect, useState } from "react";
import { getCountdownParts } from "../utils/tournamentViewer";

/**
 * Tick every second for smooth countdown / live transition without a page refresh.
 */
export function useCountdown(targetDate, { enabled = true } = {}) {
  const [parts, setParts] = useState(() => (enabled && targetDate ? getCountdownParts(targetDate) : null));

  useEffect(() => {
    if (!enabled || !targetDate) {
      setParts(null);
      return;
    }

    const tick = () => setParts(getCountdownParts(targetDate));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [targetDate, enabled]);

  return parts;
}
