import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Loader2, UserCircle } from "lucide-react";
import { toast } from "sonner";
import { profileAPI } from "../../api/profile";
import { useAuth } from "../../context/AuthContext";
import ProfileSection, { PROFILE_CARD } from "../../components/dashboard/profile/ProfileSection";
import ProfileHeader from "../../components/dashboard/profile/ProfileHeader";
import EditProfileForm from "../../components/dashboard/profile/EditProfileForm";
import ChangePasswordForm from "../../components/dashboard/profile/ChangePasswordForm";
import AccountInfoSection from "../../components/dashboard/profile/AccountInfoSection";
import PreferencesSection from "../../components/dashboard/profile/PreferencesSection";
import SecuritySection from "../../components/dashboard/profile/SecuritySection";

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const ALLOWED_EXT = ["jpg", "jpeg", "png", "webp"];

const isAllowedImage = (file) => {
  if (!file) return false;
  if (ALLOWED_TYPES.includes(file.type)) return true;
  const ext = file.name?.split(".").pop()?.toLowerCase();
  return ALLOWED_EXT.includes(ext);
};

const mapProfileToAuthUser = (profile) => {
  const picture = profile.profilePicture || profile.avatar || "";
  return {
    id: profile.id || profile._id,
    fullName: profile.fullName,
    username: profile.username,
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
    subscriptionPlan: profile.subscriptionPlan,
    subscriptionStatus: profile.subscriptionStatus,
    subscriptionStartDate: profile.subscriptionStartDate,
    subscriptionEndDate: profile.subscriptionEndDate,
    subscriptionUpdatedAt: profile.subscriptionUpdatedAt,
    subscription: profile.subscription,
  };
};

