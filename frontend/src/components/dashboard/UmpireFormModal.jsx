import { useEffect, useState } from "react";
import { Gavel, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import {
  EMPTY_UMPIRE_FORM,
  UMPIRE_TYPES,
  UMPIRE_STATUSES,
  umpireToForm,
  validateUmpireForm,
} from "../../constants/umpires";

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

export default function UmpireFormModal({ open, onClose, onSubmit, initial, loading }) {
  const [form, setForm] = useState(EMPTY_UMPIRE_FORM);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;
    setForm(umpireToForm(initial));
    setErrors({});
  }, [open, initial]);

  const set = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validateUmpireForm(form);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      const firstError = Object.values(validationErrors)[0];
      toast.error(firstError);
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
      maxHeightClass="max-h-[min(90vh,calc(100dvh-2rem),640px)]"
      formOnSubmit={handleSubmit}
      header={
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Gavel className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-secondary truncate">
                {initial ? "Edit Umpire" : "Add Umpire"}
              </h2>
              <p className="text-xs text-text-muted truncate">
                {initial ? "Update umpire profile details" : "Register a new umpire for your events"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-2 rounded-xl text-text-muted hover:bg-slate-100 transition-colors disabled:opacity-50 shrink-0"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      }
      footer={
        <div className="flex gap-3 px-5 py-4 border-t border-slate-100 bg-slate-50/60">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-secondary hover:bg-slate-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl bg-primary hover:bg-primary-dark text-white text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-60"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Save
          </button>
        </div>
      }
    >
      <div className="space-y-4 min-w-0">
        <Field label="Full Name" required error={errors.fullName}>
          <input
            type="text"
            name="fullName"
            autoComplete="name"
            value={form.fullName}
            onChange={(e) => set("fullName", e.target.value)}
            placeholder="e.g. Ahmed Khan"
            className={`${inputClass} ${errors.fullName ? "border-red-400 ring-2 ring-red-100" : ""}`}
            disabled={loading}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Phone Number" required error={errors.phoneNumber}>
            <input
              type="tel"
              name="phoneNumber"
              autoComplete="tel"
              value={form.phoneNumber}
              onChange={(e) => set("phoneNumber", e.target.value)}
              placeholder="+92 300 1234567"
              className={`${inputClass} ${errors.phoneNumber ? "border-red-400 ring-2 ring-red-100" : ""}`}
              disabled={loading}
            />
          </Field>
          <Field label="Email" error={errors.email}>
            <input
              type="email"
              name="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="umpire@example.com"
              className={`${inputClass} ${errors.email ? "border-red-400 ring-2 ring-red-100" : ""}`}
              disabled={loading}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="City" required error={errors.city}>
            <input
              type="text"
              name="city"
              autoComplete="address-level2"
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
              placeholder="City"
              className={`${inputClass} ${errors.city ? "border-red-400 ring-2 ring-red-100" : ""}`}
              disabled={loading}
            />
          </Field>
          <Field label="State">
            <input
              type="text"
              name="state"
              autoComplete="address-level1"
              value={form.state}
              onChange={(e) => set("state", e.target.value)}
              placeholder="State / Province"
              className={inputClass}
              disabled={loading}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Country" required error={errors.country}>
            <input
              type="text"
              name="country"
              autoComplete="country-name"
              value={form.country}
              onChange={(e) => set("country", e.target.value)}
              placeholder="Country"
              className={`${inputClass} ${errors.country ? "border-red-400 ring-2 ring-red-100" : ""}`}
              disabled={loading}
            />
          </Field>
          <Field label="Umpire Type" required error={errors.umpireType}>
            <select
              name="umpireType"
              value={form.umpireType}
              onChange={(e) => set("umpireType", e.target.value)}
              className={inputClass}
              disabled={loading}
            >
              {UMPIRE_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Experience (Years)" error={errors.experience}>
            <input
              type="number"
              name="experience"
              min="0"
              value={form.experience}
              onChange={(e) => set("experience", e.target.value)}
              placeholder="Years of experience"
              className={inputClass}
              disabled={loading}
            />
          </Field>
          <Field label="Qualification">
            <input
              type="text"
              name="qualification"
              value={form.qualification}
              onChange={(e) => set("qualification", e.target.value)}
              placeholder="e.g. PCB Level 2"
              className={inputClass}
              disabled={loading}
            />
          </Field>
        </div>

        <Field label="Status">
          <select
            name="status"
            value={form.status}
            onChange={(e) => set("status", e.target.value)}
            className={inputClass}
            disabled={loading}
          >
            {UMPIRE_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Notes">
          <textarea
            name="notes"
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Availability preferences, certifications, or other notes"
            rows={3}
            className={`${inputClass} resize-none`}
            disabled={loading}
          />
        </Field>
      </div>
    </DashboardFormModal>
  );
}
