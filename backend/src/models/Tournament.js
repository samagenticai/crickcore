import mongoose from "mongoose";
import { TOURNAMENT_TYPES } from "../constants/tournamentTypes.js";

const tournamentSchema = new mongoose.Schema(
  {
    tournamentName: { type: String, required: true, trim: true },
    tournamentLogo: { type: String, default: "" },
    bannerImage: { type: String, default: "" },
    description: { type: String, default: "" },
    tournamentType: {
      type: String,
      enum: TOURNAMENT_TYPES,
      default: "Round Robin (League)",
    },
    ballType: {
      type: String,
      enum: ["Tape Ball", "Tennis Ball", "Hard Ball"],
      default: "Tennis Ball",
    },
    sportType: { type: String, default: "Cricket" },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    registrationDeadline: { type: Date },
    numberOfTeams: { type: Number, default: 8, min: 2 },
    overs: { type: Number, default: 20, min: 1 },
    matchFormat: {
      type: String,
      enum: ["T10", "T20", "T50", "ODI", "Test", "Custom"],
      default: "T20",
    },
    entryFee: { type: Number, default: 0, min: 0 },
    prizePool: { type: Number, default: 0, min: 0 },
    prizeDetails: { type: String, default: "" },
    /** Reference to organizer's Venue library */
    venue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Venue",
      default: null,
      set: (v) => {
        if (v == null || v === "") return null;
        return v;
      },
    },
    /** Sponsors assigned from the organizer's sponsor library */
    sponsors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Sponsor",
      },
    ],
    /** @deprecated Legacy manual fields — use populated `venue` instead */
    groundName: { type: String, default: "" },
    groundAddress: { type: String, default: "" },
    city: { type: String, default: "" },
    status: {
      type: String,
      enum: ["Draft", "Upcoming", "Live", "Completed", "Cancelled"],
      default: "Draft",
    },
    rules: { type: String, default: "" },
    contactPerson: { type: String, default: "" },
    contactPhone: { type: String, default: "" },
    contactEmail: { type: String, default: "" },
    isPublic: { type: Boolean, default: true },
    isArchived: { type: Boolean, default: false },
    /** System storage cleanup — heavy data removed, summary preserved */
    isStorageArchived: { type: Boolean, default: false },
    storageArchivedAt: { type: Date, default: null },
    archiveSummary: {
      tournamentName: { type: String, default: "" },
      tournamentLogo: { type: String, default: "" },
      bannerImage: { type: String, default: "" },
      organizerName: { type: String, default: "" },
      organizerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      venueName: { type: String, default: "" },
      startDate: { type: Date, default: null },
      endDate: { type: Date, default: null },
      winnerName: { type: String, default: "" },
      winnerLogo: { type: String, default: "" },
      runnerUpName: { type: String, default: "" },
      runnerUpLogo: { type: String, default: "" },
      totalTeams: { type: Number, default: 0 },
      totalMatches: { type: Number, default: 0 },
      status: { type: String, default: "Completed" },
      createdAt: { type: Date, default: null },
      completedAt: { type: Date, default: null },
      archivedAt: { type: Date, default: null },
    },
    isPublished: { type: Boolean, default: false },
    /** Updated whenever league standings are recalculated from completed matches. */
    standingsUpdatedAt: { type: Date, default: null },
    teams: [{ type: mongoose.Schema.Types.ObjectId, ref: "Team" }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // Final results, persisted once the tournament auto-completes.
    winner: { type: mongoose.Schema.Types.ObjectId, ref: "Team", default: null },
    runnerUp: { type: mongoose.Schema.Types.ObjectId, ref: "Team", default: null },
    totalMatches: { type: Number, default: 0 },
    completedAt: { type: Date, default: null },
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

tournamentSchema.index({ tournamentName: "text", city: "text", groundName: "text" });
tournamentSchema.index({ createdBy: 1, isDeleted: 1 });
tournamentSchema.index({ createdBy: 1, isStorageArchived: 1, status: 1, completedAt: 1 });
tournamentSchema.index({ createdBy: 1, isDeleted: 1, isArchived: 1, createdAt: -1 });

const Tournament = mongoose.model("Tournament", tournamentSchema);
export default Tournament;