export default function ProfilePage() {
  const { setUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const [editForm, setEditForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    organizationName: "",
    country: "",
    city: "",
    timezone: "",
    bio: "",
  });

  const [prefs, setPrefs] = useState({
    emailNotifications: true,
    pushNotifications: true,
    language: "en",
    timeFormat: "12h",
    dateFormat: "MDY",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const formatDate = useCallback((value) => {
    if (!value) return "—";
    return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
  }, []);

  const formatDateTime = useCallback(
    (value) => {
      if (!value) return "—";
      const opts = {
        dateStyle: "medium",
        timeStyle: prefs.timeFormat === "24h" ? "medium" : "short",
        hour12: prefs.timeFormat !== "24h",
      };
      return new Intl.DateTimeFormat(undefined, opts).format(new Date(value));
    },
    [prefs.timeFormat]
  );

  const applyProfile = useCallback(
    (data) => {
      setProfile(data);
      setEditForm({
        fullName: data.fullName || "",
        email: data.email || "",
        phone: data.phone || "",
        organizationName: data.organizationName || "",
        country: data.country || "",
        city: data.city || "",
        timezone: data.timezone || "",
        bio: data.bio || "",
      });
      setPrefs({
        emailNotifications: data.preferences?.emailNotifications ?? true,
        pushNotifications: data.preferences?.pushNotifications ?? true,
        language: data.preferences?.language || "en",
        timeFormat: data.preferences?.timeFormat || "12h",
        dateFormat: data.preferences?.dateFormat || "MDY",
      });
      const authUser = mapProfileToAuthUser(data);
      setUser(authUser);
    },
    [setUser]
  );

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await profileAPI.get();
      applyProfile(data.data);
    } catch (err) {
      toast.error(err.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [applyProfile]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleProfileSave = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const { data } = await profileAPI.update({
        fullName: editForm.fullName.trim(),
        email: editForm.email.trim().toLowerCase(),
        phone: editForm.phone.trim(),
        organizationName: editForm.organizationName.trim(),
        country: editForm.country.trim(),
        city: editForm.city.trim(),
        timezone: editForm.timezone,
        bio: editForm.bio.trim(),
      });
      applyProfile(data.data);
      toast.success(data.message || "Profile updated");
    } catch (err) {
      toast.error(err.message || "Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePrefsSave = async (e) => {
    e.preventDefault();
    setSavingPrefs(true);
    try {
      const { data } = await profileAPI.update({ ...prefs });
      applyProfile(data.data);
      toast.success("Preferences saved");
    } catch (err) {
      toast.error(err.message || "Failed to save preferences");
    } finally {
      setSavingPrefs(false);
    }
  };

  const handlePasswordSave = async (e) => {
    e.preventDefault();
    setSavingPassword(true);
    try {
      const { data } = await profileAPI.changePassword(passwordForm);
      toast.success(data.message || "Password updated");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.error(err.message || "Failed to change password");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    if (!isAllowedImage(file)) {
      toast.error("Only JPG, PNG, and WEBP images are allowed");
      return;
    }
    if (file.size > MAX_AVATAR_SIZE) {
      toast.error("Image must be 5 MB or smaller");
      return;
    }

    const formData = new FormData();
    formData.append("avatar", file);
    setUploadingAvatar(true);
    try {
      const { data } = await profileAPI.uploadAvatar(formData);
      applyProfile(data.data);
      toast.success("Profile photo updated");
    } catch (err) {
      toast.error(err.message || "Failed to upload photo");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAvatarRemove = async () => {
    setUploadingAvatar(true);
    try {
      const { data } = await profileAPI.deleteAvatar();
      applyProfile(data.data);
      toast.success("Profile photo removed");
    } catch (err) {
      toast.error(err.message || "Failed to remove photo");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const memberSince = useMemo(() => formatDate(profile?.memberSince), [profile, formatDate]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3 text-text-muted">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-medium">Loading profile…</p>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 min-w-0"
    >
      <div className="flex items-center gap-2 text-primary">
        <UserCircle className="w-5 h-5" />
        <span className="text-xs font-bold uppercase tracking-wider">Account</span>
      </div>

      <div className={`${PROFILE_CARD} p-5 sm:p-6`}>
        <ProfileHeader
          profile={profile}
          uploading={uploadingAvatar}
          onUpload={handleAvatarUpload}
          onRemove={handleAvatarRemove}
        />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100">
          {[
            { label: "Phone", value: profile.phone },
            { label: "Member Since", value: memberSince },
            { label: "Last Login", value: profile.lastLoginAt ? formatDateTime(profile.lastLoginAt) : "—" },
            { label: "Account Type", value: profile.accountType },
          ].map((item) => (
            <div key={item.label} className="p-3 rounded-xl bg-slate-50 border border-slate-100 min-w-0">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">{item.label}</p>
              <p className="text-sm font-medium text-secondary mt-1 truncate">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ProfileSection title="Edit Profile" subtitle="Update your personal and organization details">
          <EditProfileForm
            form={editForm}
            onChange={(key, val) => setEditForm((f) => ({ ...f, [key]: val }))}
            onSubmit={handleProfileSave}
            saving={savingProfile}
          />
        </ProfileSection>

        <div className="space-y-6">
          <ProfileSection title="Change Password" subtitle="Keep your account secure">
            <ChangePasswordForm
              form={passwordForm}
              onChange={(key, val) => setPasswordForm((f) => ({ ...f, [key]: val }))}
              onSubmit={handlePasswordSave}
              saving={savingPassword}
            />
          </ProfileSection>

          <ProfileSection title="Account Information">
            <AccountInfoSection profile={profile} formatDate={formatDate} />
          </ProfileSection>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ProfileSection title="Preferences" subtitle="Customize your dashboard experience">
          <PreferencesSection
            prefs={prefs}
            onChange={(key, val) => setPrefs((p) => ({ ...p, [key]: val }))}
            onSubmit={handlePrefsSave}
            saving={savingPrefs}
          />
        </ProfileSection>

        <ProfileSection title="Security" subtitle="Session and login activity">
          <SecuritySection profile={profile} formatDateTime={formatDateTime} />
        </ProfileSection>
      </div>
    </motion.div>
  );
}
