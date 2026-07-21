import { CheckCircle2, XCircle } from "lucide-react";

function InfoRow({ label, value }) {
  return (
    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">{label}</p>
      <p className="text-sm font-medium text-secondary mt-1 break-all">{value ?? "—"}</p>
    </div>
  );
}

function StatusBadge({ verified }) {
  return verified ? (
    <span className="inline-flex items-center gap-1 text-emerald-600 text-sm font-medium">
      <CheckCircle2 className="w-4 h-4" /> Verified
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-slate-500 text-sm font-medium">
      <XCircle className="w-4 h-4" /> Not verified
    </span>
  );
}

export default function AccountInfoSection({ profile, formatDate }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <InfoRow label="Account ID" value={String(profile?.accountId || profile?.id || "")} />
      <InfoRow label="Role" value={profile?.roleLabel} />
      <InfoRow label="Subscription Plan" value={profile?.subscription?.plan} />
      <InfoRow label="Registration Date" value={formatDate(profile?.createdAt)} />
      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Email Verification</p>
        <div className="mt-1">
          <StatusBadge verified={profile?.verification?.email} />
        </div>
      </div>
      <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Phone Verification</p>
        <div className="mt-1">
          <StatusBadge verified={profile?.verification?.phone} />
        </div>
      </div>
    </div>
  );
}
