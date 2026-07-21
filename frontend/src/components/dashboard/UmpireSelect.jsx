import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, Gavel, Loader2, Plus, Search, X } from "lucide-react";
import { statusBadgeClass } from "../../constants/umpires";

function statusDotClass(status) {
  switch (status) {
    case "Available":
      return "bg-emerald-500";
    case "Busy":
      return "bg-amber-500";
    case "On Leave":
      return "bg-sky-500";
    default:
      return "bg-slate-400";
  }
}

export default function UmpireSelect({
  label,
  required = false,
  value,
  onChange,
  umpires = [],
  excludeId = "",
  loading = false,
  error,
  disabled = false,
  placeholder = "Select an umpire",
  onAddNew,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef(null);

  const pool = useMemo(
    () => umpires.filter((u) => String(u._id) !== String(excludeId)),
    [umpires, excludeId]
  );

  const selected = useMemo(
    () => umpires.find((u) => String(u._id) === String(value)),
    [umpires, value]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return pool;
    return pool.filter((u) => {
      const haystack = [
        u.fullName,
        u.name,
        u.umpireType,
        u.city,
        u.country,
        u.phoneNumber,
        u.status,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [pool, query]);

  useEffect(() => {
    const handleOutside = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const pick = (umpire) => {
    onChange(umpire._id);
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
        <Gavel className="w-4 h-4 text-primary/70 shrink-0" />
        <span className={`flex-1 truncate ${selected ? "text-secondary font-medium" : "text-slate-400"}`}>
          {loading ? "Loading umpires…" : selected ? selected.fullName || selected.name : placeholder}
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
                placeholder="Search umpires…"
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-4 py-3 text-sm text-text-muted text-center">No umpires found</p>
            ) : (
              filtered.map((umpire) => {
                const active = String(umpire._id) === String(value);
                const displayName = umpire.fullName || umpire.name;
                return (
                  <button
                    key={umpire._id}
                    type="button"
                    onClick={() => pick(umpire)}
                    className={`w-full text-left px-4 py-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0 ${
                      active ? "bg-primary/5" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 min-w-0">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-secondary truncate">
                          👤 {displayName}
                        </p>
                        <p className="text-xs text-text-muted truncate mt-0.5">
                          🏏 {umpire.umpireType || "Main Umpire"}
                          {umpire.city ? ` · 📍 ${umpire.city}` : ""}
                        </p>
                      </div>
                      <span
                        className={`inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusBadgeClass(umpire.status)}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${statusDotClass(umpire.status)}`} />
                        {umpire.status || "Available"}
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
                Add Umpire
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
