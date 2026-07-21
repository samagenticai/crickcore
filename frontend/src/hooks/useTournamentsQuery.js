import { useCallback, useEffect, useRef, useState } from "react";
import api from "../api/axios";
import { fetchWithRetry } from "../api/fetchWithRetry";
import {
  normalizePagination,
  normalizeTournamentList,
  normalizeTournamentStats,
} from "../utils/tournamentNormalize";
import { logTournament } from "../utils/tournamentLogger";

const SEARCH_DEBOUNCE_MS = 350;

const DEFAULT_STATS = {
  total: 0,
  upcoming: 0,
  live: 0,
  completed: 0,
  draft: 0,
  cancelled: 0,
};

function buildListParams({ search, status, tournamentType, page, showDeleted, limit = 12 }) {
  return {
    search: search || undefined,
    status: status || undefined,
    tournamentType: tournamentType || undefined,
    page,
    limit,
    showDeleted: showDeleted ? "true" : "false",
  };
}

/**
 * Production-ready tournament list + stats fetching.
 */
export function useTournamentsQuery({ search, status, tournamentType, page, showDeleted, limit = 12 }) {
  const [tournaments, setTournaments] = useState([]);
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [pagination, setPagination] = useState({ page: 1, limit, total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const requestGenRef = useRef(0);
  const abortRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    const generation = ++requestGenRef.current;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setStatsLoading(true);
    setError(null);

    const params = buildListParams({
      search: debouncedSearch,
      status,
      tournamentType,
      page,
      showDeleted,
      limit,
    });

    logTournament("request-started", { generation, params });

    try {
      const [listResponse, statsResponse] = await Promise.all([
        fetchWithRetry(() => api.get("/tournaments", { params, signal: controller.signal })),
        fetchWithRetry(() => api.get("/tournaments/tournament-stats", { signal: controller.signal })),
      ]);

      if (generation !== requestGenRef.current) {
        logTournament("response-stale", { generation, current: requestGenRef.current });
        return;
      }

      const items = normalizeTournamentList(listResponse.data?.data);
      const pageInfo = normalizePagination(listResponse.data?.pagination, page);
      const statsPayload = normalizeTournamentStats(statsResponse.data?.data);

      logTournament("response-received", {
        generation,
        count: items.length,
        total: pageInfo.total,
        statsTotal: statsPayload.total,
      });

      setTournaments(items);
      setPagination(pageInfo);
      setStats(statsPayload);
      setError(null);

      logTournament("state-updated", { generation, renderedCount: items.length });
    } catch (err) {
      if (err?.code === "ERR_CANCELED" || err?.canceled) {
        logTournament("request-cancelled", { generation });
        return;
      }

      if (generation !== requestGenRef.current) return;

      logTournament("request-failed", { generation, message: err.message });
      setError(err.message || "Failed to load tournaments");
    } finally {
      if (generation === requestGenRef.current) {
        setLoading(false);
        setStatsLoading(false);
      }
    }
  }, [debouncedSearch, status, tournamentType, page, showDeleted, limit]);

  useEffect(() => {
    load();
    return () => {
      abortRef.current?.abort();
    };
  }, [load]);

  const refresh = useCallback(async () => {
    await load();
  }, [load]);

  return {
    tournaments,
    stats,
    pagination,
    loading,
    statsLoading,
    error,
    refresh,
  };
}
