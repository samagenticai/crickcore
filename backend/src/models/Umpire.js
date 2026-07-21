import mongoose from "mongoose";
import {
  UMPIRE_TYPES,
  UMPIRE_STATUSES,
  DEFAULT_UMPIRE_TYPE,
  DEFAULT_UMPIRE_STATUS,
} from "../constants/umpireTypes.js";

const umpireSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    phoneNumber: { type: String, required: true, trim: true },
    email: { type: String, default: "", trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, default: "", trim: true },
    country: { type: String, required: true, trim: true },
    umpireType: {
      type: String,
      enum: UMPIRE_TYPES,
      default: DEFAULT_UMPIRE_TYPE,
    },
    experience: { type: Number, min: 0 },
    qualification: { type: String, default: "", trim: true },
    notes: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: UMPIRE_STATUSES,
      default: DEFAULT_UMPIRE_STATUS,
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

umpireSchema.index({ organizerId: 1, phoneNumber: 1 }, { unique: true });
umpireSchema.index({ organizerId: 1, fullName: 1 });

const Umpire = mongoose.model("Umpire", umpireSchema);
export default Umpire;
