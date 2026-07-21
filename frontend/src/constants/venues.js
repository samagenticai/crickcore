export const PITCH_TYPES = ["Turf", "Matting", "Cement", "Artificial"];

export const EMPTY_VENUE_FORM = {
  venueName: "",
  groundAddress: "",
  city: "",
  state: "",
  country: "",
  pitchType: "Turf",
  capacity: "",
  contactPerson: "",
  contactNumber: "",
  notes: "",
};

export function venueToForm(venue) {
  if (!venue) return { ...EMPTY_VENUE_FORM };
  return {
    venueName: venue.venueName || "",
    groundAddress: venue.groundAddress || "",
    city: venue.city || "",
    state: venue.state || "",
    country: venue.country || "",
    pitchType: venue.pitchType || "Turf",
    capacity: venue.capacity != null && venue.capacity !== "" ? String(venue.capacity) : "",
    contactPerson: venue.contactPerson || "",
    contactNumber: venue.contactNumber || "",
    notes: venue.notes || "",
  };
}

export function formToPayload(form) {
  return {
    venueName: form.venueName.trim(),
    groundAddress: form.groundAddress.trim(),
    city: form.city.trim(),
    state: form.state.trim(),
    country: form.country.trim(),
    pitchType: form.pitchType || "Turf",
    capacity: form.capacity === "" ? undefined : Number(form.capacity),
    contactPerson: form.contactPerson.trim(),
    contactNumber: form.contactNumber.trim(),
    notes: form.notes.trim(),
  };
}
