import { motion } from "framer-motion";
import { MapPin, Globe2, Leaf, Users, Pencil, Trash2 } from "lucide-react";

function formatCapacity(capacity) {
  if (capacity == null || capacity === "") return null;
  const value = Number(capacity);
  if (Number.isNaN(value)) return null;
  return value.toLocaleString();
}

export default function VenueCard({ venue, index = 0, onEdit, onDelete }) {
  const capacity = formatCapacity(venue.capacity);
  const locationLine = [venue.city, venue.country].filter(Boolean).join(", ");

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96, y: -8 }}
      transition={{ duration: 0.22, delay: index * 0.03 }}
      className="card-premium p-5 flex flex-col gap-4 h-full"
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/10 flex items-center justify-center shrink-0 text-xl">
          🏟
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-secondary text-base leading-tight truncate" title={venue.venueName}>
            {venue.venueName}
          </h3>
          <span className="inline-flex mt-2 items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
            <Leaf className="w-3 h-3" />
            {venue.pitchType || "Turf"}
          </span>
        </div>
      </div>

      <div className="space-y-2.5 text-sm">
        <div className="flex items-start gap-2.5 text-text-muted">
          <MapPin className="w-4 h-4 text-primary/70 shrink-0 mt-0.5" />
          <p className="leading-snug break-words">{venue.groundAddress}</p>
        </div>

        {locationLine && (
          <div className="flex items-center gap-2.5 text-text-muted">
            <Globe2 className="w-4 h-4 text-primary/70 shrink-0" />
            <p className="truncate">{locationLine}</p>
          </div>
        )}

        {capacity != null && (
          <div className="flex items-center gap-2.5 text-text-muted">
            <Users className="w-4 h-4 text-primary/70 shrink-0" />
            <p>
              Capacity: <span className="font-semibold text-secondary tabular-nums">{capacity}</span>
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-1 mt-auto">
        <button
          type="button"
          onClick={() => onEdit(venue)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(venue)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete
        </button>
      </div>
    </motion.article>
  );
}
