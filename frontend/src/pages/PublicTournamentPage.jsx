import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Trophy, Calendar, MapPin, Swords, BarChart3, Radio, ChevronDown,
  Loader2, Crown, Medal, Lock, Globe, CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { tournamentAPI } from "../api/tournaments";
import { mediaUrl } from "../utils/media";
import TournamentVenueDetails from "../components/dashboard/TournamentVenueDetails";
import { tournamentVenueLabel } from "../utils/tournamentVenue";

const TOURNAMENT_STORAGE_KEY = "cm_public_tournament_id";

const STATUS_BADGE = {
  Draft: "bg-slate-100 text-slate-600",
  Upcoming: "bg-blue-50 text-blue-700",
  Live: "bg-red-50 text-red-700",
  Completed: "bg-emerald-50 text-emerald-700",
  Cancelled: "bg-orange-50 text-orange-700",
};

const MATCH_STATUS = {
  Scheduled: "bg-blue-50 text-blue-700 border-blue-200",
  Live: "bg-red-50 text-red-700 border-red-200",
  Completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Cancelled: "bg-orange-50 text-orange-700 border-orange-200",
};

function teamName(team, slot) {
  return (team && team.name) || slot?.label || "TBD";
}

function teamId(team) {
  return team && (team._id || team.id) ? String(team._id || team.id) : null;
}

function computeStandings(teams, matches) {
  const table = new Map();

  const ensure = (team) => {
    const id = teamId(team);
    if (!id) return null;
    if (!table.has(id)) {
      table.set(id, { id, name: team.name || "Unknown", played: 0, won: 0, lost: 0, points: 0 });
    }
    return table.get(id);
  };

  (teams || []).forEach(ensure);
  (matches || []).forEach((m) => {
    if (!teamId(m.teamA) || !teamId(m.teamB)) return;
    const rowA = ensure(m.teamA);
    const rowB = ensure(m.teamB);
    if (!rowA || !rowB) return;
    if (m.status === "Completed" && m.winner) {
      rowA.played += 1;
      rowB.played += 1;
      const winnerId = teamId(m.winner);
      if (winnerId === rowA.id) { rowA.won += 1; rowA.points += 2; rowB.lost += 1; }
      else if (winnerId === rowB.id) { rowB.won += 1; rowB.points += 2; rowA.lost += 1; }
    }
  });

  return [...table.values()].sort((a, b) => b.points - a.points || b.won - a.won);
}

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "TBD";

function pickInitialTournamentId(list, urlId) {
  if (urlId && list.some((t) => t._id === urlId)) return urlId;
  const stored = sessionStorage.getItem(TOURNAMENT_STORAGE_KEY);
  if (stored && list.some((t) => t._id === stored)) return stored;
  return list[0]?._id || "";
}

