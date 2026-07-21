import mongoose from "mongoose";

const teamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    shortName: { type: String, default: "", trim: true, maxlength: 10 },
    logo: { type: String, default: "" },
    tournament: { type: mongoose.Schema.Types.ObjectId, ref: "Tournament" },
    captain: { type: String, default: "", trim: true },
    viceCaptain: { type: String, default: "", trim: true },
    coach: { type: String, default: "", trim: true },
    manager: { type: String, default: "", trim: true },
    teamOwner: { type: String, default: "", trim: true },
    contactNumber: { type: String, default: "", trim: true },
    email: { type: String, default: "", trim: true, lowercase: true },
    city: { type: String, default: "", trim: true },
    homeGround: { type: String, default: "", trim: true },
    teamColor: { type: String, default: "#0f172a", trim: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    stats: {
      played: { type: Number, default: 0 },
      won: { type: Number, default: 0 },
      lost: { type: Number, default: 0 },
      tied: { type: Number, default: 0 },
      noResult: { type: Number, default: 0 },
      points: { type: Number, default: 0 },
      runsScored: { type: Number, default: 0 },
      oversFaced: { type: Number, default: 0 },
      runsConceded: { type: Number, default: 0 },
      oversBowled: { type: Number, default: 0 },
      netRunRate: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

const Team = mongoose.model("Team", teamSchema);
export default Team;
