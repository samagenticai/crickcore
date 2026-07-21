import { formatOvers, calcRunRate } from "./liveScore.js";
import Ball from "../models/Ball.js";

const calcStrikeRate = (runs, balls) => {
  if (!balls) return 0;
  return Math.round((runs / balls) * 10000) / 100;
};

const calcEconomy = (runs, legalBalls) => {
  if (!legalBalls) return 0;
  return Math.round((runs / (legalBalls / 6)) * 100) / 100;
};

const formatDismissalText = (ball, bowlerName) => {
  const type = ball.dismissalType || "Out";
  const b = bowlerName || "—";
  switch (type) {
    case "Bowled":
      return `b ${b}`;
    case "Caught":
      return `c Fielder b ${b}`;
    case "Caught & Bowled":
      return `c & b ${b}`;
    case "LBW":
      return `lbw b ${b}`;
    case "Run Out":
      return "run out";
    case "Stumped":
      return `st b ${b}`;
    case "Hit Wicket":
      return `hit wicket b ${b}`;
    default:
      return type === "Out" ? `out b ${b}` : `${type} b ${b}`;
  }
};

export const buildInningsScorecard = (balls, match, liveScore) => {
  const ls = liveScore || {};
  const battingTeamId = String(ls.battingTeam || "");
  const teamAId = String(match.teamA?._id || match.teamA || "");
  const battingXI = battingTeamId === teamAId ? match.teamAPlayingXI || [] : match.teamBPlayingXI || [];
  const bowlingXI = battingTeamId === teamAId ? match.teamBPlayingXI || [] : match.teamAPlayingXI || [];

  const batStats = new Map();
  const bowlStats = new Map();
  const dismissals = new Map();
  const battingOrder = [];
  const bowlerNames = new Map();

  const ensureBat = (id) => {
    const key = String(id);
    if (!batStats.has(key)) {
      batStats.set(key, { runs: 0, balls: 0, fours: 0, sixes: 0, hasBatted: false });
    }
    return batStats.get(key);
  };

  const ensureBowl = (id) => {
    const key = String(id);
    if (!bowlStats.has(key)) {
      bowlStats.set(key, { legalBalls: 0, runs: 0, wickets: 0, overMap: new Map() });
    }
    return bowlStats.get(key);
  };

  const trackOrder = (id) => {
    const key = String(id);
    if (id && !battingOrder.includes(key)) battingOrder.push(key);
  };

  for (const player of [...battingXI, ...bowlingXI]) {
    if (player?.name) bowlerNames.set(String(player._id || player), player.name);
  }

  for (const ball of balls) {
    const strikerId = ball.striker ? String(ball.striker) : null;
    const nonStrikerId = ball.nonStriker ? String(ball.nonStriker) : null;
    const bowlerId = ball.bowler ? String(ball.bowler) : null;

    if (strikerId) trackOrder(strikerId);
    if (nonStrikerId) trackOrder(nonStrikerId);

    if (strikerId) {
      const bat = ensureBat(strikerId);
      bat.hasBatted = true;
      if (ball.isLegal) bat.balls += 1;
    }

    if (strikerId && ball.batsmanRuns) {
      const bat = ensureBat(strikerId);
      bat.runs += ball.batsmanRuns;
      if (ball.batsmanRuns === 4) bat.fours += 1;
      if (ball.batsmanRuns === 6) bat.sixes += 1;
    }

    if (ball.type === "wicket" && ball.dismissedPlayer) {
      const outId = String(ball.dismissedPlayer);
      const outBat = ensureBat(outId);
      outBat.hasBatted = true;
      trackOrder(outId);

      if (outId !== strikerId && ball.isLegal) {
        // Non-striker run out — striker already received the ball; non-striker did not face it.
      } else if (outId !== strikerId && !ball.isLegal) {
        // rare
      } else if (outId === nonStrikerId && strikerId && ball.isLegal) {
        // Non-striker dismissed on a legal ball they did not face — remove double count from striker if needed
        // Striker already got +1 ball above; non-striker gets no ball
      }

      if (outId === strikerId && !ball.isLegal) {
        // wide wicket etc — striker may not have been counted
      }

      const bowlerName = bowlerId ? bowlerNames.get(bowlerId) || "Bowler" : "Bowler";
      dismissals.set(outId, {
        type: ball.dismissalType || "Out",
        text: formatDismissalText(ball, bowlerName),
      });
    }

    if (bowlerId) {
      const bowl = ensureBowl(bowlerId);
      bowl.runs += ball.runs || 0;
      if (ball.isLegal) {
        bowl.legalBalls += 1;
        const overKey = `${ball.overNumber ?? 0}`;
        const prev = bowl.overMap.get(overKey) || { legal: 0, runs: 0 };
        bowl.overMap.set(overKey, {
          legal: prev.legal + 1,
          runs: prev.runs + (ball.runs || 0),
        });
      } else {
        const overKey = `${ball.overNumber ?? 0}`;
        const prev = bowl.overMap.get(overKey) || { legal: 0, runs: 0 };
        bowl.overMap.set(overKey, {
          legal: prev.legal,
          runs: prev.runs + (ball.runs || 0),
        });
      }
      if (ball.type === "wicket") bowl.wickets += 1;
    }
  }

  const strikerId = ls.striker ? String(ls.striker) : null;
  const nonStrikerId = ls.nonStriker ? String(ls.nonStriker) : null;
  const bowlerId = ls.bowler ? String(ls.bowler) : null;
  const dismissedSet = new Set((ls.dismissedPlayers || []).map(String));

  const batting = battingXI.map((player) => {
    const id = String(player._id || player);
    const stats = batStats.get(id) || { runs: 0, balls: 0, fours: 0, sixes: 0, hasBatted: false };
    const isOut = dismissedSet.has(id) || dismissals.has(id);
    let status = "yet_to_bat";
    if (isOut) status = "out";
    else if (id === strikerId) status = "on_strike";
    else if (id === nonStrikerId) status = "non_strike";
    else if (stats.hasBatted) status = "batting";

    const dismissal = dismissals.get(id) || null;

    return {
      playerId: id,
      name: player.name,
      role: player.role,
      jerseyNumber: player.jerseyNumber,
      runs: stats.runs,
      balls: stats.balls,
      fours: stats.fours,
      sixes: stats.sixes,
      strikeRate: calcStrikeRate(stats.runs, stats.balls),
      status,
      dismissal,
    };
  });

  batting.sort((a, b) => {
    const ai = battingOrder.indexOf(a.playerId);
    const bi = battingOrder.indexOf(b.playerId);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  const bowling = [...bowlStats.entries()].map(([id, stats]) => {
    let maidens = 0;
    stats.overMap.forEach((over) => {
      if (over.legal >= 6 && over.runs === 0) maidens += 1;
    });

    const player = bowlingXI.find((p) => String(p._id || p) === id);

    return {
      playerId: id,
      name: player?.name || bowlerNames.get(id) || "Bowler",
      role: player?.role || "Bowler",
      overs: formatOvers(stats.legalBalls),
      legalBalls: stats.legalBalls,
      maidens,
      runs: stats.runs,
      wickets: stats.wickets,
      economy: calcEconomy(stats.runs, stats.legalBalls),
      isCurrent: id === bowlerId,
    };
  });

  bowling.sort((a, b) => b.legalBalls - a.legalBalls || b.wickets - a.wickets);

  return { batting, bowling };
};

/** Build the locked first-innings scorecard during the innings break. */
export const buildFirstInningsScorecard = async (match, ls) => {
  if (ls?.firstInnings?.runs == null) return { batting: [], bowling: [] };

  const teamAId = String(match.teamA?._id || match.teamA);
  const firstBatId = String(ls.firstInnings.battingTeam);
  const bowlingTeamId =
    firstBatId === teamAId
      ? String(match.teamB?._id || match.teamB)
      : teamAId;

  const [firstBalls, dismissed] = await Promise.all([
    Ball.find({ match: match._id, inningsNumber: 1 })
      .sort({ sequence: 1 })
      .populate("dismissedPlayer", "name"),
    Ball.find({
      match: match._id,
      inningsNumber: 1,
      type: "wicket",
      dismissedPlayer: { $ne: null },
    }).distinct("dismissedPlayer"),
  ]);

  return buildInningsScorecard(firstBalls, match, {
    battingTeam: firstBatId,
    bowlingTeam: bowlingTeamId,
    totalRuns: ls.firstInnings.runs,
    wickets: ls.firstInnings.wickets,
    legalBalls: ls.firstInnings.legalBalls,
    dismissedPlayers: dismissed,
  });
};

export const formatBattingLine = (b) =>
  `${b.runs} (${b.balls}) | ${b.fours}×4 | ${b.sixes}×6 | SR ${b.strikeRate.toFixed(2)}`;
