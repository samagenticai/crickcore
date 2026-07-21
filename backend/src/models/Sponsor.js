import mongoose from "mongoose";

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
export const DEFAULT_SPONSOR_STATUS = "Active";
export const DEFAULT_SPONSOR_TYPE = "Other";

const sponsorSchema = new mongoose.Schema(
  {
    sponsorName: { type: String, required: true, trim: true },
    companyName: { type: String, default: "", trim: true },
    sponsorType: {
      type: String,
      enum: SPONSOR_TYPES,
      default: DEFAULT_SPONSOR_TYPE,
      index: true,
    },
    contactPerson: { type: String, default: "", trim: true },
    phone: { type: String, default: "", trim: true },
    email: { type: String, default: "", trim: true, lowercase: true },
    website: { type: String, default: "", trim: true },
    address: { type: String, default: "", trim: true },
    sponsorshipAmount: { type: Number, min: 0, default: null },
    logo: { type: String, default: "" },
    notes: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: SPONSOR_STATUSES,
      default: DEFAULT_SPONSOR_STATUS,
      index: true,
    },
    organizerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

sponsorSchema.index({ organizerId: 1, sponsorName: 1 });

const Sponsor = mongoose.model("Sponsor", sponsorSchema);
export default Sponsor;
