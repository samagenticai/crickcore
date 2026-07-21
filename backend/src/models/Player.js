import mongoose from "mongoose";

const playerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    photo: { type: String, default: "" },
    jerseyNumber: { type: Number },
    age: { type: Number, min: [18, "Player must be at least 18 years old"] },
    dateOfBirth: { type: Date, default: null },
    phone: { type: String, default: "", trim: true },
    email: { type: String, default: "", trim: true, lowercase: true },
    address: { type: String, default: "", trim: true },
    role: {
      type: String,
      enum: ["Batsman", "Bowler", "All-Rounder", "Wicket-Keeper"],
      default: "Batsman",
    },
    battingStyle: { type: String, default: "" },
    bowlingStyle: { type: String, default: "" },
    team: { type: mongoose.Schema.Types.ObjectId, ref: "Team" },
    tournament: { type: mongoose.Schema.Types.ObjectId, ref: "Tournament" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

playerSchema.index({ createdBy: 1, team: 1 });

const Player = mongoose.model("Player", playerSchema);
export default Player;
