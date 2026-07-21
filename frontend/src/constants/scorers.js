export const SCORER_STATUSES = ["Active", "Inactive"];

export const EMPTY_SCORER_FORM = {
  fullName: "",
  phone: "",
  email: "",
  city: "",
  experience: "",
  status: "Active",
  notes: "",
  profilePhoto: null,
};

const PHONE_REGEX = /^[\d\s+\-()]{7,20}$/;
const EMAIL_REGEX = /\S+@\S+\.\S+/;

export function validateScorerForm(form) {
  const errors = {};

  if (!form.fullName?.trim()) errors.fullName = "Full name is required";
  if (!form.phone?.trim()) errors.phone = "Phone number is required";
  else if (!PHONE_REGEX.test(form.phone.trim())) {
    errors.phone = "Invalid phone number format";
  }
  if (form.email?.trim() && !EMAIL_REGEX.test(form.email.trim())) {
    errors.email = "Invalid email format";
  }
  if (form.experience !== "" && Number(form.experience) < 0) {
    errors.experience = "Experience must be zero or greater";
  }

  return errors;
}

export function scorerToForm(scorer) {
  if (!scorer) return { ...EMPTY_SCORER_FORM };
  return {
    fullName: scorer.fullName || "",
    phone: scorer.phone || "",
    email: scorer.email || "",
    city: scorer.city || "",
    experience:
      scorer.experience != null && scorer.experience !== ""
        ? String(scorer.experience)
        : "",
    status: scorer.status || "Active",
    notes: scorer.notes || "",
    profilePhoto: null,
    existingPhoto: scorer.profilePhoto || "",
  };
}

export function formToFormData(form) {
  const fd = new FormData();
  fd.append("fullName", form.fullName.trim());
  fd.append("phone", form.phone.trim());
  fd.append("email", (form.email || "").trim());
  fd.append("city", (form.city || "").trim());
  fd.append("status", form.status || "Active");
  fd.append("notes", (form.notes || "").trim());
  if (form.experience === "" || form.experience == null) {
    fd.append("experience", "");
  } else {
    fd.append("experience", String(Number(form.experience)));
  }
  if (form.profilePhoto instanceof File) {
    fd.append("profilePhoto", form.profilePhoto);
  }
  return fd;
}

export function statusBadgeClass(status) {
  switch (status) {
    case "Active":
      return "bg-emerald-50 text-emerald-700 border-emerald-100";
    case "Inactive":
      return "bg-slate-100 text-slate-600 border-slate-200";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
}
