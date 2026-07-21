import { useCallback, useEffect, useState } from "react";
import {
  Loader2,
  User,
  Mail,
  Shield,
  BadgeCheck,
  Calendar,
  Clock,
  Camera,
} from "lucide-react";
import { toast } from "sonner";
import { profileAPI } from "../../api/profile";
import { useAuth } from "../../context/AuthContext";
import {
  AdminLoading,
  AdminSettingCard,
  AdminInfoRow,
  AdminButton,
  adminDisplay,
  formatAdminDate,
  formatAdminDateTime,
} from "../../components/admin/AdminUI";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

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

export default function AdminProfilePage() {
  const { setUser, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await profileAPI.get();
      setProfile(data.data);
      setUser(mapProfileToAuthUser(data.data));
    } catch (err) {
      toast.error(err.message || "Failed to load profile");
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [setUser]);

  useEffect(() => {
    load();
  }, [load]);

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
      setProfile((p) => ({ ...p, ...next, avatar: next.avatar || next.profilePicture }));
      updateUser(mapProfileToAuthUser({ ...profile, ...next }));
      toast.success("Profile photo updated successfully.");
    } catch (err) {
      toast.error(err.message || "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) return <AdminLoading />;

  if (!profile) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-14 text-center">
        <p className="text-sm font-bold text-slate-900">No data available</p>
        <p className="mt-1.5 text-sm text-slate-500">Unable to load admin profile.</p>
        <AdminButton className="mt-4" onClick={load}>
          Retry
        </AdminButton>
      </div>
    );
  }

  const avatar = profile.avatar || profile.profilePicture;
  const status = profile.accountStatus || profile.status || (profile.isActive ? "Active" : "Inactive");

  return (
    <div className="space-y-5 sm:space-y-6 min-w-0 max-w-3xl">
      <p className="text-sm text-slate-500">Your administrator account overview</p>

      {/* Hero card */}
      <section className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-5 sm:p-8 shadow-lg">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.12),transparent_40%)] pointer-events-none" />
        <div className="relative flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6">
          <div className="relative shrink-0">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-white/10 border border-white/20 overflow-hidden flex items-center justify-center shadow-xl">
              {avatar ? (
                <img src={avatar} alt="" className="w-full h-full object-cover" />
              ) : (
                <User className="w-10 h-10 text-white/70" />
              )}
            </div>
            <label className="absolute -bottom-2 -right-2 cursor-pointer">
              <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-white text-slate-900 shadow-md hover:bg-slate-100 transition">
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Camera className="w-4 h-4" />
                )}
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

          <div className="min-w-0 text-center sm:text-left flex-1">
            <p className="text-[11px] font-bold uppercase tracking-widest text-white/50 mb-1">
              Administrator
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight break-words">
              {adminDisplay(profile.fullName)}
            </h2>
            <p className="mt-1.5 text-sm text-white/70 break-all">{adminDisplay(profile.email)}</p>
            <div className="mt-4 flex flex-wrap justify-center sm:justify-start gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-semibold capitalize">
                <Shield className="w-3.5 h-3.5" />
                {adminDisplay(profile.roleLabel || profile.role)}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${
                  String(status).toLowerCase() === "active"
                    ? "bg-emerald-500/20 border-emerald-400/30 text-emerald-100"
                    : "bg-white/10 border-white/15 text-white/80"
                }`}
              >
                <BadgeCheck className="w-3.5 h-3.5" />
                {adminDisplay(status)}
              </span>
            </div>
          </div>
        </div>
      </section>

      <AdminSettingCard
        icon={User}
        title="Account details"
        description="Information from your live account record"
        accent="slate"
      >
        <dl>
          <AdminInfoRow
            label="Full name"
            value={profile.fullName}
          />
          <AdminInfoRow
            label="Email"
            value={profile.email}
          />
          <AdminInfoRow
            label="Role"
            value={profile.roleLabel || (profile.role ? String(profile.role) : null)}
          />
          <AdminInfoRow label="Account status" value={status} />
          <AdminInfoRow
            label="Account created"
            value={profile.createdAt || profile.memberSince ? formatAdminDate(profile.createdAt || profile.memberSince) : null}
          />
          <AdminInfoRow
            label="Last login"
            value={
              profile.lastLoginAt || profile.security?.lastLoginAt
                ? formatAdminDateTime(profile.lastLoginAt || profile.security?.lastLoginAt)
                : null
            }
          />
          <AdminInfoRow label="Phone" value={profile.phone} />
          <AdminInfoRow label="City" value={profile.city} />
          <AdminInfoRow label="Country" value={profile.country} />
        </dl>
      </AdminSettingCard>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { icon: Mail, label: "Email", value: adminDisplay(profile.email) },
          {
            icon: Calendar,
            label: "Member since",
            value: formatAdminDate(profile.createdAt || profile.memberSince),
          },
          {
            icon: Clock,
            label: "Last login",
            value: formatAdminDateTime(profile.lastLoginAt || profile.security?.lastLoginAt),
          },
        ].map(({ icon: Icon, label, value }) => (
          <div
            key={label}
            className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition hover:shadow-md min-w-0"
          >
            <div className="flex items-center gap-2 text-slate-500 mb-2">
              <Icon className="w-4 h-4 shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wide">{label}</span>
            </div>
            <p className="text-sm font-semibold text-slate-900 break-words">{value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
