import { useCallback, useEffect, useState } from "react";
import {
  Lock,
  User,
  Globe,
  Bell,
  CreditCard,
  Loader2,
  Camera,
  Shield,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { profileAPI } from "../../api/profile";
import { useAuth } from "../../context/AuthContext";
import {
  AdminLoading,
  AdminSettingCard,
  AdminField,
  AdminInput,
  AdminSelect,
  AdminButton,
  AdminInfoRow,
  AdminEmptyState,
  formatAdminDateTime,
} from "../../components/admin/AdminUI";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Karachi",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Australia/Sydney",
];

const mapProfileToAuthUser = (profile) => {
  const picture = profile.profilePicture || profile.avatar || "";
  return {
    id: profile.id || profile._id,
    fullName: profile.fullName,
    email: profile.email,
    phone: profile.phone,
    profilePicture: picture,
    avatar: picture,
    role: profile.role,
    status: profile.accountStatus?.toLowerCase() || profile.status?.toLowerCase(),
    isActive: profile.isActive,
    country: profile.country,
    city: profile.city,
    createdAt: profile.createdAt,
    lastLoginAt: profile.lastLoginAt,
    subscriptionPlan: profile.subscriptionPlan,
    subscriptionStatus: profile.subscriptionStatus,
  };
};

