import { motion } from "framer-motion";
import { Phone, Mail, MapPin, Star, Pencil, Trash2, Eye, ClipboardList } from "lucide-react";
import { statusBadgeClass } from "../../constants/scorers";
import { mediaUrl } from "../../utils/media";

function statusDotClass(status) {
  return status === "Active" ? "bg-emerald-500" : "bg-slate-400";
}

function initials(name = "") {
  return (
    name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0] || "")
      .join("")
      .toUpperCase() || "?"
  );
}

export default function ScorerCard({ scorer, index = 0, onView, onEdit, onDelete }) {
  const photo = mediaUrl(scorer.profilePhoto);
  const experience =
    scorer.experience != null && scorer.experience !== ""
      ? `${scorer.experience} yr${Number(scorer.experience) === 1 ? "" : "s"}`
      : null;
  const created = scorer.createdAt
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(scorer.createdAt))
    : null;

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96, y: -8 }}
      transition={{ duration: 0.22, delay: index * 0.03 }}
      className="card-premium p-5 flex flex-col gap-4 h-full min-w-0"
    >
      <div className="flex items-start gap-3 min-w-0">
        <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/10 overflow-hidden flex items-center justify-center shrink-0">
          {photo ? (
            <img src={photo} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-bold text-primary">{initials(scorer.fullName)}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-secondary text-base leading-tight truncate" title={scorer.fullName}>
            {scorer.fullName}
          </h3>
          <span
            className={`inline-flex mt-2 items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${statusBadgeClass(scorer.status)}`}
          >
            <span className={`w-2 h-2 rounded-full ${statusDotClass(scorer.status)}`} />
            {scorer.status || "Active"}
          </span>
        </div>
      </div>

      <div className="space-y-2.5 text-sm">
        <div className="flex items-center gap-2.5 text-text-muted min-w-0">
          <Phone className="w-4 h-4 text-primary/70 shrink-0" />
          <p className="truncate">{scorer.phone || "—"}</p>
        </div>
        {scorer.email && (
          <div className="flex items-center gap-2.5 text-text-muted min-w-0">
            <Mail className="w-4 h-4 text-primary/70 shrink-0" />
            <p className="truncate">{scorer.email}</p>
          </div>
        )}
        {scorer.city && (
          <div className="flex items-center gap-2.5 text-text-muted min-w-0">
            <MapPin className="w-4 h-4 text-primary/70 shrink-0" />
            <p className="truncate">{scorer.city}</p>
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
        {created && (
          <div className="flex items-center gap-2.5 text-text-muted">
            <ClipboardList className="w-4 h-4 text-primary/70 shrink-0" />
            <p className="truncate">Added {created}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mt-auto pt-1">
        <button
          type="button"
          onClick={() => onView?.(scorer)}
          className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" /> View
        </button>
        <button
          type="button"
          onClick={() => onEdit?.(scorer)}
          className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" /> Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete?.(scorer)}
          className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" /> Delete
        </button>
      </div>
    </motion.article>
  );
}
