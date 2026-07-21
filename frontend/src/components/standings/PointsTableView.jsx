import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronUp,
  ChevronDown,
  ChevronsUpDown,
  Crown,
  Medal,
  TrendingUp,
  TrendingDown,
  Minus,
  Loader2,
  BarChart3,
} from "lucide-react";
import {
  STANDINGS_COLUMNS,
  STANDINGS_COLUMNS_COMPACT,
  filterStandingsRows,
  formatNetRunRate,
  nrrTone,
} from "../../utils/standings";

function initials(name = "") {
  return name.split(" ").slice(0, 2).map((w) => w[0] || "").join("").toUpperCase() || "?";
}

const AVATAR_PALETTE = [
  "bg-primary/10 text-primary",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-700",
  "bg-purple-100 text-purple-700",
  "bg-cyan-100 text-cyan-700",
  "bg-rose-100 text-rose-700",
  "bg-indigo-100 text-indigo-700",
  "bg-orange-100 text-orange-700",
];

function avatarBg(name = "") {
  const n = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_PALETTE[n % AVATAR_PALETTE.length];
}

function PositionBadge({ pos }) {
  if (pos === 1) {
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-100 text-amber-600">
        <Crown className="w-3.5 h-3.5" />
      </span>
    );
  }
  if (pos === 2) {
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-200 text-slate-600">
        <Medal className="w-3.5 h-3.5" />
      </span>
    );
  }
  if (pos === 3) {
    return (
      <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-orange-100 text-orange-600">
        <Medal className="w-3.5 h-3.5" />
      </span>
    );
  }
  return (
    <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-500 text-xs font-bold">
      {pos}
    </span>
  );
}

function TeamAvatar({ name, logo, size = "w-8 h-8" }) {
  if (logo) {
    return (
      <div className={`${size} rounded-full overflow-hidden flex-shrink-0 border border-slate-200 bg-white`}>
        <img src={logo} alt={name} className="w-full h-full object-cover" />
      </div>
    );
  }
  return (
    <div className={`${size} rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${avatarBg(name)}`}>
      {initials(name)}
    </div>
  );
}

function NrrValue({ value }) {
  const n = Number(value) || 0;
  const tone = nrrTone(n);
  const Icon = tone === "neutral" ? Minus : tone === "positive" ? TrendingUp : TrendingDown;
  const color =
    tone === "neutral" ? "text-slate-500" : tone === "positive" ? "text-emerald-600" : "text-red-500";

  return (
    <span className={`inline-flex items-center gap-1 font-semibold tabular-nums ${color}`}>
      <Icon className="w-3.5 h-3.5" />
      {formatNetRunRate(n)}
    </span>
  );
}

function SortIcon({ active, dir }) {
  if (!active) return <ChevronsUpDown className="w-3.5 h-3.5 text-slate-300" />;
  return dir === "asc" ? (
    <ChevronUp className="w-3.5 h-3.5 text-primary" />
  ) : (
    <ChevronDown className="w-3.5 h-3.5 text-primary" />
  );
}

function Stat({ label, value, valueClass = "text-secondary" }) {
  return (
    <div>
      <p className="text-[10px] text-text-muted uppercase tracking-wider mb-0.5">{label}</p>
      <p className={`text-sm font-semibold tabular-nums ${valueClass}`}>{value}</p>
    </div>
  );
}

function cellValue(row, key) {
  if (key === "netRunRate") return row.netRunRate ?? row.nrr ?? 0;
  if (key === "oversFacedDisplay") return row.oversFacedDisplay ?? "0";
  if (key === "oversBowledDisplay") return row.oversBowledDisplay ?? "0";
  return row[key] ?? 0;
}

