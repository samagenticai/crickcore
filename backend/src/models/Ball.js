import mongoose from "mongoose";

const ballSchema = new mongoose.Schema(
  {
    match: { type: mongoose.Schema.Types.ObjectId, ref: "Match", required: true },
    tournament: { type: mongoose.Schema.Types.ObjectId, ref: "Tournament", required: true },
    inningsNumber: { type: Number, default: 1 },
    sequence: { type: Number, required: true },
    overNumber: { type: Number, required: true },
    ballInOver: { type: Number, required: true },
    isLegal: { type: Boolean, default: true },
    type: {
      type: String,
      enum: ["runs", "wide", "no_ball", "bye", "leg_bye", "wicket"],
      required: true,
    },
    runs: { type: Number, default: 0 },
    extras: { type: Number, default: 0 },
    batsmanRuns: { type: Number, default: 0 },
    totalRuns: { type: Number, default: 0 },
    wickets: { type: Number, default: 0 },
    legalBalls: { type: Number, default: 0 },
    striker: { type: mongoose.Schema.Types.ObjectId, ref: "Player" },
    nonStriker: { type: mongoose.Schema.Types.ObjectId, ref: "Player" },
    bowler: { type: mongoose.Schema.Types.ObjectId, ref: "Player" },
    dismissedPlayer: { type: mongoose.Schema.Types.ObjectId, ref: "Player", default: null },
    newBatsman: { type: mongoose.Schema.Types.ObjectId, ref: "Player", default: null },
    dismissalType: { type: String, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

ballSchema.index({ match: 1, sequence: 1 }, { unique: true });
ballSchema.index({ tournament: 1 });
ballSchema.index({ match: 1, striker: 1 });
ballSchema.index({ match: 1, bowler: 1 });

const Ball = mongoose.model("Ball", ballSchema);
export default Ball;
