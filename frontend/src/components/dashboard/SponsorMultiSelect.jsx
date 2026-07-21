import { Check, Handshake } from "lucide-react";
import { mediaUrl } from "../../utils/media";

/**
 * Multi-select list of Active sponsors for tournament create/edit.
 */
export default function SponsorMultiSelect({
  sponsors = [],
  selectedIds = [],
  onChange,
  loading = false,
  error,
}) {
  const toggle = (id) => {
    const sid = String(id);
    if (selectedIds.map(String).includes(sid)) {
      onChange(selectedIds.filter((x) => String(x) !== sid));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div className="min-w-0">
      <div className="flex items-center gap-2 mb-2">
        <Handshake className="w-4 h-4 text-primary" />
        <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Sponsors</p>
      </div>
      <p className="text-xs text-text-muted mb-3">
        Assign one or more sponsors to this tournament. They appear on public and live viewer pages.
      </p>

      {loading ? (
        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-text-muted">
          Loading sponsors…
        </div>
      ) : sponsors.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-center text-sm text-text-muted">
          No active sponsors yet. Add sponsors from the Sponsors module first.
        </div>
      ) : (
        <div className="max-h-56 overflow-y-auto space-y-2 rounded-xl border border-slate-200 bg-white p-2">
          {sponsors.map((s) => {
            const selected = selectedIds.map(String).includes(String(s._id));
            const logo = mediaUrl(s.logo);
            return (
              <button
                key={s._id}
                type="button"
                onClick={() => toggle(s._id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border text-left transition-colors ${
                  selected
                    ? "border-primary/40 bg-primary/5"
                    : "border-transparent hover:bg-slate-50"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
                    selected ? "border-primary bg-primary" : "border-slate-300"
                  }`}
                >
                  {selected && <Check className="w-3.5 h-3.5 text-white" />}
                </div>
                <div className="w-9 h-9 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center shrink-0">
                  {logo ? (
                    <img src={logo} alt="" className="w-full h-full object-contain bg-white p-0.5" />
                  ) : (
                    <Handshake className="w-4 h-4 text-slate-400" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-secondary truncate">{s.sponsorName}</p>
                  <p className="text-[11px] text-text-muted truncate">
                    {s.sponsorType || "Sponsor"}
                    {s.companyName ? ` · ${s.companyName}` : ""}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}