export default function PointsTableView({
  rows = [],
  qualifyingSpots = 0,
  loading = false,
  error = "",
  search = "",
  compact = false,
  variant = "dashboard",
  emptyMessage = "No teams in this tournament yet",
  emptyHint = "Add teams and complete matches to see standings",
  className = "",
}) {
  const [sort, setSort] = useState({ key: "position", dir: "asc" });

  const columns = compact ? STANDINGS_COLUMNS_COMPACT : STANDINGS_COLUMNS;

  const displayRows = useMemo(() => {
    const filtered = filterStandingsRows(rows, search);
    const { key, dir } = sort;
    const factor = dir === "asc" ? 1 : -1;

    if (key === "position") {
      return filtered;
    }

    return [...filtered].sort((a, b) => {
      if (key === "name") return a.name.localeCompare(b.name) * factor;
      const av = cellValue(a, key);
      const bv = cellValue(b, key);
      if (typeof av === "string" || typeof bv === "string") {
        return String(av).localeCompare(String(bv)) * factor;
      }
      return (av - bv) * factor;
    });
  }, [rows, search, sort]);

  const toggleSort = (key) => {
    setSort((prev) =>
      prev.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: key === "name" || key === "position" ? "asc" : "desc" }
    );
  };

  const isQualifying = (pos) => qualifyingSpots > 0 && pos <= qualifyingSpots;
  const cardClass = variant === "public" ? "rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04)]" : "card-premium";

  if (loading) {
    return (
      <div className={`${cardClass} flex flex-col items-center justify-center py-16 text-center ${className}`}>
        <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
        <p className="text-sm text-text-muted">Loading points table…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${cardClass} flex flex-col items-center justify-center py-16 text-center ${className}`}>
        <p className="text-sm font-medium text-red-600">{error}</p>
      </div>
    );
  }

  if (!displayRows.length) {
    return (
      <div className={`${cardClass} flex flex-col items-center justify-center py-16 text-center ${className}`}>
        <BarChart3 className="w-10 h-10 text-slate-300 mb-2" />
        <p className="text-sm font-medium text-secondary">{search ? "No teams found" : emptyMessage}</p>
        <p className="text-xs text-text-muted mt-1">{search ? "Try a different search term" : emptyHint}</p>
      </div>
    );
  }

  return (
    <>
      <div className={`${cardClass} overflow-hidden hidden lg:block ${className}`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    title={col.title}
                    onClick={col.sortable ? () => toggleSort(col.key) : undefined}
                    className={`px-3 py-3 font-semibold text-text-muted whitespace-nowrap ${
                      col.align === "left" ? "text-left" : "text-center"
                    } ${col.sortable ? "cursor-pointer select-none hover:text-secondary transition-colors" : ""}`}
                  >
                    <span className={`inline-flex items-center gap-1 ${col.align === "center" ? "justify-center" : ""}`}>
                      {col.label}
                      {col.sortable && <SortIcon active={sort.key === col.key} dir={sort.dir} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {displayRows.map((t, i) => (
                  <motion.tr
                    key={t.teamId || t.id || t.name}
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className={`border-b border-slate-100 hover:bg-slate-50/60 transition-colors ${
                      isQualifying(t.position) ? "bg-primary/[0.03]" : ""
                    }`}
                  >
                    <td className="px-3 py-3 text-center">
                      <PositionBadge pos={t.position} />
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-2.5 min-w-[160px]">
                        <TeamAvatar name={t.name} logo={t.logo} />
                        <div className="min-w-0">
                          <p className="font-semibold text-secondary truncate">{t.name}</p>
                          {t.city && <p className="text-xs text-text-muted truncate">{t.city}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-center tabular-nums">{t.played}</td>
                    <td className="px-3 py-3 text-center text-emerald-600 font-semibold tabular-nums">{t.won}</td>
                    <td className="px-3 py-3 text-center text-red-500 font-semibold tabular-nums">{t.lost}</td>
                    <td className="px-3 py-3 text-center text-slate-600 tabular-nums">{t.tied}</td>
                    <td className="px-3 py-3 text-center text-slate-500 tabular-nums">{t.noResult}</td>
                    <td className="px-3 py-3 text-center">
                      <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-lg bg-primary/10 text-primary font-bold tabular-nums">
                        {t.points}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      <NrrValue value={t.netRunRate ?? t.nrr} />
                    </td>
                    {!compact && (
                      <>
                        <td className="px-3 py-3 text-center tabular-nums text-secondary">{t.runsScored}</td>
                        <td className="px-3 py-3 text-center tabular-nums text-secondary">{t.oversFacedDisplay ?? "0"}</td>
                        <td className="px-3 py-3 text-center tabular-nums text-secondary">{t.runsConceded}</td>
                        <td className="px-3 py-3 text-center tabular-nums text-secondary">{t.oversBowledDisplay ?? "0"}</td>
                      </>
                    )}
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      <div className={`lg:hidden space-y-3 ${className}`}>
        <AnimatePresence>
          {displayRows.map((t, i) => (
            <motion.div
              key={t.teamId || t.id || t.name}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ delay: i * 0.02 }}
              className={`${cardClass} p-4 ${isQualifying(t.position) ? "border-l-4 border-l-primary" : ""}`}
            >
              <div className="flex items-center gap-3">
                <PositionBadge pos={t.position} />
                <TeamAvatar name={t.name} logo={t.logo} size="w-9 h-9" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-secondary text-sm truncate">{t.name}</p>
                  {t.city && <p className="text-xs text-text-muted">{t.city}</p>}
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-lg font-extrabold text-primary leading-none tabular-nums">{t.points}</p>
                  <p className="text-[10px] text-text-muted mt-0.5">PTS</p>
                </div>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 mt-3 pt-3 border-t border-slate-100 text-center">
                <Stat label="P" value={t.played} />
                <Stat label="W" value={t.won} valueClass="text-emerald-600" />
                <Stat label="L" value={t.lost} valueClass="text-red-500" />
                <Stat label="T" value={t.tied} />
                <Stat label="NR" value={t.noResult} valueClass="text-slate-500" />
                <div className="col-span-2 sm:col-span-2">
                  <p className="text-[10px] text-text-muted uppercase tracking-wider mb-0.5">NRR</p>
                  <p
                    className={`text-xs font-semibold tabular-nums ${
                      nrrTone(t.netRunRate ?? t.nrr) === "positive"
                        ? "text-emerald-600"
                        : nrrTone(t.netRunRate ?? t.nrr) === "negative"
                          ? "text-red-500"
                          : "text-slate-500"
                    }`}
                  >
                    {formatNetRunRate(t.netRunRate ?? t.nrr)}
                  </p>
                </div>
              </div>

              {!compact && (t.runsScored > 0 || t.runsConceded > 0) && (
                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 text-xs text-text-muted">
                  <span>RS {t.runsScored} ({t.oversFacedDisplay ?? "0"} ov)</span>
                  <span className="text-right">RC {t.runsConceded} ({t.oversBowledDisplay ?? "0"} ov)</span>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {qualifyingSpots > 0 && (
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-1 text-xs text-text-muted">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-primary/20 border border-primary/30" />
            Qualification zone (Top {qualifyingSpots})
          </span>
          <span>P&nbsp;Played · W&nbsp;Won · L&nbsp;Lost · T&nbsp;Tied · NR&nbsp;No Result</span>
          <span>PTS = 2×W + 1×(T+NR)</span>
        </div>
      )}
    </>
  );
}