export default function AdminSettingsPage() {
  const { setUser, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const [profileForm, setProfileForm] = useState({
    fullName: "",
    phone: "",
    country: "",
    city: "",
    timezone: "",
  });
  const [pwd, setPwd] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [prefs, setPrefs] = useState({
    emailNotifications: true,
    pushNotifications: true,
    dateFormat: "MDY",
    language: "en",
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [savingSystem, setSavingSystem] = useState(false);
  const [savingNotif, setSavingNotif] = useState(false);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await profileAPI.get();
      const p = data.data;
      setProfile(p);
      setUser(mapProfileToAuthUser(p));
      setProfileForm({
        fullName: p.fullName || "",
        phone: p.phone || "",
        country: p.country || "",
        city: p.city || "",
        timezone: p.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
      });
      setPrefs({
        emailNotifications: p.preferences?.emailNotifications ?? true,
        pushNotifications: p.preferences?.pushNotifications ?? true,
        dateFormat: p.preferences?.dateFormat || "MDY",
        language: p.preferences?.language || "en",
      });
    } catch (err) {
      toast.error(err.message || "Failed to load settings");
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [setUser]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveProfile = async (e) => {
    e.preventDefault();
    if (!profileForm.fullName.trim()) {
      toast.error("Full name is required.");
      return;
    }
    setSavingProfile(true);
    try {
      const { data } = await profileAPI.update({
        fullName: profileForm.fullName.trim(),
        phone: profileForm.phone.trim(),
        country: profileForm.country.trim(),
        city: profileForm.city.trim(),
        timezone: profileForm.timezone,
      });
      setProfile(data.data);
      setUser(mapProfileToAuthUser(data.data));
      toast.success("Profile updated successfully.");
    } catch (err) {
      toast.error(err.message || "Profile update failed.");
    } finally {
      setSavingProfile(false);
    }
  };

  const changePassword = async (e) => {
    e.preventDefault();
    if (pwd.newPassword.length < 8) {
      toast.error("New password must be at least 8 characters.");
      return;
    }
    if (pwd.newPassword !== pwd.confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }
    setSavingPwd(true);
    try {
      await profileAPI.changePassword({
        currentPassword: pwd.currentPassword,
        newPassword: pwd.newPassword,
      });
      setPwd({ currentPassword: "", newPassword: "", confirmPassword: "" });
      toast.success("Password changed successfully.");
    } catch (err) {
      toast.error(err.message || "Password change failed.");
    } finally {
      setSavingPwd(false);
    }
  };

  const saveSystem = async (e) => {
    e.preventDefault();
    setSavingSystem(true);
    try {
      const { data } = await profileAPI.update({
        timezone: profileForm.timezone,
        dateFormat: prefs.dateFormat,
        language: prefs.language,
      });
      setProfile(data.data);
      toast.success("System preferences saved.");
    } catch (err) {
      toast.error(err.message || "Failed to save system preferences.");
    } finally {
      setSavingSystem(false);
    }
  };

  const saveNotifications = async () => {
    setSavingNotif(true);
    try {
      const { data } = await profileAPI.update({
        emailNotifications: prefs.emailNotifications,
        pushNotifications: prefs.pushNotifications,
      });
      setProfile(data.data);
      toast.success("Notification preferences saved.");
    } catch (err) {
      toast.error(err.message || "Failed to save notifications.");
    } finally {
      setSavingNotif(false);
    }
  };

  const onAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Invalid image. Use JPG, PNG, or WEBP.");
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      toast.error("Image must be 5MB or smaller.");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const { data } = await profileAPI.uploadAvatar(formData);
      const next = data.data;
      setProfile((p) => ({ ...p, ...next }));
      updateUser(mapProfileToAuthUser({ ...profile, ...next }));
      toast.success("Avatar uploaded successfully.");
    } catch (err) {
      toast.error(err.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <AdminLoading />;

  if (!profile) {
    return (
      <AdminEmptyState
        title="No data available"
        description="Settings could not be loaded. Please try again."
      />
    );
  }

  const avatar = profile.avatar || profile.profilePicture;
  const sub = profile.subscription || {};

  return (
    <div className="space-y-5 sm:space-y-6 min-w-0 max-w-3xl">
      <p className="text-sm text-slate-500">Manage security, profile, and admin preferences</p>

      {/* Security */}
      <AdminSettingCard
        icon={Lock}
        title="Security"
        description="Password, session, and login protection"
        accent="rose"
      >
        <form onSubmit={changePassword} className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">Change password</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AdminField label="Current password" className="sm:col-span-2">
              <AdminInput
                type="password"
                autoComplete="current-password"
                value={pwd.currentPassword}
                onChange={(e) => setPwd((p) => ({ ...p, currentPassword: e.target.value }))}
                required
              />
            </AdminField>
            <AdminField label="New password">
              <AdminInput
                type="password"
                autoComplete="new-password"
                value={pwd.newPassword}
                onChange={(e) => setPwd((p) => ({ ...p, newPassword: e.target.value }))}
                required
                minLength={8}
              />
            </AdminField>
            <AdminField label="Confirm password">
              <AdminInput
                type="password"
                autoComplete="new-password"
                value={pwd.confirmPassword}
                onChange={(e) => setPwd((p) => ({ ...p, confirmPassword: e.target.value }))}
                required
                minLength={8}
              />
            </AdminField>
          </div>
          <AdminButton type="submit" loading={savingPwd} disabled={savingPwd}>
            Update password
          </AdminButton>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400 mb-2">
            Session information
          </p>
          <dl>
            <AdminInfoRow
              label="Current device"
              value={profile.security?.currentDevice}
            />
            <AdminInfoRow
              label="Active session"
              value={
                profile.security?.activeSession == null
                  ? null
                  : profile.security.activeSession
                    ? "Yes"
                    : "No"
              }
            />
            <AdminInfoRow
              label="Last login"
              value={
                profile.security?.lastLoginAt || profile.lastLoginAt
                  ? formatAdminDateTime(profile.security?.lastLoginAt || profile.lastLoginAt)
                  : null
              }
            />
          </dl>
        </div>

        <div className="mt-5 rounded-xl bg-slate-50 border border-slate-100 p-4 flex gap-3">
          <Shield className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">Login security</p>
            <p className="text-sm text-slate-500 mt-0.5 leading-relaxed">
              Admin sessions use secure cookies. Changing your password refreshes the active admin
              session automatically.
            </p>
          </div>
        </div>
      </AdminSettingCard>

      {/* Profile */}
      <AdminSettingCard
        icon={User}
        title="Profile"
        description="Update personal information and avatar"
        accent="blue"
      >
        <div className="flex items-center gap-4 mb-5">
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
              {avatar ? (
                <img src={avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-7 h-7 text-slate-400" />
              )}
            </div>
            <label className="absolute -bottom-1 -right-1 cursor-pointer">
              <span className="inline-flex w-8 h-8 items-center justify-center rounded-lg bg-slate-900 text-white shadow-md hover:bg-slate-800 transition">
                {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
              </span>
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                disabled={uploading}
                onChange={onAvatarChange}
              />
            </label>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900">Upload avatar</p>
            <p className="text-xs text-slate-500 mt-0.5">JPG, PNG, or WEBP · max 5MB</p>
          </div>
        </div>

        <form onSubmit={saveProfile} className="space-y-4">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-400">
            Personal information
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AdminField label="Full name">
              <AdminInput
                value={profileForm.fullName}
                onChange={(e) => setProfileForm((f) => ({ ...f, fullName: e.target.value }))}
                required
              />
            </AdminField>
            <AdminField label="Email" hint="Email cannot be changed here">
              <AdminInput value={profile.email || ""} disabled readOnly />
            </AdminField>
            <AdminField label="Phone">
              <AdminInput
                value={profileForm.phone}
                onChange={(e) => setProfileForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </AdminField>
            <AdminField label="City">
              <AdminInput
                value={profileForm.city}
                onChange={(e) => setProfileForm((f) => ({ ...f, city: e.target.value }))}
              />
            </AdminField>
            <AdminField label="Country" className="sm:col-span-2">
              <AdminInput
                value={profileForm.country}
                onChange={(e) => setProfileForm((f) => ({ ...f, country: e.target.value }))}
              />
            </AdminField>
          </div>
          <div className="flex flex-wrap gap-2">
            <AdminButton type="submit" loading={savingProfile} disabled={savingProfile}>
              Save profile
            </AdminButton>
            <Link
              to="/admin/profile"
              className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
            >
              View profile →
            </Link>
          </div>
        </form>
      </AdminSettingCard>

      {/* System */}
      <AdminSettingCard
        icon={Globe}
        title="System"
        description="Regional and display formats"
        accent="emerald"
      >
        <form onSubmit={saveSystem} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <AdminField label="Time zone">
              <AdminSelect
                value={profileForm.timezone}
                onChange={(e) => setProfileForm((f) => ({ ...f, timezone: e.target.value }))}
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
                {profileForm.timezone && !TIMEZONES.includes(profileForm.timezone) && (
                  <option value={profileForm.timezone}>{profileForm.timezone}</option>
                )}
              </AdminSelect>
            </AdminField>
            <AdminField label="Date format">
              <AdminSelect
                value={prefs.dateFormat}
                onChange={(e) => setPrefs((p) => ({ ...p, dateFormat: e.target.value }))}
              >
                <option value="MDY">MM/DD/YYYY</option>
                <option value="DMY">DD/MM/YYYY</option>
                <option value="YMD">YYYY-MM-DD</option>
              </AdminSelect>
            </AdminField>
            <AdminField
              label="Language"
              hint="Language switching is a placeholder in this phase"
            >
              <AdminSelect value={prefs.language} disabled>
                <option value="en">English</option>
              </AdminSelect>
            </AdminField>
          </div>
          <AdminButton type="submit" loading={savingSystem} disabled={savingSystem}>
            Save system preferences
          </AdminButton>
        </form>
      </AdminSettingCard>

      {/* Notifications */}
      <AdminSettingCard
        icon={Bell}
        title="Notifications"
        description="Choose how you receive platform alerts"
        accent="amber"
      >
        <div className="space-y-3">
          {[
            {
              key: "emailNotifications",
              label: "Email notifications",
              hint: "Account and system emails",
              enabled: true,
            },
            {
              key: "pushNotifications",
              label: "System notifications",
              hint: "In-app system alerts",
              enabled: true,
            },
            {
              key: "browser",
              label: "Browser notifications",
              hint: "Coming soon — placeholder",
              enabled: false,
            },
          ].map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between gap-4 rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-slate-900">{item.label}</p>
                <p className="text-xs text-slate-500 mt-0.5">{item.hint}</p>
              </div>
              <button
                type="button"
                disabled={!item.enabled}
                onClick={() => {
                  if (!item.enabled) return;
                  setPrefs((p) => ({ ...p, [item.key]: !p[item.key] }));
                }}
                className={`relative h-7 w-12 rounded-full transition shrink-0 disabled:opacity-40 ${
                  item.enabled && prefs[item.key] ? "bg-slate-900" : "bg-slate-300"
                }`}
                aria-pressed={item.enabled ? !!prefs[item.key] : false}
              >
                <span
                  className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
                    item.enabled && prefs[item.key] ? "translate-x-5" : ""
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
        <AdminButton
          className="mt-4"
          loading={savingNotif}
          disabled={savingNotif}
          onClick={saveNotifications}
        >
          Save notification preferences
        </AdminButton>
      </AdminSettingCard>

      {/* Billing */}
      <AdminSettingCard
        icon={CreditCard}
        title="Billing"
        description="Subscription and payment information (read-only)"
        accent="violet"
      >
        <dl>
          <AdminInfoRow label="Plan" value={sub.plan || profile.subscriptionPlan} />
          <AdminInfoRow
            label="Subscription status"
            value={sub.status || profile.subscriptionStatus}
          />
          <AdminInfoRow
            label="Account type"
            value={profile.accountType}
          />
        </dl>
        <div className="mt-4">
          <AdminEmptyState
            icon={CreditCard}
            title="No payment history available."
            description="Admin accounts do not process personal checkout here. Platform payments are managed under Payments."
          />
        </div>
        <Link
          to="/admin/payments"
          className="mt-3 inline-flex text-sm font-semibold text-slate-800 hover:underline"
        >
          View platform payments →
        </Link>
      </AdminSettingCard>
    </div>
  );
}
