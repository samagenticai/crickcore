import { Monitor, Shield } from "lucide-react";

function Row({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
      <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">{label}</p>
        <p className="text-sm font-medium text-secondary mt-0.5 break-words">{value}</p>
      </div>
    </div>
  );
}

export default function SecuritySection({ profile, formatDateTime }) {
  return (
    <div className="space-y-3">
      <Row icon={Monitor} label="Current Login Device" value={profile?.security?.currentDevice} />
      <Row
        icon={Shield}
        label="Last Login"
        value={profile?.security?.lastLoginAt ? formatDateTime(profile.security.lastLoginAt) : "Not recorded yet"}
      />
      <Row
        icon={Shield}
        label="Active Session"
        value={profile?.security?.activeSession ? "This device" : "None"}
      />
    </div>
  );
}
