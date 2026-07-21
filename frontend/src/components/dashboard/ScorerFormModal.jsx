import { useEffect, useState } from "react";
import { ClipboardList, Loader2, Camera, X } from "lucide-react";
import { toast } from "sonner";
import {
  EMPTY_SCORER_FORM,
  SCORER_STATUSES,
  scorerToForm,
  validateScorerForm,
} from "../../constants/scorers";
import { mediaUrl } from "../../utils/media";
import DashboardFormModal from "./DashboardFormModal";

function Field({ label, required, children, className = "", error }) {
  return (
    <div className={className}>
      <label className="block text-xs font-semibold text-secondary mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-secondary placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-colors";

export default function ScorerFormModal({ open, onClose, onSubmit, initial, loading }) {
  const [form, setForm] = useState(EMPTY_SCORER_FORM);
  const [errors, setErrors] = useState({});
  const [preview, setPreview] = useState("");

  useEffect(() => {
    if (!open) return;
    const next = scorerToForm(initial);
    setForm(next);
    setPreview(mediaUrl(next.existingPhoto) || "");
    setErrors({});
  }, [open, initial]);

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const onPhoto = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!["image/jpeg", "image/jpg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Invalid image. Use JPG, PNG, or WEBP.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be 5MB or smaller.");
      return;
    }
    set("profilePhoto", file);
    setPreview(URL.createObjectURL(file));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validateScorerForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      toast.error(Object.values(validationErrors)[0]);
      return;
    }
    onSubmit(form);
  };

  return (
    <DashboardFormModal
      open={open}
      onClose={onClose}
      loading={loading}
      zIndex={70}
      maxWidthClass="max-w-[640px]"
      maxHeightClass="max-h-[min(90vh,calc(100dvh-2rem),720px)]"
      formOnSubmit={handleSubmit}
      header={
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <ClipboardList className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-secondary truncate">
                {initial ? "Edit Scorer" : "Add Scorer"}
              </h2>
              <p className="text-xs text-text-muted truncate">
                {initial ? "Update scorer profile" : "Register a scorer for your matches"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-2 rounded-xl hover:bg-slate-100 text-slate-500"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      }
      footer={
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 px-5 py-4 border-t border-slate-100 bg-slate-50/80">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-text-muted hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-sm font-semibold disabled:opacity-50"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {initial ? "Save changes" : "Create scorer"}
          </button>
        </div>
      }
    >
      <div className="space-y-4 min-w-0">
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0">
            {preview ? (
              <img src={preview} alt="" className="w-full h-full object-cover" />
            ) : (
              <ClipboardList className="w-8 h-8 text-slate-400" />
            )}
            <label className="absolute inset-0 flex items-end justify-center bg-gradient-to-t from-black/40 to-transparent cursor-pointer pb-1">
              <Camera className="w-4 h-4 text-white" />
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onPhoto} />
            </label>
          </div>
          <p className="text-sm text-text-muted">Profile photo (optional) · JPG/PNG/WEBP · max 5MB</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Full Name" required className="sm:col-span-2" error={errors.fullName}>
            <input
              className={inputClass}
              value={form.fullName}
              onChange={(e) => set("fullName", e.target.value)}
              placeholder="John Smith"
              disabled={loading}
            />
          </Field>
          <Field label="Phone Number" required error={errors.phone}>
            <input
              className={inputClass}
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+92 300 1234567"
              disabled={loading}
            />
          </Field>
          <Field label="Email" error={errors.email}>
            <input
              type="email"
              className={inputClass}
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="scorer@email.com"
              disabled={loading}
            />
          </Field>
          <Field label="City">
            <input
              className={inputClass}
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
              placeholder="Lahore"
              disabled={loading}
            />
          </Field>
          <Field label="Experience (Years)" error={errors.experience}>
            <input
              type="number"
              min={0}
              className={inputClass}
              value={form.experience}
              onChange={(e) => set("experience", e.target.value)}
              placeholder="5"
              disabled={loading}
            />
          </Field>
          <Field label="Status" className="sm:col-span-2">
            <select
              className={inputClass}
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
              disabled={loading}
            >
              {SCORER_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Notes" className="sm:col-span-2">
            <textarea
              rows={3}
              className={`${inputClass} resize-none`}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="Optional notes about this scorer"
              disabled={loading}
            />
          </Field>
        </div>
      </div>
    </DashboardFormModal>
  );
}
