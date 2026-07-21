import mongoose from "mongoose";

const settingsSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    theme: { type: String, enum: ["light"], default: "light" },
    emailNotifications: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true },
    language: { type: String, default: "en" },
    timeFormat: { type: String, enum: ["12h", "24h"], default: "12h" },
    dateFormat: { type: String, enum: ["MDY", "DMY", "YMD"], default: "MDY" },
    timezone: { type: String, default: "Asia/Karachi", trim: true },
  },
  { timestamps: true }
);

const Settings = mongoose.model("Settings", settingsSchema);
export default Settings;
