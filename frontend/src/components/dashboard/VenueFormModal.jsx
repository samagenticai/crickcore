import { useEffect, useState } from "react";
import { Loader2, MapPin, X } from "lucide-react";
import { toast } from "sonner";
import { EMPTY_VENUE_FORM, PITCH_TYPES, venueToForm, formToPayload } from "../../constants/venues";
import DashboardFormModal from "./DashboardFormModal";

function Field({ label, required, children, className = "" }) {
  return (
    <div className={className}>
      <label className="block text-xs font-semibold text-secondary mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-secondary placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-colors";

export default function VenueFormModal({ open, onClose, onSubmit, initial, loading }) {
  const [form, setForm] = useState(EMPTY_VENUE_FORM);

  useEffect(() => {
    if (!open) return;
    setForm(venueToForm(initial));
  }, [open, initial]);

  const set = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.venueName.trim()) {
      toast.error("Venue name is required");
      return;
    }
    if (!form.groundAddress.trim()) {
      toast.error("Ground address is required");
      return;
    }
    if (!form.city.trim()) {
      toast.error("City is required");
      return;
    }
    if (!form.country.trim()) {
      toast.error("Country is required");
      return;
    }
    if (form.capacity !== "" && Number(form.capacity) < 0) {
      toast.error("Capacity must be zero or greater");
      return;
    }

    onSubmit(formToPayload(form));
  };

  return (
    <DashboardFormModal
      open={open}
      onClose={onClose}
      loading={loading}
      zIndex={70}
      maxWidthClass="max-w-[640px]"
      maxHeightClass="max-h-[min(90vh,calc(100dvh-2rem),560px)]"
      formOnSubmit={handleSubmit}
      header={
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-secondary truncate">
                {initial ? "Edit Venue" : "Add Venue"}
              </h2>
              <p className="text-xs text-text-muted truncate">
                {initial ? "Update venue details" : "Save a new ground for your tournaments"}
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
        <Field label="Venue Name" required>
          <input
            type="text"
            value={form.venueName}
            onChange={(e) => set("venueName", e.target.value)}
            placeholder="e.g. National Cricket Stadium"
            className={inputClass}
            disabled={loading}
          />
        </Field>

        <Field label="Ground Address" required>
          <input
            type="text"
            value={form.groundAddress}
            onChange={(e) => set("groundAddress", e.target.value)}
            placeholder="Street address, area, or landmark"
            className={inputClass}
            disabled={loading}
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="City" required>
            <input
              type="text"
              value={form.city}
              onChange={(e) => set("city", e.target.value)}
              placeholder="City"
              className={inputClass}
              disabled={loading}
            />
          </Field>
          <Field label="State">
            <input
              type="text"
              value={form.state}
              onChange={(e) => set("state", e.target.value)}
              placeholder="State / Province"
              className={inputClass}
              disabled={loading}
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Country" required>
            <input
              type="text"
              value={form.country}
              onChange={(e) => set("country", e.target.value)}
              placeholder="Country"
              className={inputClass}
              disabled={loading}
            />
          </Field>
          <Field label="Pitch Type">
            <select
              value={form.pitchType}
              onChange={(e) => set("pitchType", e.target.value)}
              className={inputClass}
              disabled={loading}
            >
              {PITCH_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Capacity">
            <input
              type="number"
              min="0"
              value={form.capacity}
              onChange={(e) => set("capacity", e.target.value)}
              placeholder="Optional seating capacity"
              className={inputClass}
              disabled={loading}
            />
          </Field>
          <Field label="Contact Person">
            <input
              type="text"
              value={form.contactPerson}
              onChange={(e) => set("contactPerson", e.target.value)}
              placeholder="Ground manager or contact"
              className={inputClass}
              disabled={loading}
            />
          </Field>
        </div>

        <Field label="Contact Number">
          <input
            type="tel"
            value={form.contactNumber}
            onChange={(e) => set("contactNumber", e.target.value)}
            placeholder="Phone number"
            className={inputClass}
            disabled={loading}
          />
        </Field>

        <Field label="Notes">
          <textarea
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Parking, facilities, or special instructions"
            rows={3}
            className={`${inputClass} resize-none`}
            disabled={loading}
          />
        </Field>
      </div>
    </DashboardFormModal>
  );
}
