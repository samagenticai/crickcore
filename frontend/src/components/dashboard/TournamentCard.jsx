import { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trophy, Calendar, Users, MoreVertical, Pencil, Trash2, Copy,
  Archive, ArchiveRestore, Eye, EyeOff, Zap,
  MapPin, Lock, CalendarDays, CalendarCheck,
} from "lucide-react";
import { mediaUrl } from "../../utils/media";
import { getTournamentVenue } from "../../utils/tournamentVenue";

const STATUS_CONFIG = {
  Draft: { color: "bg-slate-100 text-slate-600 border-slate-200", dot: "bg-slate-400" },
  Upcoming: { color: "bg-blue-50 text-blue-700 border-blue-200", dot: "bg-blue-500" },
  Live: { color: "bg-red-50 text-red-700 border-red-200", dot: "bg-red-500", pulse: true },
  Completed: { color: "bg-emerald-50 text-emerald-700 border-emerald-200", dot: "bg-emerald-500" },
  Cancelled: { color: "bg-orange-50 text-orange-700 border-orange-200", dot: "bg-orange-400" },
};

const TYPE_COLORS = {
  "Group Stage": "bg-emerald-100 text-emerald-700",
  "Knockout (Single Elimination)": "bg-purple-100 text-purple-700",
  "Round Robin (League)": "bg-blue-100 text-blue-700",
  "Double Round Robin": "bg-cyan-100 text-cyan-700",
  "Hybrid (Group Stage + Knockout)": "bg-amber-100 text-amber-700",
  // Legacy values (existing records)
  Knockout: "bg-purple-100 text-purple-700",
  "Round Robin": "bg-cyan-100 text-cyan-700",
  League: "bg-blue-100 text-blue-700",
  "Group Stage + Knockout": "bg-indigo-100 text-indigo-700",
  Hybrid: "bg-amber-100 text-amber-700",
};

const BALL_COLORS = {
  "Tape Ball": "bg-yellow-100 text-yellow-700",
  "Tennis Ball": "bg-lime-100 text-lime-700",
  "Hard Ball": "bg-rose-100 text-rose-700",
};

function getCountdown(startDate, status) {
  if (status === "Live") return { label: "LIVE NOW", class: "bg-red-500 text-white animate-pulse" };
  if (status === "Completed") return null;
  if (!startDate) return null;
  const diff = Math.ceil((new Date(startDate) - new Date()) / (1000 * 60 * 60 * 24));
  if (diff < 0) return null;
  if (diff === 0) return { label: "Starts Today", class: "bg-amber-500 text-white" };
  if (diff <= 7) return { label: `${diff}d to start`, class: "bg-amber-100 text-amber-700" };
  return { label: `${diff} days`, class: "bg-slate-100 text-slate-600" };
}

const MENU_WIDTH = 192; // matches w-48

