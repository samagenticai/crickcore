import Tournament from "../models/Tournament.js";
import Match from "../models/Match.js";
import Team from "../models/Team.js";
import Player from "../models/Player.js";
import { scrubEmptyObjectIdRefs } from "./objectId.js";

/**
 * Legacy data sometimes stored "" in ObjectId ref fields, which causes
 * CastError on populate("venue") etc. Normalize those to null at boot.
 */
export async function scrubInvalidObjectIdRefs() {
  await scrubEmptyObjectIdRefs(Tournament, ["venue", "createdBy"]);
  await scrubEmptyObjectIdRefs(Match, ["venue", "teamA", "teamB", "tossWinner", "winner", "tournament"]);
  await scrubEmptyObjectIdRefs(Team, ["tournament", "createdBy"]);
  await scrubEmptyObjectIdRefs(Player, ["team", "tournament", "createdBy"]);
}
