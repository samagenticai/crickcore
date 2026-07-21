export const SPONSOR_TYPES = [
  "Title Sponsor",
  "Co-Sponsor",
  "Gold Sponsor",
  "Silver Sponsor",
  "Bronze Sponsor",
  "Media Partner",
  "Equipment Partner",
  "Other",
];

export const SPONSOR_STATUSES = ["Active", "Inactive"];

export const EMPTY_SPONSOR_FORM = {
  sponsorName: "",
  companyName: "",
  sponsorType: "Other",
  contactPerson: "",
  phone: "",
  email: "",
  website: "",
  address: "",
  sponsorshipAmount: "",
  status: "Active",
  notes: "",
  logo: null,
};

const EMAIL_REGEX = /\S+@\S+\.\S+/;

function isValidWebsite(value) {
  const v = String(value || "").trim();
  if (!v) return true;
  try {
    const withProto = /^https?:\/\//i.test(v) ? v : `https://${v}`;
    new URL(withProto);
    return true;
  } catch {
    return false;
  }
}

export function validateSponsorForm(form) {
  const errors = {};
  if (!form.sponsorName?.trim()) errors.sponsorName = "Sponsor name is required";
  if (form.email?.trim() && !EMAIL_REGEX.test(form.email.trim())) {
    errors.email = "Invalid email format";
  }
  if (form.website?.trim() && !isValidWebsite(form.website)) {
    errors.website = "Invalid website URL";
  }
  if (form.sponsorshipAmount !== "" && Number(form.sponsorshipAmount) < 0) {
    errors.sponsorshipAmount = "Amount must be zero or greater";
  }
  return errors;
}

export function sponsorToForm(sponsor) {
  if (!sponsor) return { ...EMPTY_SPONSOR_FORM };
  return {
    sponsorName: sponsor.sponsorName || "",
    companyName: sponsor.companyName || "",
    sponsorType: sponsor.sponsorType || "Other",
    contactPerson: sponsor.contactPerson || "",
    phone: sponsor.phone || "",
    email: sponsor.email || "",
    website: sponsor.website || "",
    address: sponsor.address || "",
    sponsorshipAmount:
      sponsor.sponsorshipAmount != null && sponsor.sponsorshipAmount !== ""
        ? String(sponsor.sponsorshipAmount)
        : "",
    status: sponsor.status || "Active",
    notes: sponsor.notes || "",
    logo: null,
    existingLogo: sponsor.logo || "",
  };
}

export function formToFormData(form) {
  const fd = new FormData();
  fd.append("sponsorName", form.sponsorName.trim());
  fd.append("companyName", (form.companyName || "").trim());
  fd.append("sponsorType", form.sponsorType || "Other");
  fd.append("contactPerson", (form.contactPerson || "").trim());
  fd.append("phone", (form.phone || "").trim());
  fd.append("email", (form.email || "").trim());
  fd.append("website", (form.website || "").trim());
  fd.append("address", (form.address || "").trim());
  fd.append("status", form.status || "Active");
  fd.append("notes", (form.notes || "").trim());
  if (form.sponsorshipAmount === "" || form.sponsorshipAmount == null) {
    fd.append("sponsorshipAmount", "");
  } else {
    fd.append("sponsorshipAmount", String(Number(form.sponsorshipAmount)));
  }
  if (form.logo instanceof File) {
    fd.append("logo", form.logo);
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

export function typeBadgeClass(type) {
  switch (type) {
    case "Title Sponsor":
      return "bg-amber-50 text-amber-800 border-amber-100";
    case "Gold Sponsor":
      return "bg-yellow-50 text-yellow-800 border-yellow-100";
    case "Silver Sponsor":
      return "bg-slate-100 text-slate-700 border-slate-200";
    case "Bronze Sponsor":
      return "bg-orange-50 text-orange-800 border-orange-100";
    default:
      return "bg-primary/5 text-primary border-primary/10";
  }
}
