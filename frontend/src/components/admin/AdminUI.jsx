import { Inbox, Search, ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { MODAL_BACKDROP, MODAL_SHELL } from "../ui/modalUi";

/** Show real values only; never invent demo content. */
export function adminDisplay(value, fallback = "No data available") {
  if (value === 0 || value === false) return value;
  if (value == null) return fallback;
  if (typeof value === "string" && !value.trim()) return fallback;
  return value;
}

export function formatAdminDate(value) {
  if (!value) return "No data available";
  try {
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
  } catch {
    return "No data available";
  }
}

export function formatAdminDateTime(value) {
  if (!value) return "No data available";
  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return "No data available";
  }
}

export function AdminStatCard({ label, value, icon: Icon, tone = "slate" }) {
  const tones = {
    slate: {
      card: "from-slate-50 to-white border-slate-200/80",
      icon: "bg-slate-900/90 text-white",
      label: "text-slate-500",
      value: "text-slate-900",
    },
    blue: {
      card: "from-sky-50 to-white border-sky-100",
      icon: "bg-sky-600 text-white",
      label: "text-sky-700/70",
      value: "text-sky-950",
    },
    emerald: {
      card: "from-emerald-50 to-white border-emerald-100",
      icon: "bg-emerald-600 text-white",
      label: "text-emerald-700/70",
      value: "text-emerald-950",
    },
    amber: {
      card: "from-amber-50 to-white border-amber-100",
      icon: "bg-amber-600 text-white",
      label: "text-amber-800/70",
      value: "text-amber-950",
    },
    red: {
      card: "from-rose-50 to-white border-rose-100",
      icon: "bg-rose-600 text-white",
      label: "text-rose-700/70",
      value: "text-rose-950",
    },
    violet: {
      card: "from-indigo-50 to-white border-indigo-100",
      icon: "bg-indigo-600 text-white",
      label: "text-indigo-700/70",
      value: "text-indigo-950",
    },
  };
  const t = tones[tone] || tones.slate;
  const display =
    value === 0 || value === "0" || value
      ? value
      : value === null || value === undefined
        ? "No data available"
        : value;

  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br p-4 sm:p-5 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md ${t.card}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={`text-[11px] font-bold uppercase tracking-wider ${t.label}`}>{label}</p>
          <p
            className={`mt-2 text-xl sm:text-2xl font-extrabold tabular-nums tracking-tight break-words ${t.value}`}
          >
            {display}
          </p>
        </div>
        {Icon && (
          <div
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm transition-transform duration-300 group-hover:scale-105 ${t.icon}`}
          >
            <Icon className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
          </div>
        )}
      </div>
    </div>
  );
}

export function AdminEmptyState({
  icon: Icon = Inbox,
  title = "No data available",
  description,
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-12 sm:py-14 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-slate-200 shadow-sm">
        <Icon className="h-5 w-5 text-slate-500" />
      </div>
      <p className="text-sm font-bold text-slate-900">{title}</p>
      {description && (
        <p className="mt-1.5 text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">{description}</p>
      )}
    </div>
  );
}

export function AdminSettingCard({
  icon: Icon,
  title,
  description,
  children,
  accent = "slate",
}) {
  const accents = {
    slate: "bg-slate-900 text-white",
    blue: "bg-sky-600 text-white",
    emerald: "bg-emerald-600 text-white",
    amber: "bg-amber-600 text-white",
    violet: "bg-indigo-600 text-white",
    rose: "bg-rose-600 text-white",
  };

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-sm transition-all duration-300 hover:shadow-md hover:border-slate-300/80 min-w-0">
      <div className="flex items-start gap-3 mb-5">
        {Icon && (
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${accents[accent] || accents.slate}`}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div className="min-w-0">
          <h2 className="text-base font-bold text-slate-900">{title}</h2>
          {description && <p className="text-sm text-slate-500 mt-0.5">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

export function AdminField({ label, children, hint, error, className = "" }) {
  return (
    <label className={`block min-w-0 ${className}`}>
      <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <div className="mt-1.5">{children}</div>
      {hint && !error && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
      {error && <p className="mt-1 text-xs text-rose-600 font-medium">{error}</p>}
    </label>
  );
}

export function AdminInput({ className = "", ...props }) {
  return (
    <input
      {...props}
      className={`w-full min-w-0 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:opacity-60 disabled:bg-slate-50 ${className}`}
    />
  );
}

export function AdminSelect({ className = "", children, ...props }) {
  return (
    <select
      {...props}
      className={`w-full min-w-0 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-900 shadow-sm transition focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 disabled:opacity-60 ${className}`}
    >
      {children}
    </select>
  );
}

export function AdminButton({
  children,
  variant = "primary",
  loading = false,
  className = "",
  disabled,
  ...props
}) {
  const variants = {
    primary:
      "bg-slate-900 text-white hover:bg-slate-800 shadow-sm border border-transparent",
    secondary:
      "bg-white text-slate-800 border border-slate-200 hover:bg-slate-50 shadow-sm",
    danger: "bg-rose-600 text-white hover:bg-rose-700 shadow-sm border border-transparent",
    ghost: "bg-transparent text-slate-700 hover:bg-slate-100 border border-transparent",
  };

  const { type = "button", ...rest } = props;
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${variants[variant] || variants.primary} ${className}`}
      {...rest}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}

export function AdminInfoRow({ label, value }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 py-3 border-b border-slate-100 last:border-0">
      <dt className="text-sm text-slate-500 shrink-0">{label}</dt>
      <dd className="text-sm font-semibold text-slate-900 text-left sm:text-right break-words min-w-0">
        {adminDisplay(value)}
      </dd>
    </div>
  );
}

export function AdminTable({ columns, rows, empty = "No data available", emptyDescription }) {
  if (!rows?.length) {
    return <AdminEmptyState title={empty} description={emptyDescription} />;
  }

  return (
    <>
      <div className="hidden md:block overflow-x-auto rounded-2xl border border-slate-200/80 shadow-sm">
        <table className="w-full text-sm min-w-0">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/90 text-left">
              {columns.map((c) => (
                <th
                  key={c.key}
                  className="px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500"
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {rows.map((row, i) => (
              <tr
                key={row.id || row._id || i}
                className="transition-colors hover:bg-slate-50/80"
              >
                {columns.map((c) => (
                  <td key={c.key} className="px-4 py-3.5 align-top text-slate-700">
                    {c.render ? c.render(row) : adminDisplay(row[c.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden space-y-3">
        {rows.map((row, i) => (
          <div
            key={row.id || row._id || i}
            className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm space-y-2.5 transition hover:shadow-md"
          >
            {columns.map((c) => (
              <div key={c.key} className="flex justify-between gap-3 text-sm min-w-0">
                <span className="text-slate-500 shrink-0">{c.label || "\u00a0"}</span>
                <span className="font-semibold text-slate-800 text-right break-words min-w-0">
                  {c.render ? c.render(row) : adminDisplay(row[c.key])}
                </span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </>
  );
}

export function AdminPagination({ pagination, onPageChange, loading }) {
  if (!pagination) return null;
  const { page, totalPages, total } = pagination;
  if (!total && total !== 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
      <p className="text-xs font-medium text-slate-500">
        Page {page} of {totalPages} · {total} total
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          disabled={loading || page <= 1}
          onClick={() => onPageChange(page - 1)}
          className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-40"
        >
          <ChevronLeft className="w-4 h-4" />
          Prev
        </button>
        <button
          type="button"
          disabled={loading || page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-40"
        >
          Next
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export function AdminToolbar({ search, onSearch, placeholder = "Search…", children }) {
  return (
    <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 mb-4 min-w-0">
      {onSearch && (
        <div className="relative flex-1 min-w-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="search"
            value={search || ""}
            onChange={(e) => onSearch(e.target.value)}
            placeholder={placeholder}
            className="w-full min-w-0 pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-sm shadow-sm transition focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400"
          />
        </div>
      )}
      <div className="flex flex-wrap gap-2 min-w-0">{children}</div>
    </div>
  );
}

export function AdminFilterSelect({ className = "", ...props }) {
  return (
    <select
      {...props}
      className={`px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white shadow-sm min-w-0 transition focus:outline-none focus:ring-2 focus:ring-slate-900/10 ${className}`}
    />
  );
}

export function AdminPageIntro({ children }) {
  return <p className="text-sm text-slate-500 mb-1">{children}</p>;
}

export function AdminLoading() {
  return (
    <div className="flex justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin text-slate-700" />
    </div>
  );
}

function useBodyScrollLock(locked) {
  useEffect(() => {
    if (!locked) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [locked]);
}

function AdminModalPortal({ open, zIndex = 100, onClose, closeOnBackdrop = true, children }) {
  const [mounted, setMounted] = useState(false);
  useBodyScrollLock(open);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className={`${MODAL_SHELL}`}
      style={{ zIndex }}
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        className={MODAL_BACKDROP}
        aria-label="Close"
        onClick={closeOnBackdrop ? onClose : undefined}
      />
      {children}
    </div>,
    document.body
  );
}

export function AdminDetailsModal({ open, title, rows, onClose }) {
  if (!open) return null;
  return (
    <AdminModalPortal open={open} onClose={onClose}>
      <div className="relative z-[1] w-full max-w-md max-h-[min(88vh,720px)] flex flex-col rounded-2xl border border-slate-200/90 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.10)]">
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100 shrink-0">
          <h3 className="text-lg font-bold text-slate-900 truncate">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-2 min-h-0">
          <dl className="space-y-0">
            {(rows || []).map(({ label, value }) => (
              <AdminInfoRow key={label} label={label} value={value} />
            ))}
          </dl>
        </div>
        <div className="shrink-0 px-5 py-4 border-t border-slate-100 bg-slate-50/80 rounded-b-2xl">
          <AdminButton variant="secondary" className="w-full sm:w-auto" onClick={onClose}>
            Close
          </AdminButton>
        </div>
      </div>
    </AdminModalPortal>
  );
}

export function AdminFormModal({
  open,
  title,
  onClose,
  children,
  wide,
  footer,
}) {
  if (!open) return null;
  return (
    <AdminModalPortal open={open} onClose={onClose}>
      <div
        className={`relative z-[1] w-full ${wide ? "max-w-3xl" : "max-w-lg"} max-h-[min(90vh,820px)] flex flex-col rounded-2xl border border-slate-200/90 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.10)]`}
      >
        <div className="shrink-0 flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-slate-100 bg-white rounded-t-2xl">
          <h3 className="text-lg font-bold text-slate-900 truncate pr-2">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition shrink-0"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="overflow-y-auto px-4 sm:px-6 py-4 sm:py-5 min-h-0 flex-1">{children}</div>
        {footer && (
          <div className="shrink-0 flex flex-wrap items-center justify-end gap-2 px-4 sm:px-6 py-4 border-t border-slate-100 bg-slate-50/90 rounded-b-2xl">
            {footer}
          </div>
        )}
      </div>
    </AdminModalPortal>
  );
}

export function AdminConfirmModal({
  open,
  title = "Confirm",
  message,
  confirmLabel = "Confirm",
  danger,
  loading,
  onConfirm,
  onClose,
}) {
  if (!open) return null;
  return (
    <AdminModalPortal open={open} zIndex={110} onClose={onClose} closeOnBackdrop={!loading}>
      <div className="relative z-[1] w-full max-w-sm rounded-2xl border border-slate-200/90 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.10)] p-5 sm:p-6">
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        {message && <p className="mt-2 text-sm text-slate-600 leading-relaxed">{message}</p>}
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <AdminButton variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </AdminButton>
          <AdminButton
            variant={danger ? "danger" : "primary"}
            loading={loading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </AdminButton>
        </div>
      </div>
    </AdminModalPortal>
  );
}

export function AdminStatusBadge({ status }) {
  const s = String(status || "").toLowerCase();
  const map = {
    live: "bg-rose-50 text-rose-700 border-rose-200",
    upcoming: "bg-sky-50 text-sky-700 border-sky-200",
    draft: "bg-slate-100 text-slate-600 border-slate-200",
    completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
    cancelled: "bg-slate-100 text-slate-500 border-slate-200",
    scheduled: "bg-indigo-50 text-indigo-700 border-indigo-200",
    active: "bg-emerald-50 text-emerald-700 border-emerald-200",
    inactive: "bg-slate-100 text-slate-500 border-slate-200",
  };
  const cls = map[s] || "bg-slate-50 text-slate-700 border-slate-200";
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${cls}`}>
      {status || "No data available"}
    </span>
  );
}

export function AdminSkeletonGrid({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-sm animate-pulse"
        >
          <div className="flex gap-3">
            <div className="w-14 h-14 rounded-xl bg-slate-200 shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 rounded w-3/4" />
              <div className="h-3 bg-slate-100 rounded w-1/2" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-3 bg-slate-100 rounded" />
            <div className="h-3 bg-slate-100 rounded w-5/6" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function AdminActionBar({ children }) {
  return (
    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 mt-3">
      {children}
    </div>
  );
}

export function AdminGhostBtn({ children, danger, ...props }) {
  return (
    <button
      type="button"
      className={`inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition ${
        danger
          ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      } disabled:opacity-50`}
      {...props}
    >
      {children}
    </button>
  );
}

