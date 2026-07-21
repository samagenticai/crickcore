import { motion } from "framer-motion";
import { Phone, MapPin, Star, Pencil, Trash2, Gavel } from "lucide-react";
import { statusBadgeClass } from "../../constants/umpires";

function statusDotClass(status) {
  switch (status) {
    case "Available":
      return "bg-emerald-500";
    case "Busy":
      return "bg-amber-500";
    case "On Leave":
      return "bg-sky-500";
    case "Inactive":
      return "bg-slate-400";
    default:
      return "bg-slate-400";
  }
}

export default function UmpireCard({ umpire, index = 0, onEdit, onDelete }) {
  const locationLine = [umpire.city, umpire.country].filter(Boolean).join(", ");
  const experience =
    umpire.experience != null && umpire.experience !== ""
      ? `${umpire.experience} yr${Number(umpire.experience) === 1 ? "" : "s"}`
      : null;

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
          👤
        </div>
        <div className="min-w-0 flex-1">
          <h3
            className="font-bold text-secondary text-base leading-tight truncate"
            title={umpire.fullName}
          >
            {umpire.fullName}
          </h3>
          <span
            className={`inline-flex mt-2 items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${statusBadgeClass(umpire.status)}`}
          >
            <span className={`w-2 h-2 rounded-full ${statusDotClass(umpire.status)}`} />
            {umpire.status || "Available"}
          </span>
        </div>
      </div>

      <div className="space-y-2.5 text-sm">
        <div className="flex items-center gap-2.5 text-text-muted">
          <Gavel className="w-4 h-4 text-primary/70 shrink-0" />
          <p className="truncate">{umpire.umpireType || "Main Umpire"}</p>
        </div>

        <div className="flex items-center gap-2.5 text-text-muted">
          <Phone className="w-4 h-4 text-primary/70 shrink-0" />
          <p className="truncate">{umpire.phoneNumber}</p>
        </div>

        {locationLine && (
          <div className="flex items-center gap-2.5 text-text-muted">
            <MapPin className="w-4 h-4 text-primary/70 shrink-0" />
            <p className="truncate">{locationLine}</p>
          </div>
        )}

        {experience && (
          <div className="flex items-center gap-2.5 text-text-muted">
            <Star className="w-4 h-4 text-primary/70 shrink-0" />
            <p>
              Experience:{" "}
              <span className="font-semibold text-secondary tabular-nums">{experience}</span>
            </p>
          </div>
        )}

        {umpire.qualification && (
          <p className="text-xs text-text-muted leading-snug line-clamp-2">
            {umpire.qualification}
          </p>
        )}
      </div>

      <div className="flex gap-2 pt-1 mt-auto">
        <button
          type="button"
          onClick={() => onEdit(umpire)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" />
          Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(umpire)}
          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Delete
        </button>
      </div>
    </motion.article>
  );
}
