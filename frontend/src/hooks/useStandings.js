import { useCallback, useEffect, useRef, useState } from "react";
import { tournamentAPI } from "../api/tournaments";
import { publicAPI } from "../api/public";

function standingsFingerprint(data) {
  if (!data?.rows?.length) return "";
  return data.rows
    .map((r) =>
      [
        r.teamId,
        r.position,
        r.played,
        r.won,
        r.lost,
        r.tied,
        r.noResult,
        r.points,
        r.netRunRate,
        r.runsScored,
        r.oversFaced,
        r.runsConceded,
        r.oversBowled,
      ].join(":")
    )
    .join("|");
}

/**
 * Fetch tournament standings from the backend API only (no client-side calculation).
 * Supports polling for real-time updates after match completion.
 */
export function useStandings(tournamentId, {
  public: isPublic = false,
  enabled = true,
  pollMs = 0,
} = {}) {
  const [standings, setStandings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const generationRef = useRef(0);
  const lastFingerprintRef = useRef("");

  const fetchStandings = useCallback(
    async (silent = false) => {
      if (!tournamentId || !enabled) {
        setStandings(null);
        return;
      }

      const generation = ++generationRef.current;
      if (!silent) {
        setLoading(true);
        setError("");
      }

      try {
        const response = isPublic
          ? await publicAPI.getStandings(tournamentId)
          : await tournamentAPI.getStandings(tournamentId);

        if (generation !== generationRef.current) return;

        const data = response.data?.data ?? null;
        const fingerprint = standingsFingerprint(data);

        if (silent && fingerprint && fingerprint === lastFingerprintRef.current) {
          return;
        }

        lastFingerprintRef.current = fingerprint;
        setStandings(data);
        setError("");
      } catch (err) {
        if (generation !== generationRef.current) return;
        setError(err?.message || "Failed to load points table");
        if (!silent) setStandings(null);
      } finally {
        if (generation === generationRef.current && !silent) {
          setLoading(false);
        }
      }
    },
    [tournamentId, enabled, isPublic]
  );

  useEffect(() => {
    lastFingerprintRef.current = "";
    fetchStandings(false);
  }, [fetchStandings]);

  useEffect(() => {
    if (!pollMs || !enabled || !tournamentId) return;

    const id = setInterval(() => fetchStandings(true), pollMs);

    const onVisible = () => {
      if (document.visibilityState === "visible") fetchStandings(true);
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [pollMs, enabled, tournamentId, fetchStandings]);

  return {
    standings,
    rows: standings?.rows ?? [],
    qualifyingSpots: standings?.qualifyingSpots ?? 0,
    updatedAt: standings?.updatedAt ?? null,
    loading,
    error,
    refresh: () => fetchStandings(false),
    silentRefresh: () => fetchStandings(true),
  };
}
