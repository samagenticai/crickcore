import {
  CircleDot,
  Crosshair,
  Shield,
  Sparkles,
  UserRound,
} from "lucide-react";

export const ROLE_CONFIG = {
  Batsman: {
    label: "Batsman",
    icon: CircleDot,
    badge: "bg-blue-50 text-blue-700 border-blue-200",
  },
  Bowler: {
    label: "Bowler",
    icon: Crosshair,
    badge: "bg-rose-50 text-rose-700 border-rose-200",
  },
  "All-Rounder": {
    label: "All-Rounder",
    icon: Sparkles,
    badge: "bg-amber-50 text-amber-700 border-amber-200",
  },
  "Wicket-Keeper": {
    label: "Wicket Keeper",
    icon: Shield,
    badge: "bg-purple-50 text-purple-700 border-purple-200",
  },
};

export const STATUS_CONFIG = {
  on_strike: {
    label: "On Strike",
    dotClass: "bg-emerald-500 ring-emerald-200",
    className: "bg-emerald-50 text-emerald-800 border-emerald-200",
  },
  non_strike: {
    label: "Non-Striker",
    dotClass: "bg-slate-300 ring-slate-100",
    className: "bg-slate-50 text-slate-700 border-slate-200",
  },
  out: {
    label: "Out",
    dotClass: "bg-red-500 ring-red-200",
    className: "bg-red-50 text-red-800 border-red-200",
  },
  yet_to_bat: {
    label: "Yet to Bat",
    dotClass: "bg-slate-200 ring-slate-100",
    className: "bg-slate-50 text-slate-500 border-slate-200",
  },
  batting: {
    label: "Batting",
    dotClass: "bg-blue-400 ring-blue-100",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  bowling: {
    label: "Bowling",
    dotClass: "bg-amber-500 ring-amber-200",
    className: "bg-amber-50 text-amber-800 border-amber-200",
  },
};

export function RoleBadge({ role, size = "sm" }) {
  const config = ROLE_CONFIG[role] || {
    label: role || "Player",
    icon: UserRound,
    badge: "bg-slate-100 text-slate-600 border-slate-200",
  };
  const Icon = config.icon;
  const text = size === "xs" ? "text-[10px] px-1.5 py-0.5" : "text-[11px] px-2 py-0.5";

  return (
    <span className={`inline-flex items-center gap-1 font-semibold rounded-full border ${text} ${config.badge}`}>
      <Icon className={size === "xs" ? "w-3 h-3" : "w-3.5 h-3.5"} />
      {config.label}
    </span>
  );
}

export function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.yet_to_bat;

  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold rounded-full border px-2.5 py-1 ${config.className}`}>
      <span className={`w-2 h-2 rounded-full shrink-0 ring-2 ${config.dotClass}`} aria-hidden />
      {config.label}
    </span>
  );
}

export function LabeledStat({ label, value, highlight }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-medium text-text-muted">{label}</p>
      <p className={`text-sm font-bold tabular-nums truncate ${highlight ? "text-primary" : "text-secondary"}`}>
        {value}
      </p>
    </div>
  );
}

export function BatsmanStatsGrid({ batsman, compact }) {
  if (batsman.status === "yet_to_bat") {
    return <p className="text-xs text-text-muted italic">Yet to bat</p>;
  }

  const stats = [
    { label: "Runs", value: batsman.runs },
    { label: "Balls", value: batsman.balls },
    { label: "4s", value: batsman.fours },
    { label: "6s", value: batsman.sixes },
    {
      label: "Strike Rate",
      value: Number(batsman.strikeRate || 0).toFixed(2),
      highlight: true,
    },
  ];

  return (
    <div className={`grid gap-3 ${compact ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5"}`}>
      {stats.map(({ label, value, highlight }) => (
        <LabeledStat key={label} label={label} value={value} highlight={highlight} />
      ))}
    </div>
  );
}

export const formatBattingLine = (b) =>
  `${b.runs} (${b.balls}) | ${b.fours}×4 | ${b.sixes}×6 | SR ${Number(b.strikeRate || 0).toFixed(2)}`;

export const DISMISSAL_TYPES = [
  "Bowled",
  "Caught",
  "Caught & Bowled",
  "LBW",
  "Run Out",
  "Stumped",
  "Hit Wicket",
];
