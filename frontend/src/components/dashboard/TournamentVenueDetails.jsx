import { MapPin, Globe2, Leaf, Users } from "lucide-react";
import { getTournamentVenue } from "../../utils/tournamentVenue";

function Row({ icon: Icon, label, value, emoji }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 text-sm">
      {emoji ? (
        <span className="text-base leading-none mt-0.5 shrink-0" aria-hidden>{emoji}</span>
      ) : (
        <Icon className="w-4 h-4 text-primary/70 shrink-0 mt-0.5" />
      )}
      <div className="min-w-0">
        {label && <p className="text-[10px] font-bold uppercase tracking-wider text-text-muted mb-0.5">{label}</p>}
        <p className="text-secondary leading-snug break-words">{value}</p>
      </div>
    </div>
  );
}

export default function TournamentVenueDetails({ tournament, compact = false }) {
  const venue = getTournamentVenue(tournament);
  if (!venue) {
    return (
      <div className={`rounded-xl border border-dashed border-slate-200 ${compact ? "p-3" : "p-4"} text-sm text-text-muted text-center`}>
        No venue selected
      </div>
    );
  }

  const capacity =
    venue.capacity != null && venue.capacity !== ""
      ? Number(venue.capacity).toLocaleString()
      : null;

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-text-muted min-w-0">
        <MapPin className="w-3.5 h-3.5 text-primary/70 shrink-0" />
        <span className="truncate">{venue.shortLabel}</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-4 sm:p-5 space-y-3">
      <p className="text-xs font-bold uppercase tracking-wider text-text-muted">Venue</p>
      <Row emoji="🏟" value={venue.venueName} />
      <Row icon={MapPin} label="Address" value={venue.groundAddress} emoji="📍" />
      <Row icon={Globe2} label="Location" value={venue.locationLine} emoji="🌍" />
      {venue.pitchType && <Row icon={Leaf} label="Pitch Type" value={venue.pitchType} emoji="🌱" />}
      {capacity != null && (
        <Row icon={Users} label="Capacity" value={capacity} emoji="👥" />
      )}
    </div>
  );
}
