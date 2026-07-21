import mongoose from "mongoose";

// Describes how a team slot on a match should be resolved when it isn't
// known yet at fixture-generation time (knockout / hybrid placeholders).
const slotSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["fixed", "groupRank", "matchWinner"],
      default: "fixed",
    },
    group: { type: String },        // used when type === "groupRank", e.g. "Group A"
    rank: { type: Number },         // used when type === "groupRank", 1 = winner, 2 = runner-up
    sourceMatch: { type: Number },  // used when type === "matchWinner", refers to matchNumber
    label: { type: String, default: "" }, // display placeholder e.g. "Winner Group A"
  },
  { _id: false }
);

const matchSchema = new mongoose.Schema(
  {
    tournament: { type: mongoose.Schema.Types.ObjectId, ref: "Tournament", required: true },
    teamA: { type: mongoose.Schema.Types.ObjectId, ref: "Team", default: null },
    teamB: { type: mongoose.Schema.Types.ObjectId, ref: "Team", default: null },
    teamASlot: { type: slotSchema, default: () => ({ type: "fixed" }) },
    teamBSlot: { type: slotSchema, default: () => ({ type: "fixed" }) },
    winner: { type: mongoose.Schema.Types.ObjectId, ref: "Team", default: null },
    venue: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Venue",
      default: null,
      set: (v) => {
        if (v == null || v === "") return null;
        return v;
      },
    },
    matchNumber: { type: Number, default: 1 },
    round: { type: String, default: "League" },
    stage: { type: Number, default: 0 }, // chronological dependency tier used for scheduling
    leg: { type: Number, default: 1 },
    scheduledDate: { type: Date },
    matchTime: { type: String, default: "10:00 AM" },
    matchDurationMinutes: { type: Number, default: 180 },
    status: {
      type: String,
      enum: ["Scheduled", "Live", "Completed", "Cancelled"],
      default: "Scheduled",
    },
    overs: { type: Number, default: 20 },
    teamAPlayingXI: [{ type: mongoose.Schema.Types.ObjectId, ref: "Player" }],
    teamBPlayingXI: [{ type: mongoose.Schema.Types.ObjectId, ref: "Player" }],
    umpires: [{ type: mongoose.Schema.Types.ObjectId, ref: "Umpire" }],
    umpireNames: [{ type: String, trim: true }],
    /** Official scorer for this match */
    scorer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Scorer",
      default: null,
      set: (v) => {
        if (v == null || v === "") return null;
        return v;
      },
    },
    /** Snapshot so scorecards keep the name after scorer is deleted */
    scorerName: { type: String, default: "", trim: true },
    tossWinner: { type: mongoose.Schema.Types.ObjectId, ref: "Team", default: null },
    tossDecision: { type: String, enum: ["Bat", "Bowl"], default: null },
    startedAt: { type: Date, default: null },
    resultSummary: { type: String, default: null },
    resultType: { type: String, default: null },
    resultMargin: { type: Number, default: null },
    liveScore: {
      inningsNumber: { type: Number, default: 1 },
      battingTeam: { type: mongoose.Schema.Types.ObjectId, ref: "Team", default: null },
      bowlingTeam: { type: mongoose.Schema.Types.ObjectId, ref: "Team", default: null },
      striker: { type: mongoose.Schema.Types.ObjectId, ref: "Player", default: null },
      nonStriker: { type: mongoose.Schema.Types.ObjectId, ref: "Player", default: null },
      bowler: { type: mongoose.Schema.Types.ObjectId, ref: "Player", default: null },
      totalRuns: { type: Number, default: 0 },
      wickets: { type: Number, default: 0 },
      legalBalls: { type: Number, default: 0 },
      wides: { type: Number, default: 0 },
      noBalls: { type: Number, default: 0 },
      byes: { type: Number, default: 0 },
      legByes: { type: Number, default: 0 },
      isInitialized: { type: Boolean, default: false },
      inningsLocked: { type: Boolean, default: false },
      awaitingSecondInnings: { type: Boolean, default: false },
      target: { type: Number, default: null },
      firstInnings: {
        runs: { type: Number, default: null },
        wickets: { type: Number, default: null },
        legalBalls: { type: Number, default: null },
        battingTeam: { type: mongoose.Schema.Types.ObjectId, ref: "Team", default: null },
      },
      /** Bowler who completed the last over — used for consecutive-over rule */
      lastOverBowler: { type: mongoose.Schema.Types.ObjectId, ref: "Player", default: null },
      /** True between over completion and next bowler selection */
      overBreakPending: { type: Boolean, default: false },
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

matchSchema.index({ tournament: 1, matchNumber: 1 });
matchSchema.index({ tournament: 1, status: 1 });
matchSchema.index({ createdBy: 1, createdAt: -1 });

const Match = mongoose.model("Match", matchSchema);
export default Match;
