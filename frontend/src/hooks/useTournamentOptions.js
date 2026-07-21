import { useCallback, useEffect, useRef, useState } from "react";
import { tournamentAPI, parseTournamentListResponse } from "../api/tournaments";
import { logTournament } from "../utils/tournamentLogger";

/**
 * Lightweight tournament list for dropdowns (Teams, Fixtures, Matches pages).
 * Uses the same retry + stale-response guards as the main tournaments page.
 */
export function useTournamentOptions(limit = 100) {
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const requestGenRef = useRef(0);
  const abortRef = useRef(null);

  const load = useCallback(async () => {
    const generation = ++requestGenRef.current;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    logTournament("options-request-started", { generation, limit });

    try {
      const { data } = await tournamentAPI.getAll({ limit, signal: controller.signal });
      if (generation !== requestGenRef.current) return;

      const items = parseTournamentListResponse(data);
      logTournament("options-response-received", { generation, count: items.length });
      setOptions(items);
    } catch (err) {
      if (err?.code === "ERR_CANCELED" || err?.canceled) return;
      if (generation !== requestGenRef.current) return;
      setError(err.message || "Failed to load tournaments");
    } finally {
      if (generation === requestGenRef.current) setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    load();
    return () => abortRef.current?.abort();
  }, [load]);

  return { options, loading, error, refresh: load };
}
