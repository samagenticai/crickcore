import mongoose from "mongoose";

const freeTrialSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    phone: { type: String, required: true, trim: true },
    organization: { type: String, default: "", trim: true },
    country: { type: String, default: "", trim: true },
    planInterest: {
      type: String,
      enum: ["starter", "pro", "enterprise"],
      default: "starter",
    },
    message: { type: String, default: "", trim: true, maxlength: 1000 },
    status: {
      type: String,
      enum: ["new", "contacted", "converted", "closed"],
      default: "new",
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

const FreeTrial = mongoose.model("FreeTrial", freeTrialSchema);
export default FreeTrial;
