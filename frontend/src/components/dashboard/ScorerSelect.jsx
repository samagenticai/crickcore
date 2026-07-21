import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ClipboardList, Loader2, Plus, Search, X } from "lucide-react";
import { statusBadgeClass } from "../../constants/scorers";

function statusDotClass(status) {
  return status === "Active" ? "bg-emerald-500" : "bg-slate-400";
}

export default function ScorerSelect({
  label = "Select Scorer",
  required = false,
  value,
  onChange,
  scorers = [],
  loading = false,
  error,
  disabled = false,
  placeholder = "Select an active scorer",
  onAddNew,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef(null);

  const selected = useMemo(
    () => scorers.find((s) => String(s._id) === String(value)),
    [scorers, value]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return scorers;
    return scorers.filter((s) => {
      const haystack = [s.fullName, s.phone, s.email, s.city, s.status]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [scorers, query]);

  useEffect(() => {
    const handleOutside = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const pick = (scorer) => {
    onChange(scorer._id);
    setOpen(false);
    setQuery("");
  };

  const clear = (e) => {
    e.stopPropagation();
    onChange("");
    setQuery("");
  };

  return (
    <div ref={rootRef} className="relative">
      <label className="block text-xs font-semibold text-secondary mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>

      <button
        type="button"
        disabled={disabled || loading}
        onClick={() => setOpen((o) => !o)}
        className={`w-full flex items-center gap-2 rounded-xl border bg-white px-3 py-2.5 text-sm text-left transition-colors ${
          error
            ? "border-red-400 ring-2 ring-red-100"
            : open
              ? "border-primary ring-2 ring-primary/20"
              : "border-slate-200 hover:border-slate-300"
        } disabled:opacity-60 disabled:cursor-not-allowed`}
      >
        <ClipboardList className="w-4 h-4 text-primary/70 shrink-0" />
        <span className={`flex-1 truncate ${selected ? "text-secondary font-medium" : "text-slate-400"}`}>
          {loading ? "Loading scorers…" : selected ? selected.fullName : placeholder}
        </span>
        {selected && !disabled && !required && (
          <span
            role="button"
            tabIndex={0}
            onClick={clear}
            onKeyDown={(e) => e.key === "Enter" && clear(e)}
            className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"
            aria-label="Clear selection"
          >
            <X className="w-3.5 h-3.5" />
          </span>
        )}
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin text-slate-400 shrink-0" />
        ) : (
          <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
        )}
      </button>

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}

      {open && !loading && (
        <div className="absolute z-[110] mt-2 w-full rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden">
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search scorers…"
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-sm text-text-muted text-center">No scorers found</p>
            ) : (
              filtered.map((scorer) => {
                const active = String(scorer._id) === String(value);
                return (
                  <button
                    key={scorer._id}
                    type="button"
                    onClick={() => pick(scorer)}
                    className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 ${
                      active ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 min-w-0">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-secondary truncate">{scorer.fullName}</p>
                        <p className="text-xs text-text-muted truncate mt-0.5">
                          {scorer.phone || "—"}
                          {scorer.city ? ` · ${scorer.city}` : ""}
                        </p>
                      </div>
                      <span
                        className={`inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusBadgeClass(scorer.status)}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusDotClass(scorer.status)}`} />
                        {scorer.status || "Active"}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {onAddNew && (
            <div className="p-2 border-t border-slate-100 bg-slate-50/80">
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onAddNew();
                }}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Scorer
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
