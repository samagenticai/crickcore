import mongoose from "mongoose";

export const SCORER_STATUSES = ["Active", "Inactive"];
export const DEFAULT_SCORER_STATUS = "Active";

const scorerSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, default: "", trim: true, lowercase: true },
    city: { type: String, default: "", trim: true },
    experience: { type: Number, min: 0, default: null },
    profilePhoto: { type: String, default: "" },
    notes: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: SCORER_STATUSES,
      default: DEFAULT_SCORER_STATUS,
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

scorerSchema.index({ organizerId: 1, phone: 1 }, { unique: true });
scorerSchema.index(
  { organizerId: 1, email: 1 },
  {
    unique: true,
    partialFilterExpression: { email: { $type: "string", $gt: "" } },
  }
);

const Scorer = mongoose.model("Scorer", scorerSchema);
export default Scorer;
