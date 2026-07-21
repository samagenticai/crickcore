import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { ROLES, normalizeRole } from "../constants/roles.js";

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    username: { type: String, trim: true, sparse: true, unique: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true, minlength: 8, select: false },
    profilePicture: { type: String, default: "" },
    role: {
      type: String,
      enum: Object.values(ROLES),
      default: ROLES.ORGANIZER,
      set: (value) => normalizeRole(value),
    },
    country: { type: String, default: "" },
    city: { type: String, default: "" },
    isActive: { type: Boolean, default: true },
    /** Latest admin login session id — only one active Admin JWT at a time */
    adminSessionId: { type: String, default: "", select: false },
    /** Increment to invalidate all organizer/scorer JWTs (logout all devices) */
    sessionVersion: { type: Number, default: 0 },
    /** Subscription / billing */
    subscriptionPlan: {
      type: String,
      enum: ["free", "starter", "pro", "enterprise"],
      default: "free",
    },
    subscriptionStatus: {
      type: String,
      enum: ["none", "trialing", "active", "past_due", "canceled"],
      default: "none",
    },
    stripeCustomerId: { type: String, default: "" },
    subscriptionStartDate: { type: Date },
    subscriptionEndDate: { type: Date },
    subscriptionUpdatedAt: { type: Date },
    organizationName: { type: String, default: "", trim: true },
    bio: { type: String, default: "", trim: true, maxlength: 500 },
    address: { type: String, default: "", trim: true, maxlength: 300 },
    timezone: { type: String, default: "", trim: true },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;
