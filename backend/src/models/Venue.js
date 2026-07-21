import mongoose from "mongoose";
import { PITCH_TYPES } from "../constants/pitchTypes.js";

const venueSchema = new mongoose.Schema(
  {
    venueName: { type: String, required: true, trim: true },
    groundAddress: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, default: "", trim: true },
    country: { type: String, required: true, trim: true },
    pitchType: {
      type: String,
      enum: PITCH_TYPES,
      default: "Turf",
    },
    capacity: { type: Number, min: 0 },
    contactPerson: { type: String, default: "", trim: true },
    contactNumber: { type: String, default: "", trim: true },
    notes: { type: String, default: "", trim: true },
    organizerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

venueSchema.index({ organizerId: 1, venueName: 1 });

/** Backward compatibility for match/public populate using legacy field names */
venueSchema.virtual("name").get(function () {
  return this.venueName;
});
venueSchema.virtual("address").get(function () {
  return this.groundAddress;
});
venueSchema.set("toJSON", { virtuals: true });
venueSchema.set("toObject", { virtuals: true });

const Venue = mongoose.model("Venue", venueSchema);
export default Venue;
