import { KeyRound, Loader2 } from "lucide-react";

export default function ChangePasswordForm({ form, onChange, onSubmit, saving }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4 max-w-md">
      {[
        { key: "currentPassword", label: "Current Password" },
        { key: "newPassword", label: "New Password" },
        { key: "confirmPassword", label: "Confirm Password" },
      ].map(({ key, label }) => (
        <div key={key}>
          <label className="text-xs font-semibold uppercase tracking-wide text-text-muted">{label}</label>
          <input
            type="password"
            value={form[key]}
            onChange={(e) => onChange(key, e.target.value)}
            className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm"
            required
            autoComplete={key === "currentPassword" ? "current-password" : "new-password"}
          />
        </div>
      ))}
      <p className="text-xs text-text-muted">
        Use at least 8 characters with uppercase, lowercase, and a number.
      </p>
      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-secondary hover:bg-slate-50 disabled:opacity-50"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
        Update Password
      </button>
    </form>
  );
}
