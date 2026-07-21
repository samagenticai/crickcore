export const UMPIRE_TYPES = ["Main Umpire", "Leg Umpire", "Reserve Umpire"];

export const UMPIRE_STATUSES = ["Available", "Busy", "On Leave", "Inactive"];

export const EMPTY_UMPIRE_FORM = {
  fullName: "",
  phoneNumber: "",
  email: "",
  city: "",
  state: "",
  country: "",
  umpireType: "Main Umpire",
  experience: "",
  qualification: "",
  status: "Available",
  notes: "",
};

const PHONE_REGEX = /^[\d\s+\-()]{7,20}$/;
const EMAIL_REGEX = /\S+@\S+\.\S+/;

export function validateUmpireForm(form) {
  const errors = {};

  if (!form.fullName?.trim()) errors.fullName = "Full name is required";
  if (!form.phoneNumber?.trim()) errors.phoneNumber = "Phone number is required";
  else if (!PHONE_REGEX.test(form.phoneNumber.trim())) {
    errors.phoneNumber = "Invalid phone number format";
  }
  if (form.email?.trim() && !EMAIL_REGEX.test(form.email.trim())) {
    errors.email = "Invalid email format";
  }
  if (!form.city?.trim()) errors.city = "City is required";
  if (!form.country?.trim()) errors.country = "Country is required";
  if (!form.umpireType?.trim()) errors.umpireType = "Umpire type is required";
  if (form.experience !== "" && Number(form.experience) < 0) {
    errors.experience = "Experience must be zero or greater";
  }

  return errors;
}

export function umpireToForm(umpire) {
  if (!umpire) return { ...EMPTY_UMPIRE_FORM };
  return {
    fullName: umpire.fullName || umpire.name || "",
    phoneNumber: umpire.phoneNumber || "",
    email: umpire.email || "",
    city: umpire.city || "",
    state: umpire.state || "",
    country: umpire.country || "",
    umpireType: umpire.umpireType || "Main Umpire",
    experience:
      umpire.experience != null && umpire.experience !== ""
        ? String(umpire.experience)
        : "",
    qualification: umpire.qualification || "",
    status: umpire.status || "Available",
    notes: umpire.notes || "",
  };
}

export function formToPayload(form) {
  return {
    fullName: form.fullName.trim(),
    phoneNumber: form.phoneNumber.trim(),
    email: form.email.trim(),
    city: form.city.trim(),
    state: form.state.trim(),
    country: form.country.trim(),
    umpireType: form.umpireType || "Main Umpire",
    experience: form.experience === "" ? undefined : Number(form.experience),
    qualification: form.qualification.trim(),
    status: form.status || "Available",
    notes: form.notes.trim(),
  };
}

export function statusBadgeClass(status) {
  switch (status) {
    case "Available":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "Busy":
      return "bg-amber-50 text-amber-700 border-amber-100";
    case "On Leave":
      return "bg-sky-50 text-sky-700 border-sky-100";
    case "Inactive":
      return "bg-slate-100 text-slate-600 border-slate-200";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
}