function ActionMenu({ tournament, onEdit, onDelete, onDuplicate, onArchive, onPublish, onGenerateFixtures, onView, locked, storageArchived }) {
  const [open, setOpen] = useState(false);
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const buttonRef = useRef(null);
  const menuRef = useRef(null);

  const items = [
    ...(onView
      ? [{ icon: Eye, label: "View Details", action: onView, className: "text-slate-700" }]
      : []),
    // Editing & fixture generation are hidden once the tournament is locked.
    ...(locked
      ? [{ icon: Copy, label: "Duplicate", action: onDuplicate, className: "text-slate-700" }]
      : [
        { icon: Pencil, label: "Edit", action: onEdit, className: "text-slate-700" },
        { icon: Copy, label: "Duplicate", action: onDuplicate, className: "text-slate-700" },
        { icon: Zap, label: "Generate Fixtures", action: onGenerateFixtures, className: "text-amber-600" },
      ]),
    ...(!storageArchived
      ? [
        { divider: true },
        {
          icon: tournament.isPublished ? EyeOff : Eye,
          label: tournament.isPublished ? "Unpublish" : "Publish",
          action: onPublish,
          className: "text-blue-600",
        },
        {
          icon: tournament.isArchived ? ArchiveRestore : Archive,
          label: tournament.isArchived ? "Unarchive" : "Archive",
          action: onArchive,
          className: "text-slate-600",
        },
      ]
      : []),
    { divider: true },
    // Delete is always available, regardless of tournament status.
    { icon: Trash2, label: "Delete Tournament", action: onDelete, className: "text-red-600" },
  ];

  // Position the portaled dropdown relative to the trigger, right-aligned,
  // clamped to the viewport, and flipped above the button when there isn't
  // enough room below. Using a portal + fixed position frees it from the
  // card's `overflow-hidden`, so it's never clipped.
  const positionMenu = useCallback(() => {
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    const gap = 6;
    const estHeight = items.filter((i) => !i.divider).length * 40 + 24;

    let top = rect.bottom + gap;
    if (top + estHeight > window.innerHeight - 8) {
      top = Math.max(8, rect.top - gap - estHeight);
    }

    let left = rect.right - MENU_WIDTH;
    left = Math.min(left, window.innerWidth - MENU_WIDTH - 8);
    left = Math.max(8, left);

    setCoords({ top, left });
  }, [items]);

  const toggle = (e) => {
    e.stopPropagation();
    setOpen((o) => {
      const next = !o;
      if (next) positionMenu();
      return next;
    });
  };

  useEffect(() => {
    if (!open) return;

    const handleOutside = (e) => {
      if (
        buttonRef.current?.contains(e.target) ||
        menuRef.current?.contains(e.target)
      ) return;
      setOpen(false);
    };
    const handleReposition = () => setOpen(false);
    const handleKey = (e) => { if (e.key === "Escape") setOpen(false); };

    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("keydown", handleKey);
    window.addEventListener("scroll", handleReposition, true);
    window.addEventListener("resize", handleReposition);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("keydown", handleKey);
      window.removeEventListener("scroll", handleReposition, true);
      window.removeEventListener("resize", handleReposition);
    };
  }, [open]);

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        className="p-1.5 rounded-lg hover:bg-white/80 transition-colors"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreVertical className="w-4 h-4 text-slate-500" />
      </button>

      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              ref={menuRef}
              role="menu"
              initial={{ opacity: 0, scale: 0.95, y: -6 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -6 }}
              transition={{ duration: 0.15 }}
              style={{ position: "fixed", top: coords.top, left: coords.left, width: MENU_WIDTH }}
              className="z-[80] bg-white rounded-2xl shadow-xl border border-slate-200/80 overflow-hidden py-1.5"
            >
              {items.map((item, i) =>
                item.divider ? (
                  <div key={`div-${i}`} className="my-1 border-t border-slate-100" />
                ) : (
                  <button
                    key={item.label}
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setOpen(false); item.action?.(); }}
                    className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm hover:bg-slate-50 transition-colors ${item.className}`}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    {item.label}
                  </button>
                )
              )}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}

// A team pill used inside the completed summary (winner / runner-up).
function ResultTeam({ team, place }) {
  const isWinner = place === "winner";
  const name = typeof team === "object" && team ? team.name : null;
  const logo = mediaUrl(typeof team === "object" && team ? team.logo : "");

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-xl border ${isWinner
          ? "bg-gradient-to-r from-amber-50 via-amber-50 to-emerald-50 border-amber-200 shadow-sm shadow-amber-500/10"
          : "bg-slate-50 border-slate-200"
        }`}
    >
      <div className="text-xl flex-shrink-0 leading-none" aria-hidden>
        {isWinner ? "🏆" : "🥈"}
      </div>
      <div
        className={`w-10 h-10 rounded-full border-2 shadow bg-white flex items-center justify-center flex-shrink-0 overflow-hidden ${isWinner ? "border-amber-300" : "border-white"
          }`}
      >
        {logo ? (
          <img src={logo} alt={name || ""} className="w-full h-full object-cover" />
        ) : (
          <Trophy className={`w-4 h-4 ${isWinner ? "text-amber-500" : "text-slate-400"}`} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-text-muted">
          {isWinner ? "Winner" : "Runner-up"}
        </p>
        <p className="text-sm font-bold text-secondary truncate">{name || "—"}</p>
      </div>
    </div>
  );
}

