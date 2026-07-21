import { motion } from "framer-motion";
import { Phone, Mail, Building2, Pencil, Trash2, Eye, Handshake, Globe } from "lucide-react";
import { statusBadgeClass, typeBadgeClass } from "../../constants/sponsors";
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

export default function SponsorCard({ sponsor, index = 0, onView, onEdit, onDelete }) {
  const logo = mediaUrl(sponsor.logo);
  const created = sponsor.createdAt
    ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(sponsor.createdAt))
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
          {logo ? (
            <img src={logo} alt="" className="w-full h-full object-contain bg-white p-1" />
          ) : (
            <span className="text-sm font-bold text-primary">{initials(sponsor.sponsorName)}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-bold text-secondary text-base leading-tight truncate" title={sponsor.sponsorName}>
            {sponsor.sponsorName}
          </h3>
          <div className="flex flex-wrap gap-1.5 mt-2">
            <span
              className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${statusBadgeClass(sponsor.status)}`}
            >
              <span className={`w-2 h-2 rounded-full ${statusDotClass(sponsor.status)}`} />
              {sponsor.status || "Active"}
            </span>
            {sponsor.sponsorType && (
              <span
                className={`inline-flex text-[11px] font-semibold px-2.5 py-1 rounded-full border ${typeBadgeClass(sponsor.sponsorType)}`}
              >
                {sponsor.sponsorType}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="space-y-2.5 text-sm">
        {sponsor.companyName && (
          <div className="flex items-center gap-2.5 text-text-muted min-w-0">
            <Building2 className="w-4 h-4 text-primary/70 shrink-0" />
            <p className="truncate">{sponsor.companyName}</p>
          </div>
        )}
        {sponsor.contactPerson && (
          <div className="flex items-center gap-2.5 text-text-muted min-w-0">
            <Handshake className="w-4 h-4 text-primary/70 shrink-0" />
            <p className="truncate">{sponsor.contactPerson}</p>
          </div>
        )}
        {sponsor.phone && (
          <div className="flex items-center gap-2.5 text-text-muted min-w-0">
            <Phone className="w-4 h-4 text-primary/70 shrink-0" />
            <p className="truncate">{sponsor.phone}</p>
          </div>
        )}
        {sponsor.email && (
          <div className="flex items-center gap-2.5 text-text-muted min-w-0">
            <Mail className="w-4 h-4 text-primary/70 shrink-0" />
            <p className="truncate">{sponsor.email}</p>
          </div>
        )}
        {sponsor.website && (
          <div className="flex items-center gap-2.5 text-text-muted min-w-0">
            <Globe className="w-4 h-4 text-primary/70 shrink-0" />
            <p className="truncate">{sponsor.website.replace(/^https?:\/\//i, "")}</p>
          </div>
        )}
        {created && (
          <p className="text-xs text-text-muted pt-0.5">Added {created}</p>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mt-auto pt-1">
        <button
          type="button"
          onClick={() => onView?.(sponsor)}
          className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors"
        >
          <Eye className="w-3.5 h-3.5" /> View
        </button>
        <button
          type="button"
          onClick={() => onEdit?.(sponsor)}
          className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-xs font-semibold hover:bg-slate-200 transition-colors"
        >
          <Pencil className="w-3.5 h-3.5" /> Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete?.(sponsor)}
          className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" /> Delete
        </button>
      </div>
    </motion.article>
  );
}
