import { Loader2, Save } from "lucide-react";

const TIMEZONES = [
  "UTC",
  "Asia/Karachi",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Dhaka",
  "Europe/London",
  "America/New_York",
  "America/Los_Angeles",
  "Australia/Sydney",
];

export default function EditProfileForm({ form, onChange, onSubmit, saving }) {
  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-text-muted">Full Name</label>
          <input
            type="text"
            value={form.fullName}
            onChange={(e) => onChange("fullName", e.target.value)}
            className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm"
            required
          />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-text-muted">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => onChange("email", e.target.value)}
            className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm"
            required
          />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-text-muted">Phone</label>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => onChange("phone", e.target.value)}
            className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm"
            required
          />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-text-muted">Organization</label>
          <input
            type="text"
            value={form.organizationName}
            onChange={(e) => onChange("organizationName", e.target.value)}
            className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm"
            placeholder="Club or league name"
          />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-text-muted">Country</label>
          <input
            type="text"
            value={form.country}
            onChange={(e) => onChange("country", e.target.value)}
            className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-text-muted">City</label>
          <input
            type="text"
            value={form.city}
            onChange={(e) => onChange("city", e.target.value)}
            className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-semibold uppercase tracking-wide text-text-muted">Time Zone</label>
          <select
            value={form.timezone}
            onChange={(e) => onChange("timezone", e.target.value)}
            className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm bg-white"
          >
            <option value="">Select timezone</option>
            {TIMEZONES.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-text-muted">Bio</label>
          <textarea
            value={form.bio}
            onChange={(e) => onChange("bio", e.target.value)}
            rows={3}
            maxLength={500}
            placeholder="Short bio (optional)"
            className="mt-1.5 w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm resize-none"
          />
          <p className="text-xs text-text-muted mt-1 text-right">{form.bio.length}/500</p>
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 disabled:opacity-50"
      >
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
        Save Profile
      </button>
    </form>
  );
}