function CompletedSummaryCard({
  tournament,
  winner,
  runnerUp,
  fmt,
  onDelete,
  onDuplicate,
  onArchive,
  onPublish,
  onView,
}) {
  const { tournamentName, startDate, endDate, isStorageArchived, archiveSummary } = tournament;
  const banner = mediaUrl(tournament.bannerImage);
  const logo = mediaUrl(tournament.tournamentLogo);
  const summary = archiveSummary || {};

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="card-premium overflow-hidden flex flex-col group"
    >
      {/* Banner — full-width cover image (Facebook-style) */}
      <div className="relative h-32 sm:h-36 overflow-hidden bg-slate-100">
        {banner ? (
          <img src={banner} alt={`${tournamentName} banner`} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-emerald-500 via-primary to-emerald-600 flex items-center justify-center">
            <Trophy className="w-10 h-10 text-white/40" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/45" />

        {/* Prominent Completed badge */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          <span className="flex items-center gap-1.5 text-[11px] font-extrabold px-3 py-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-white shadow-lg shadow-amber-500/30">
            <span aria-hidden>🏆</span>
            Completed
          </span>
          {isStorageArchived ? (
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-800/90 text-white">
              Storage Archived
            </span>
          ) : null}
        </div>

        <div className="absolute top-2.5 right-2.5">
          <ActionMenu
            tournament={tournament}
            locked
            storageArchived={isStorageArchived}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onArchive={onArchive}
            onPublish={onPublish}
            onView={onView}
          />
        </div>

        {/* Logo — large circular, overlapping the banner (profile-picture style) */}
        <div className="absolute -bottom-10 left-5">
          <div className="w-20 h-20 sm:w-[5.5rem] sm:h-[5.5rem] rounded-full border-4 border-white shadow-xl overflow-hidden bg-white flex items-center justify-center">
            {logo ? (
              <img src={logo} alt={`${tournamentName} logo`} className="w-full h-full object-cover" />
            ) : (
              <Trophy className="w-9 h-9 text-primary" />
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-12 sm:pt-14 px-5 pb-5 flex flex-col flex-1 gap-3.5">
        {/* Name + status */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-secondary text-base leading-tight line-clamp-2 flex-1">
            {tournamentName}
          </h3>
          <span className="flex-shrink-0 flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full border bg-emerald-50 text-emerald-700 border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Completed
          </span>
        </div>

        {/* Winner + runner-up */}
        <div className="flex flex-col gap-2">
          <ResultTeam team={winner} place="winner" />
          <ResultTeam team={runnerUp} place="runnerUp" />
        </div>

        {/* Dates */}
        <div className="mt-auto grid grid-cols-2 gap-2 pt-1">
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-2.5 flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-primary/70 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-text-muted leading-tight">Start Date</p>
              <p className="text-xs font-semibold text-secondary leading-tight truncate">{fmt(startDate)}</p>
            </div>
          </div>
          <div className="rounded-xl bg-slate-50 border border-slate-100 p-2.5 flex items-center gap-2">
            <CalendarCheck className="w-4 h-4 text-primary/70 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[10px] text-text-muted leading-tight">End Date</p>
              <p className="text-xs font-semibold text-secondary leading-tight truncate">{fmt(endDate)}</p>
            </div>
          </div>
        </div>

        {/* Locked / archived hint */}
        <div className="flex flex-col items-center gap-1 text-center">
          {isStorageArchived ? (
            <>
              <p className="text-[11px] text-text-muted max-w-xs">
                This tournament has been archived to optimize storage.
              </p>
              <p className="text-[10px] text-slate-400">
                {summary.totalTeams ?? 0} teams · {summary.totalMatches ?? tournament.totalMatches ?? 0} matches
              </p>
            </>
          ) : (
            <div className="flex items-center justify-center gap-1.5 text-[11px] text-text-muted">
              <Lock className="w-3 h-3" />
              Locked — management actions disabled
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function TournamentCard({
  tournament,
  onEdit,
  onDelete,
  onDuplicate,
  onArchive,
  onPublish,
  onGenerateFixtures,
  onView,
}) {
  const {
    tournamentName,
    tournamentLogo,
    bannerImage,
    tournamentType,
    ballType,
    status,
    startDate,
    endDate,
    numberOfTeams,
    teams = [],
    overs,
    isPublished,
    isArchived,
    winner,
    runnerUp,
  } = tournament;

  const venueInfo = getTournamentVenue(tournament);

  const bannerSrc = mediaUrl(bannerImage);
  const logoSrc = mediaUrl(tournamentLogo);

  const statusConf = STATUS_CONFIG[status] || STATUS_CONFIG.Draft;
  const countdown = getCountdown(startDate, status);
  const teamProgress = numberOfTeams > 0 ? (teams.length / numberOfTeams) * 100 : 0;

  const fmt = (d) =>
    d ? new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "TBD";

  // ── Completed tournaments: show a locked final summary instead of the
  //    usual live/ongoing details, fixtures, and edit actions. ──────────────
  if (status === "Completed") {
    return (
      <CompletedSummaryCard
        tournament={tournament}
        winner={winner}
        runnerUp={runnerUp}
        fmt={fmt}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        onArchive={onArchive}
        onPublish={onPublish}
        onView={onView}
      />
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -3, transition: { duration: 0.2 } }}
      className="card-premium overflow-hidden flex flex-col group"
    >
      {/* Banner */}
      <div className="relative h-28 overflow-hidden bg-slate-100">
        {bannerSrc ? (
          <img src={bannerSrc} alt="banner" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/80 via-primary to-accent/60" />
        )}
        {/* Badges overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/40" />
        <div className="absolute top-2.5 left-2.5 flex gap-1.5 flex-wrap">
          {countdown && (
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${countdown.class}`}>
              {countdown.label}
            </span>
          )}
          {isArchived && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-700 text-white">
              Archived
            </span>
          )}
          {!isPublished && !isArchived && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/50 text-white">
              Draft
            </span>
          )}
        </div>
        <div className="absolute top-2 right-2">
          <ActionMenu
            tournament={tournament}
            onEdit={onEdit}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onArchive={onArchive}
            onPublish={onPublish}
            onGenerateFixtures={onGenerateFixtures}
            onView={onView}
          />
        </div>
        {/* Logo — circular, overlapping banner like a profile picture */}
        <div className="absolute -bottom-6 left-4">
          <div className="w-12 h-12 rounded-full border-[3px] border-white shadow-lg overflow-hidden bg-white flex items-center justify-center">
            {logoSrc ? (
              <img src={logoSrc} alt="logo" className="w-full h-full object-cover" />
            ) : (
              <Trophy className="w-6 h-6 text-primary" />
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-9 px-4 pb-4 flex flex-col flex-1 gap-3">
        {/* Name + status */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-secondary text-sm leading-tight line-clamp-2 flex-1">
            {tournamentName}
          </h3>
          <span className={`flex-shrink-0 flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusConf.color}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${statusConf.dot} ${statusConf.pulse ? "animate-pulse" : ""}`} />
            {status}
          </span>
        </div>

        {/* Badges row */}
        <div className="flex flex-wrap gap-1.5">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[tournamentType] || "bg-slate-100 text-slate-600"}`}>
            {tournamentType}
          </span>
          {ballType && (
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${BALL_COLORS[ballType] || "bg-slate-100 text-slate-600"}`}>
              {ballType}
            </span>
          )}
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {overs} overs
          </span>
        </div>

        {/* Date + City */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-xs text-text-muted">
            <Calendar className="w-3.5 h-3.5 text-primary/70" />
            <span>{fmt(startDate)} → {fmt(endDate)}</span>
          </div>
          {venueInfo && (
            <div className="flex items-center gap-1.5 text-xs text-text-muted">
              <MapPin className="w-3.5 h-3.5 text-primary/70" />
              <span className="truncate">{venueInfo.shortLabel}</span>
            </div>
          )}
        </div>

        {/* Team progress */}
        <div className="mt-auto">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-text-muted flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              Teams
            </span>
            <span className="text-xs font-semibold text-secondary">
              {teams.length} / {numberOfTeams}
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${teamProgress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={`h-full rounded-full ${teamProgress >= 100 ? "bg-emerald-500" : "bg-primary"}`}
            />
          </div>
        </div>

        {/* Action buttons */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/20 transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>
          <button
            type="button"
            onClick={onGenerateFixtures}
            className="flex items-center justify-center gap-1.5 py-2 rounded-xl bg-amber-50 text-amber-700 text-xs font-semibold hover:bg-amber-100 transition-colors"
          >
            <Zap className="w-3.5 h-3.5" />
            Fixtures
          </button>
        </div>
      </div>
    </motion.div>
  );
}