// Read-only tournament viewer embedded in the organizer dashboard.
export default function PublicTournamentPage() {
  const [searchParams] = useSearchParams();
  const [tournaments, setTournaments] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [tournament, setTournament] = useState(null);
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loadingList, setLoadingList] = useState(true);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState("overview");

  useEffect(() => {
    (async () => {
      setLoadingList(true);
      try {
        const { data } = await tournamentAPI.getAll({ limit: 100 });
        const list = (data.data || []).filter((t) => t.isPublished !== false);
        setTournaments(list);
        const urlId = searchParams.get("tournament");
        const initial = pickInitialTournamentId(list, urlId);
        if (initial) {
          setSelectedId(initial);
          sessionStorage.setItem(TOURNAMENT_STORAGE_KEY, initial);
        }
      } catch (err) {
        toast.error(err?.message || "Failed to load tournaments");
      } finally {
        setLoadingList(false);
      }
    })();
  }, [searchParams]);

  const handleTournamentChange = (id) => {
    setSelectedId(id);
    sessionStorage.setItem(TOURNAMENT_STORAGE_KEY, id);
  };

  const loadTournament = useCallback(async () => {
    if (!selectedId) return;
    setLoading(true);
    try {
      const [tRes, teamsRes, fixturesRes] = await Promise.all([
        tournamentAPI.getOne(selectedId),
        tournamentAPI.getTournamentTeams(selectedId),
        tournamentAPI.getTournamentFixtures(selectedId),
      ]);
      setTournament(tRes.data.data);
      setTeams(teamsRes.data.data || []);
      setMatches(fixturesRes.data.data || []);
    } catch (err) {
      toast.error(err?.message || "Failed to load tournament");
      setTournament(null);
      setTeams([]);
      setMatches([]);
    } finally {
      setLoading(false);
    }
  }, [selectedId]);

  useEffect(() => { loadTournament(); }, [loadTournament]);

  const standings = useMemo(() => computeStandings(teams, matches), [teams, matches]);
  const liveMatches = useMemo(() => matches.filter((m) => m.status === "Live"), [matches]);
  const upcomingMatches = useMemo(() => matches.filter((m) => m.status === "Scheduled"), [matches]);
  const completedMatches = useMemo(
    () => matches.filter((m) => m.status === "Completed").sort((a, b) => (b.matchNumber || 0) - (a.matchNumber || 0)),
    [matches]
  );

  const banner = mediaUrl(tournament?.bannerImage);
  const logo = mediaUrl(tournament?.tournamentLogo);

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Page header */}
      <div className="rounded-[1.5rem] border border-primary/15 bg-gradient-to-r from-primary/8 via-white to-accent/8 p-5 shadow-[0_4px_20px_rgba(22,163,74,0.06)] sm:p-6">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-primary">Public view</p>
            <h2 className="mt-2 text-2xl font-semibold text-secondary">Tournament Viewer</h2>
            <p className="mt-2 text-sm text-text-muted">
              Read-only preview of how fans will see your tournament — banner, live scores, fixtures, standings, and results.
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-primary/10 text-primary shrink-0">
            <Lock className="w-3.5 h-3.5" />
            Read-only
          </span>
        </div>
      </div>

      {/* Tournament selector */}
      <div className="card-premium p-4">
        <label className="text-xs font-semibold uppercase tracking-wider text-text-muted block mb-2">
          Tournament
        </label>
        {loadingList ? (
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading tournaments…
          </div>
        ) : tournaments.length === 0 ? (
          <p className="text-sm text-text-muted">No published tournaments available yet.</p>
        ) : (
          <div className="relative max-w-md">
            <select
              value={selectedId}
              onChange={(e) => handleTournamentChange(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-secondary outline-none focus:ring-2 focus:ring-primary/25 appearance-none"
            >
              {tournaments.map((t) => (
                <option key={t._id} value={t._id}>{t.tournamentName}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
        )}
      </div>

      {loading ? (
        <div className="card-premium p-12 flex items-center justify-center gap-2 text-text-muted">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading tournament…
        </div>
      ) : tournament ? (
        <div className="space-y-6">
          {/* Tournament hero */}
          <div className="card-premium overflow-hidden">
            <div className="relative h-36 sm:h-44 bg-slate-100">
              {banner ? (
                <img src={banner} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-primary/80 via-primary to-accent/60" />
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40" />
              <div className="absolute -bottom-8 left-5">
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-4 border-white shadow-xl overflow-hidden bg-white flex items-center justify-center">
                  {logo ? (
                    <img src={logo} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Trophy className="w-8 h-8 text-primary" />
                  )}
                </div>
              </div>
            </div>
            <div className="pt-10 sm:pt-12 px-5 pb-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-secondary">{tournament.tournamentName}</h3>
                  <p className="text-sm text-text-muted mt-1">{tournament.tournamentType} · {tournament.ballType}</p>
                </div>
                <span className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_BADGE[tournament.status] || STATUS_BADGE.Draft}`}>
                  {tournament.status}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-text-muted">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-primary/70" />
                  {fmtDate(tournament.startDate)} – {fmtDate(tournament.endDate)}
                </span>
                {(tournamentVenueLabel(tournament) !== "—") && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-primary/70" />
                    {tournamentVenueLabel(tournament)}
                  </span>
                )}
              </div>
              <div className="mt-4">
                <TournamentVenueDetails tournament={tournament} />
              </div>
            </div>
          </div>

          {/* Winner & runner-up */}
          {tournament.status === "Completed" && (tournament.winner || tournament.runnerUp) && (
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="card-premium p-4 flex items-center gap-3 bg-gradient-to-r from-amber-50 to-emerald-50 border-amber-200">
                <span className="text-2xl">🏆</span>
                <div>
                  <p className="text-[10px] font-semibold uppercase text-text-muted">Winner</p>
                  <p className="font-bold text-secondary">{tournament.winner?.name || "—"}</p>
                </div>
              </div>
              <div className="card-premium p-4 flex items-center gap-3">
                <span className="text-2xl">🥈</span>
                <div>
                  <p className="text-[10px] font-semibold uppercase text-text-muted">Runner-up</p>
                  <p className="font-bold text-secondary">{tournament.runnerUp?.name || "—"}</p>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 rounded-xl bg-slate-100 p-1 overflow-x-auto">
            {[
              { id: "overview", label: "Overview", icon: Globe },
              { id: "live", label: "Live Score", icon: Radio },
              { id: "fixtures", label: "Fixtures", icon: Swords },
              { id: "points", label: "Points Table", icon: BarChart3 },
              { id: "results", label: "Match Results", icon: CheckCircle2 },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                  tab === id ? "bg-white text-primary shadow-sm" : "text-text-muted hover:text-secondary"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>

          {tab === "overview" && (
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="card-premium p-4 text-center">
                <p className="text-2xl font-bold text-red-600">{liveMatches.length}</p>
                <p className="text-xs text-text-muted mt-1">Live Matches</p>
              </div>
              <div className="card-premium p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{upcomingMatches.length}</p>
                <p className="text-xs text-text-muted mt-1">Upcoming</p>
              </div>
              <div className="card-premium p-4 text-center">
                <p className="text-2xl font-bold text-emerald-600">{completedMatches.length}</p>
                <p className="text-xs text-text-muted mt-1">Completed</p>
              </div>
            </div>
          )}

          {tab === "live" && (
            <div className="space-y-3">
              {liveMatches.length === 0 ? (
                <div className="card-premium p-8 text-center text-sm text-text-muted">
                  No live matches right now. Scores will appear here when a match is in progress.
                </div>
              ) : (
                liveMatches.map((m) => (
                  <div key={m._id} className="card-premium p-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-secondary">
                        {teamName(m.teamA, m.teamASlot)}{" "}
                        <span className="text-text-muted text-xs font-normal">vs</span>{" "}
                        {teamName(m.teamB, m.teamBSlot)}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5">{m.round} · {fmtDate(m.scheduledDate)}</p>
                    </div>
                    <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border animate-pulse ${MATCH_STATUS.Live}`}>
                      LIVE
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "fixtures" && (
            <div className="space-y-3">
              {matches.length === 0 ? (
                <div className="card-premium p-8 text-center text-sm text-text-muted">No fixtures generated yet.</div>
              ) : (
                matches.map((m) => (
                  <div key={m._id} className="card-premium p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-secondary text-sm">
                        {teamName(m.teamA, m.teamASlot)} vs {teamName(m.teamB, m.teamBSlot)}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5">
                        {m.round} · {fmtDate(m.scheduledDate)} · {m.matchTime || "TBD"}
                      </p>
                    </div>
                    <span className={`self-start text-[11px] font-semibold px-2.5 py-1 rounded-full border ${MATCH_STATUS[m.status] || MATCH_STATUS.Scheduled}`}>
                      {m.status}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "points" && (
            <div className="card-premium overflow-hidden">
              {standings.length === 0 ? (
                <div className="p-8 text-center text-sm text-text-muted">No standings data yet.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80">
                      <th className="text-left px-4 py-3 font-semibold text-secondary">#</th>
                      <th className="text-left px-4 py-3 font-semibold text-secondary">Team</th>
                      <th className="text-center px-4 py-3 font-semibold text-text-muted">P</th>
                      <th className="text-center px-4 py-3 font-semibold text-text-muted">W</th>
                      <th className="text-center px-4 py-3 font-semibold text-text-muted">L</th>
                      <th className="text-center px-4 py-3 font-semibold text-text-muted">PTS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((row, i) => (
                      <tr key={row.id} className="border-b border-slate-100 last:border-0">
                        <td className="px-4 py-3">
                          {i === 0 ? <Crown className="w-4 h-4 text-amber-500" /> : i === 1 ? <Medal className="w-4 h-4 text-slate-400" /> : i + 1}
                        </td>
                        <td className="px-4 py-3 font-semibold text-secondary">{row.name}</td>
                        <td className="px-4 py-3 text-center text-text-muted">{row.played}</td>
                        <td className="px-4 py-3 text-center text-text-muted">{row.won}</td>
                        <td className="px-4 py-3 text-center text-text-muted">{row.lost}</td>
                        <td className="px-4 py-3 text-center font-bold text-primary">{row.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {tab === "results" && (
            <div className="space-y-3">
              {completedMatches.length === 0 ? (
                <div className="card-premium p-8 text-center text-sm text-text-muted">No completed matches yet.</div>
              ) : (
                completedMatches.map((m) => {
                  const winnerName = m.winner ? teamName(m.winner) : null;
                  return (
                    <div key={m._id} className="card-premium p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-secondary text-sm">
                          {teamName(m.teamA, m.teamASlot)} vs {teamName(m.teamB, m.teamBSlot)}
                        </p>
                        <p className="text-xs text-text-muted mt-0.5">
                          {m.round} · Match {m.matchNumber} · {fmtDate(m.scheduledDate)}
                        </p>
                      </div>
                      {winnerName ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Trophy className="w-3.5 h-3.5" />
                          {winnerName} won
                        </span>
                      ) : (
                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${MATCH_STATUS.Completed}`}>
                          Completed
                        </span>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      ) : !loadingList && tournaments.length > 0 ? (
        <div className="card-premium p-8 text-center text-sm text-text-muted">
          Select a tournament to preview the public page.
        </div>
      ) : null}
    </motion.div>
  );
}
