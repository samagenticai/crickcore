import { Loader2, Save } from "lucide-react";

export default function PreferencesSection({ prefs, onChange, onSubmit, saving }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-text-muted">Language</label>
          <select
            value={prefs.language}
            onChange={(e) => onChange("language", e.target.value)}
            disabled
            className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-slate-50 text-text-muted"
          >
            <option value="en">English</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-text-muted">Time Format</label>
          <select
            value={prefs.timeFormat}
            onChange={(e) => onChange("timeFormat", e.target.value)}
            className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
          >
            <option value="12h">12-hour</option>
            <option value="24h">24-hour</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-text-muted">Date Format</label>
          <select
            value={prefs.dateFormat}
            onChange={(e) => onChange("dateFormat", e.target.value)}
            className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
          >
            <option value="MDY">MM/DD/YYYY</option>
            <option value="DMY">DD/MM/YYYY</option>
            <option value="YMD">YYYY-MM-DD</option>
          </select>
        </div>
      </div>

      <div className="space-y-3 pt-1">
        <label className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/80 cursor-pointer">
          <span className="text-sm font-medium text-secondary">Email notifications</span>
          <input
            type="checkbox"
            checked={prefs.emailNotifications}
            onChange={(e) => onChange("emailNotifications", e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
          />
        </label>
        <label className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/80 cursor-pointer">
          <span className="text-sm font-medium text-secondary">Push notifications</span>
          <input
            type="checkbox"
            checked={prefs.pushNotifications}
            onChange={(e) => onChange("pushNotifications", e.target.checked)}
            className="w-4 h-4 rounded border-slate-300 text-primary focus:ring-primary"
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save Preferences
      </button>
    </form>
  );
}
