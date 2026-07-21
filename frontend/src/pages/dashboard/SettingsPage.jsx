import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  Crown,
  Eye,
  EyeOff,
  KeyRound,
  Loader2,
  LogOut,
  Shield,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { settingsAPI } from "../../api/settings";
import { paymentsAPI } from "../../api/payments";
import { useAuth } from "../../context/AuthContext";
import { isProMember, getSubscriptionLabel, getRemainingDays } from "../../utils/subscription";
import ProfileSection from "../../components/dashboard/profile/ProfileSection";
import { MODAL_BACKDROP, MODAL_SHELL } from "../../components/ui/modalUi";

const inputClass =
  "mt-1.5 w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-secondary placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 disabled:bg-slate-50 disabled:text-text-muted";

const labelClass = "text-xs font-semibold uppercase tracking-wide text-text-muted";

function InfoRow({ label, value }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-slate-100 last:border-0">
      <dt className="text-sm text-text-muted shrink-0">{label}</dt>
      <dd className="text-sm font-semibold text-secondary text-right break-words">{value ?? "—"}</dd>
    </div>
  );
}

function PasswordField({ label, value, onChange, show, onToggle, autoComplete }) {
  return (
    <div>
      <label className={labelClass}>{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          className={`${inputClass} pr-11`}
          value={value}
          onChange={onChange}
          required
          autoComplete={autoComplete}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-slate-400 hover:text-secondary"
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function passwordStrength(password) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  if (score <= 2) return { label: "Weak", className: "bg-red-500", width: "33%" };
  if (score <= 3) return { label: "Fair", className: "bg-amber-500", width: "66%" };
  return { label: "Strong", className: "bg-emerald-500", width: "100%" };
}

export default function SettingsPage() {
  const navigate = useNavigate();
  const { logout, user, refreshSubscription } = useAuth();
  const checkoutRef = useRef(false);

  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    next: false,
    confirm: false,
  });

  const [savingSecurity, setSavingSecurity] = useState(false);
  const [loggingOutAll, setLoggingOutAll] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  const formatDate = useCallback((value) => {
    if (!value) return "—";
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
  }, []);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await settingsAPI.get();
      setSettings(data.data);
      await refreshSubscription();
    } catch (err) {
      toast.error(err.message || "Failed to load settings");
    } finally {
      setLoading(false);
    }
  }, [refreshSubscription]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const strength = useMemo(
    () => passwordStrength(passwordForm.newPassword),
    [passwordForm.newPassword]
  );

  const subscriptionSource = settings || user;
  const isPro = useMemo(() => isProMember(subscriptionSource), [subscriptionSource]);
  const planLabel = useMemo(() => getSubscriptionLabel(subscriptionSource), [subscriptionSource]);
  const remainingDays = useMemo(() => getRemainingDays(subscriptionSource), [subscriptionSource]);

  const handleSecuritySave = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Password confirmation does not match");
      return;
    }
    setSavingSecurity(true);
    try {
      const { data } = await settingsAPI.updateSecurity(passwordForm);
      toast.success(data.message || "Password updated");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      if (data.requiresReLogin) {
        await logout();
        navigate("/login", { replace: true });
      }
    } catch (err) {
      toast.error(err.message || "Failed to change password");
    } finally {
      setSavingSecurity(false);
    }
  };

  const handleLogoutAllDevices = async () => {
    setLoggingOutAll(true);
    try {
      const { data } = await settingsAPI.logoutAllDevices();
      toast.success(data.message || "Signed out from all devices");
      await logout();
      navigate("/login", { replace: true });
    } catch (err) {
      toast.error(err.message || "Failed to sign out from all devices");
    } finally {
      setLoggingOutAll(false);
    }
  };

  const handleUpgrade = async () => {
    if (checkoutRef.current || upgrading) return;
    checkoutRef.current = true;
    setUpgrading(true);
    try {
      const res = await paymentsAPI.createCheckoutSession("pro");
      const url = res.data?.data?.url;
      if (url) {
        window.location.href = url;
        return;
      }
      toast.error("Unable to start checkout");
    } catch (err) {
      toast.error(err.message || "Unable to start Stripe checkout");
    } finally {
      checkoutRef.current = false;
      setUpgrading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm.trim().toUpperCase() !== "DELETE") {
      toast.error("Type DELETE to confirm");
      return;
    }
    setDeleting(true);
    try {
      await settingsAPI.deleteAccount({
        password: deletePassword,
        confirmText: "DELETE",
      });
      toast.success("Account deleted");
      setDeleteOpen(false);
      await logout();
      navigate("/", { replace: true });
    } catch (err) {
      toast.error(err.message || "Failed to delete account");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-3 text-text-muted">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Loading settings…</p>
      </div>
    );
  }

  const startDate =
    settings?.subscription?.startDate ||
    settings?.subscriptionStartDate ||
    settings?.subscriptionUpdatedAt;
  const endDate = settings?.subscription?.endDate || settings?.subscriptionEndDate;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5 min-w-0 pb-8 max-w-2xl"
    >
      <p className="text-sm text-text-muted">
        Manage your password, subscription, and account security. Profile details are on the Profile
        page.
      </p>

      <ProfileSection title="Security" subtitle="Change your account password">
        <form onSubmit={handleSecuritySave} className="space-y-4 max-w-md">
          <PasswordField
            label="Current Password"
            value={passwordForm.currentPassword}
            onChange={(e) => setPasswordForm((f) => ({ ...f, currentPassword: e.target.value }))}
            show={showPasswords.current}
            onToggle={() => setShowPasswords((s) => ({ ...s, current: !s.current }))}
            autoComplete="current-password"
          />
          <PasswordField
            label="New Password"
            value={passwordForm.newPassword}
            onChange={(e) => setPasswordForm((f) => ({ ...f, newPassword: e.target.value }))}
            show={showPasswords.next}
            onToggle={() => setShowPasswords((s) => ({ ...s, next: !s.next }))}
            autoComplete="new-password"
          />
          {passwordForm.newPassword && (
            <div>
              <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className={`h-full ${strength.className} transition-all`}
                  style={{ width: strength.width }}
                />
              </div>
              <p className="text-[11px] text-text-muted mt-1">Strength: {strength.label}</p>
            </div>
          )}
          <PasswordField
            label="Confirm Password"
            value={passwordForm.confirmPassword}
            onChange={(e) => setPasswordForm((f) => ({ ...f, confirmPassword: e.target.value }))}
            show={showPasswords.confirm}
            onToggle={() => setShowPasswords((s) => ({ ...s, confirm: !s.confirm }))}
            autoComplete="new-password"
          />
          <p className="text-xs text-text-muted">
            Use at least 8 characters with uppercase, lowercase, and a number. You will be signed out
            after changing your password.
          </p>
          <button
            type="submit"
            disabled={savingSecurity}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-sm font-semibold disabled:opacity-60"
          >
            {savingSecurity ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
            Update Password
          </button>
        </form>
      </ProfileSection>

      <ProfileSection title="Subscription" subtitle="Your current plan">
        <dl>
          <InfoRow label="Current Plan" value={planLabel} />
          <InfoRow label="Start Date" value={isPro ? formatDate(startDate) : "—"} />
          <InfoRow label="Expiry Date" value={isPro ? formatDate(endDate) : "—"} />
          <InfoRow
            label="Remaining Days"
            value={isPro ? `${remainingDays} day${remainingDays === 1 ? "" : "s"}` : "—"}
          />
        </dl>
        <div className="mt-4">
          {isPro ? (
            <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-semibold">
              <CheckCircle2 className="w-4 h-4" />
              Pro Active
            </div>
          ) : (
            <button
              type="button"
              onClick={handleUpgrade}
              disabled={upgrading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-sm font-semibold disabled:opacity-60"
            >
              {upgrading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Crown className="w-4 h-4" />}
              Upgrade to Pro
            </button>
          )}
        </div>
      </ProfileSection>

      <ProfileSection title="Danger Zone" subtitle="Irreversible account actions">
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-secondary flex items-center gap-2">
                <LogOut className="w-4 h-4" /> Logout from All Devices
              </p>
              <p className="text-xs text-text-muted mt-0.5">
                End every active session and sign in again on this device.
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogoutAllDevices}
              disabled={loggingOutAll}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-slate-200 text-sm font-semibold text-secondary hover:bg-slate-50 shrink-0 disabled:opacity-60"
            >
              {loggingOutAll ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Sign Out Everywhere
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-red-200 bg-red-50/40 px-4 py-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-red-700 flex items-center gap-2">
                <Trash2 className="w-4 h-4" /> Delete Account
              </p>
              <p className="text-xs text-red-600/80 mt-0.5">
                Permanently delete your account and all organizer data.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setDeletePassword("");
                setDeleteConfirm("");
                setDeleteOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold shrink-0"
            >
              Delete Account
            </button>
          </div>
        </div>
      </ProfileSection>

      {deleteOpen && (
        <div className={`${MODAL_SHELL} z-[90]`} role="dialog" aria-modal="true">
          <button
            type="button"
            className={MODAL_BACKDROP}
            aria-label="Close"
            onClick={() => !deleting && setDeleteOpen(false)}
          />
          <div className="relative z-[1] w-full max-w-md rounded-2xl bg-white border border-slate-200 shadow-[0_20px_60px_rgba(15,23,42,0.10)] p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-secondary">Delete account?</h3>
                <p className="text-xs text-text-muted">This cannot be undone.</p>
              </div>
            </div>
            <div>
              <label className={labelClass}>Password</label>
              <input
                type="password"
                className={inputClass}
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Confirm with your password"
              />
            </div>
            <div>
              <label className={labelClass}>Type DELETE to confirm</label>
              <input
                className={inputClass}
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="DELETE"
              />
            </div>
            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-1">
              <button
                type="button"
                disabled={deleting}
                onClick={() => setDeleteOpen(false)}
                className="px-4 py-2.5 rounded-xl text-sm font-semibold text-text-muted hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting || !deletePassword}
                onClick={handleDeleteAccount}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold disabled:opacity-50"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
}
