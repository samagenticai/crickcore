import { Camera, Loader2, Trash2, User } from "lucide-react";
import { mediaUrl } from "../../../utils/media";

export default function ProfileHeader({ profile, uploading, onUpload, onRemove }) {
  const avatar = mediaUrl(profile?.profilePicture || profile?.avatar);

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-5">
      <div className="relative shrink-0 mx-auto sm:mx-0">
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-primary/10 flex items-center justify-center ring-4 ring-white shadow-lg">
          {avatar ? (
            <img src={avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <User className="w-10 h-10 text-primary/60" />
          )}
          {uploading && (
            <div className="absolute inset-0 bg-white/70 flex items-center justify-center rounded-2xl">
              <Loader2 className="w-7 h-7 animate-spin text-primary" />
            </div>
          )}
        </div>
        <label
          className={`absolute -bottom-2 -right-2 w-9 h-9 rounded-xl bg-primary text-white flex items-center justify-center shadow-md transition-colors ${
            uploading ? "opacity-50 pointer-events-none" : "cursor-pointer hover:bg-primary/90"
          }`}
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
          <input
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
            className="sr-only"
            disabled={uploading}
            onChange={onUpload}
          />
        </label>
      </div>

      <div className="flex-1 text-center sm:text-left min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold text-secondary truncate">{profile?.fullName}</h1>
        <p className="text-sm text-text-muted mt-0.5">{profile?.email}</p>
        <div className="flex flex-wrap justify-center sm:justify-start gap-2 mt-3">
          <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary">
            {profile?.roleLabel}
          </span>
          <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            {profile?.accountType}
          </span>
          <span
            className={`inline-flex px-2.5 py-1 rounded-full text-xs font-semibold ${
              profile?.accountStatus === "Active"
                ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {profile?.accountStatus}
          </span>
        </div>
        {(profile?.profilePicture || profile?.avatar) && (
          <button
            type="button"
            onClick={onRemove}
            disabled={uploading}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 hover:text-red-700 disabled:opacity-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Remove photo
          </button>
        )}
      </div>
    </div>
  );
}
