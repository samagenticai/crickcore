import { buildInningsScorecard } from "./scorecard.js";
import { formatOvers, formatBallLabel, calcRunRate } from "./liveScore.js";
import { formatTossResult } from "./toss.js";

const teamId = (team) => String(team?._id || team);

const oppositeTeamId = (match, battingTeamId) => {
  const a = teamId(match.teamA);
  const b = teamId(match.teamB);
  return String(battingTeamId) === a ? b : a;
};

const teamNameById = (match, id) => {
  const sid = String(id);
  if (sid === teamId(match.teamA)) return match.teamA?.name || "Team A";
  if (sid === teamId(match.teamB)) return match.teamB?.name || "Team B";
  return "Team";
};

const calcInningsExtras = (balls) => {
  let wides = 0;
  let noBalls = 0;
  let byes = 0;
  let legByes = 0;

  for (const ball of balls) {
    if (ball.type === "wide") wides += ball.runs || 1;
    else if (ball.type === "no_ball") noBalls += 1;
    else if (ball.type === "bye") byes += ball.runs || 0;
    else if (ball.type === "leg_bye") legByes += ball.runs || 0;
  }

  return { wides, noBalls, byes, legByes, total: wides + noBalls + byes + legByes };
};

const mapBall = (ball) => ({
  _id: ball._id,
  inningsNumber: ball.inningsNumber,
  type: ball.type,
  runs: ball.runs,
  batsmanRuns: ball.batsmanRuns,
  sequence: ball.sequence,
  label: formatBallLabel(ball),
  isLegal: ball.isLegal,
  overNumber: ball.overNumber,
  ballInOver: ball.ballInOver,
});

export const groupBallsByOver = (balls = []) => {
  const map = new Map();
  for (const ball of balls) {
    const over = ball.overNumber ?? 0;
    if (!map.has(over)) map.set(over, []);
    map.get(over).push(ball);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a - b)
    .map(([overNumber, overBalls]) => ({
      overNumber,
      balls: overBalls,
      runs: overBalls.reduce((sum, b) => sum + (b.runs || 0), 0),
    }));
};

const normalizeBattingForResult = (batting = []) =>
  batting.map((b) => {
    let dismissalDisplay = "Not Out";
    let battingStatus = "Not Out";
    if (b.status === "yet_to_bat") {
      dismissalDisplay = "DNB (Did Not Bat)";
      battingStatus = "DNB";
    } else if (b.status === "out") {
      dismissalDisplay = b.dismissal?.text || "Out";
      battingStatus = "Out";
    }

    return {
      ...b,
      dismissalDisplay,
      battingStatus,
      isNotOut: b.status !== "yet_to_bat" && b.status !== "out",
    };
  });

const inferFirstInningsBattingTeam = (match, balls) => {
  const ls = match.liveScore || {};
  if (ls.firstInnings?.battingTeam) return String(ls.firstInnings.battingTeam);
  const a = teamId(match.teamA);
  const lsBat = ls.battingTeam ? String(ls.battingTeam) : null;
  if (ls.inningsNumber === 2 && lsBat) return oppositeTeamId(match, lsBat);
  return a;
};

const buildInningsResult = (match, inningsNumber, allBalls, liveScoreSnapshot) => {
  const inningsBalls = allBalls.filter((b) => (b.inningsNumber || 1) === inningsNumber);
  if (inningsBalls.length === 0) return null;

  const dismissedPlayers = [
    ...new Set(
      inningsBalls
        .filter((b) => b.type === "wicket" && b.dismissedPlayer)
        .map((b) => String(b.dismissedPlayer))
    ),
  ];

  const scorecard = buildInningsScorecard(inningsBalls, match, {
    ...liveScoreSnapshot,
    dismissedPlayers,
    striker: null,
    nonStriker: null,
    bowler: null,
  });

  const batting = normalizeBattingForResult(scorecard.batting);
  const lastBall = inningsBalls[inningsBalls.length - 1];
  const ls = match.liveScore || {};

  let runs = lastBall?.totalRuns ?? 0;
  let wickets = lastBall?.wickets ?? 0;
  let legalBalls = inningsBalls.filter((b) => b.isLegal).length;

  if (inningsNumber === 1 && ls.firstInnings?.runs != null) {
    runs = ls.firstInnings.runs;
    wickets = ls.firstInnings.wickets ?? wickets;
    legalBalls = ls.firstInnings.legalBalls ?? legalBalls;
  } else if (inningsNumber === 2 && ls.inningsNumber === 2) {
    runs = ls.totalRuns ?? runs;
    wickets = ls.wickets ?? wickets;
    legalBalls = ls.legalBalls ?? legalBalls;
  }

  const battingTeamId = String(liveScoreSnapshot.battingTeam);
  const extras = calcInningsExtras(inningsBalls);

  return {
    inningsNumber,
    battingTeamId,
    battingTeamName: teamNameById(match, battingTeamId),
    bowlingTeamName: teamNameById(match, liveScoreSnapshot.bowlingTeam),
    score: `${runs}/${wickets}`,
    runs,
    wickets,
    overs: formatOvers(legalBalls),
    legalBalls,
    runRate: calcRunRate(runs, legalBalls),
    extras,
    totalFours: batting.reduce((s, b) => s + (b.fours || 0), 0),
    totalSixes: batting.reduce((s, b) => s + (b.sixes || 0), 0),
    scorecard: { batting, bowling: scorecard.bowling },
  };
};

const calcBestPartnership = (balls, inningsNumber, match) => {
  const inningsBalls = balls
    .filter((b) => (b.inningsNumber || 1) === inningsNumber)
    .sort((a, b) => a.sequence - b.sequence);

  const nameOf = (id) => {
    if (!id) return null;
    const sid = String(id);
    const all = [...(match.teamAPlayingXI || []), ...(match.teamBPlayingXI || [])];
    const p = all.find((x) => String(x._id || x) === sid);
    return p?.name || null;
  };

  let best = { runs: 0, forWicket: 0, batsmen: [], label: "" };
  let current = 0;
  let wicketNum = 0;
  let striker = null;
  let nonStriker = null;

  const recordIfBest = () => {
    if (current <= best.runs) return;
    const names = [nameOf(striker), nameOf(nonStriker)].filter(Boolean);
    best = {
      runs: current,
      forWicket: wicketNum,
      batsmen: names,
      label:
        names.length >= 2
          ? `${names.join(" & ")} — ${current} runs (${wicketNum}${wicketNum === 1 ? "st" : "th"} wicket)`
          : `${current} runs (${wicketNum}${wicketNum === 1 ? "st" : "th"} wicket)`,
    };
  };

  for (const ball of inningsBalls) {
    current += ball.runs || 0;
    if (ball.striker) striker = ball.striker;
    if (ball.nonStriker) nonStriker = ball.nonStriker;
    if (ball.type === "wicket") {
      recordIfBest();
      current = 0;
      wicketNum += 1;
    }
  }
  recordIfBest();
  return best.runs > 0 ? best : null;
};

const derivePlayerOfTheMatch = (innings) => {
  const batters = [];
  const bowlers = [];

  for (const inn of innings) {
    batters.push(...(inn.scorecard?.batting || []).filter((b) => (b.balls || 0) > 0));
    bowlers.push(...(inn.scorecard?.bowling || []).filter((b) => (b.legalBalls || 0) > 0));
  }

  const topBatter = [...batters].sort((a, b) => b.runs - a.runs || b.balls - a.balls)[0];
  const topBowler = [...bowlers].sort(
    (a, b) => b.wickets - a.wickets || a.economy - b.economy
  )[0];

  if (topBowler && topBowler.wickets >= 3) {
    return {
      playerId: topBowler.playerId,
      name: topBowler.name,
      role: topBowler.role,
      highlight: `${topBowler.wickets}/${topBowler.runs} (${Number(topBowler.economy || 0).toFixed(2)})`,
    };
  }
  if (topBatter && topBatter.runs >= 25) {
    return {
      playerId: topBatter.playerId,
      name: topBatter.name,
      role: topBatter.role,
      highlight: `${topBatter.runs} (${topBatter.balls})`,
    };
  }
  if (topBowler && topBowler.wickets > 0) {
    return {
      playerId: topBowler.playerId,
      name: topBowler.name,
      role: topBowler.role,
      highlight: `${topBowler.wickets} wickets`,
    };
  }
  if (topBatter) {
    return {
      playerId: topBatter.playerId,
      name: topBatter.name,
      role: topBatter.role,
      highlight: `${topBatter.runs} runs`,
    };
  }
  return null;
};

const mergeBattingEntry = (prev, next) => {
  if (!next || next.status === "yet_to_bat") return prev;
  if (!prev || prev.status === "yet_to_bat") return { ...next };

  const runs = (prev.runs || 0) + (next.runs || 0);
  const balls = (prev.balls || 0) + (next.balls || 0);
  const fours = (prev.fours || 0) + (next.fours || 0);
  const sixes = (prev.sixes || 0) + (next.sixes || 0);
  const strikeRate = balls ? Math.round((runs / balls) * 10000) / 100 : 0;
  const isOut = prev.status === "out" || next.status === "out";

  return {
    ...next,
    runs,
    balls,
    fours,
    sixes,
    strikeRate,
    status: isOut ? "out" : next.status,
    dismissal: isOut ? next.dismissal || prev.dismissal : null,
    dismissalDisplay: isOut
      ? next.dismissal?.text || prev.dismissal?.text || "Out"
      : "Not Out",
    isNotOut: !isOut,
  };
};

const mergeBowlingEntry = (prev, next) => {
  if (!next || !(next.legalBalls || 0)) return prev;
  if (!prev || !(prev.legalBalls || 0)) return { ...next };

  const legalBalls = (prev.legalBalls || 0) + (next.legalBalls || 0);
  const runs = (prev.runs || 0) + (next.runs || 0);
  const wickets = (prev.wickets || 0) + (next.wickets || 0);
  const maidens = (prev.maidens || 0) + (next.maidens || 0);
  const economy = legalBalls ? Math.round((runs / (legalBalls / 6)) * 100) / 100 : 0;

  return {
    ...next,
    legalBalls,
    runs,
    wickets,
    maidens,
    overs: formatOvers(legalBalls),
    economy,
  };
};

const toBattingStats = (bat) => {
  if (!bat || bat.status === "yet_to_bat") {
    return {
      status: "DNB",
      dismissal: "DNB (Did Not Bat)",
      runs: null,
      balls: null,
      fours: null,
      sixes: null,
      strikeRate: null,
    };
  }

  const isOut = bat.status === "out";
  return {
    status: isOut ? "Out" : "Not Out",
    dismissal: isOut ? bat.dismissal?.text || bat.dismissalDisplay || "Out" : "Not Out",
    runs: bat.runs ?? 0,
    balls: bat.balls ?? 0,
    fours: bat.fours ?? 0,
    sixes: bat.sixes ?? 0,
    strikeRate: Number(bat.strikeRate ?? 0),
  };
};

const toBowlingStats = (bowl) => {
  if (!bowl || !(bowl.legalBalls || 0)) return null;

  return {
    overs: bowl.overs ?? formatOvers(bowl.legalBalls || 0),
    maidens: bowl.maidens ?? 0,
    runs: bowl.runs ?? 0,
    wickets: bowl.wickets ?? 0,
    economy: Number(bowl.economy ?? 0),
  };
};

const buildPlayerStatsMaps = (innings) => {
  const batMap = new Map();
  const bowlMap = new Map();

  for (const inn of innings) {
    for (const b of inn.scorecard?.batting || []) {
      const id = String(b.playerId);
      batMap.set(id, mergeBattingEntry(batMap.get(id), b));
    }
    for (const b of inn.scorecard?.bowling || []) {
      const id = String(b.playerId);
      bowlMap.set(id, mergeBowlingEntry(bowlMap.get(id), b));
    }
  }

  return { batMap, bowlMap };
};

const enrichPlayingXI = (players, innings) => {
  const { batMap, bowlMap } = buildPlayerStatsMaps(innings);

  return (players || []).map((player) => {
    const id = String(player._id || player);
    const bat = batMap.get(id);
    const bowl = bowlMap.get(id);
    const battingStats = toBattingStats(bat);
    const bowlingStats = toBowlingStats(bowl);

    return {
      ...player,
      _id: player._id || player,
      battingStats,
      bowlingStats,
      battingNote: battingStats.dismissal,
      bowlingNote: bowlingStats
        ? `${bowlingStats.overs} ov · ${bowlingStats.wickets} wkts · Econ ${bowlingStats.economy.toFixed(2)}`
        : "Did Not Bowl",
      batted: battingStats.status !== "DNB",
      bowled: Boolean(bowlingStats),
    };
  });
};

export const buildMatchResult = (match, allBalls = []) => {
  const ls = match.liveScore || {};
  const inningsNumbers = [...new Set(allBalls.map((b) => b.inningsNumber || 1))].sort(
    (a, b) => a - b
  );

  if (inningsNumbers.length === 0 && ls.firstInnings?.runs == null) {
    return null;
  }

  const innings = [];

  if (inningsNumbers.includes(1) || ls.firstInnings?.runs != null) {
    const battingTeamId = inferFirstInningsBattingTeam(match, allBalls);
    const built = buildInningsResult(match, 1, allBalls, {
      battingTeam: battingTeamId,
      bowlingTeam: oppositeTeamId(match, battingTeamId),
    });
    if (built) innings.push(built);
  }

  if (inningsNumbers.includes(2) || ls.inningsNumber === 2) {
    const battingTeamId = String(
      ls.battingTeam || oppositeTeamId(match, inferFirstInningsBattingTeam(match, allBalls))
    );
    const built = buildInningsResult(match, 2, allBalls, {
      battingTeam: battingTeamId,
      bowlingTeam: oppositeTeamId(match, battingTeamId),
    });
    if (built) innings.push(built);
  }

  if (innings.length === 0) return null;

  const ballHistory = allBalls.map(mapBall);
  const overTimeline = innings.map((inn) => ({
    inningsNumber: inn.inningsNumber,
    battingTeamName: inn.battingTeamName,
    overs: groupBallsByOver(ballHistory.filter((b) => b.inningsNumber === inn.inningsNumber)),
  }));

  const allBatting = innings.flatMap((i) => i.scorecard.batting);
  const allBowling = innings.flatMap((i) => i.scorecard.bowling);

  const highestRunScorer = [...allBatting]
    .filter((b) => (b.balls || 0) > 0)
    .sort((a, b) => b.runs - a.runs || b.balls - a.balls)[0];

  const bestBowler = [...allBowling]
    .filter((b) => (b.legalBalls || 0) > 0)
    .sort((a, b) => b.wickets - a.wickets || a.economy - b.economy)[0];

  const partnerships = innings
    .map((inn) => calcBestPartnership(allBalls, inn.inningsNumber, match))
    .filter(Boolean);
  const bestPartnership = partnerships.sort((a, b) => b.runs - a.runs)[0] || null;

  const winnerId = match.winner ? String(match.winner) : null;
  const teamAId = teamId(match.teamA);
  const teamBId = teamId(match.teamB);
  const winnerTeam =
    winnerId === teamAId ? match.teamA : winnerId === teamBId ? match.teamB : null;
  const runnerUpTeam =
    winnerId === teamAId ? match.teamB : winnerId === teamBId ? match.teamA : null;

  const venue = match.venue;

  return {
    innings,
    overTimeline,
    ballHistory,
    summary: {
      winner: winnerTeam
        ? { _id: teamId(winnerTeam), name: winnerTeam.name, logo: winnerTeam.logo }
        : null,
      runnerUp: runnerUpTeam
        ? { _id: teamId(runnerUpTeam), name: runnerUpTeam.name, logo: runnerUpTeam.logo }
        : null,
      resultSummary: match.resultSummary,
      resultType: match.resultType,
      resultMargin: match.resultMargin,
      playerOfTheMatch: derivePlayerOfTheMatch(innings),
      highestRunScorer: highestRunScorer
        ? {
            playerId: highestRunScorer.playerId,
            name: highestRunScorer.name,
            runs: highestRunScorer.runs,
            balls: highestRunScorer.balls,
          }
        : null,
      bestBowler: bestBowler
        ? {
            playerId: bestBowler.playerId,
            name: bestBowler.name,
            wickets: bestBowler.wickets,
            runs: bestBowler.runs,
            economy: bestBowler.economy,
          }
        : null,
      bestPartnership,
      totalFours: innings.reduce((s, i) => s + i.totalFours, 0),
      totalSixes: innings.reduce((s, i) => s + i.totalSixes, 0),
      extras: innings.reduce(
        (acc, i) => ({
          wides: acc.wides + i.extras.wides,
          noBalls: acc.noBalls + i.extras.noBalls,
          byes: acc.byes + i.extras.byes,
          legByes: acc.legByes + i.extras.legByes,
          total: acc.total + i.extras.total,
        }),
        { wides: 0, noBalls: 0, byes: 0, legByes: 0, total: 0 }
      ),
      tossResult: formatTossResult(match),
      venue: venue
        ? {
            name: venue.venueName || venue.name,
            city: venue.city,
            address: venue.groundAddress || venue.address,
            label: [venue.venueName || venue.name, venue.city].filter(Boolean).join(", "),
          }
        : null,
      matchDate: match.scheduledDate,
      matchTime: match.matchTime,
      round: match.round,
    },
    playingXI: {
      teamA: enrichPlayingXI(match.teamAPlayingXI, innings),
      teamB: enrichPlayingXI(match.teamBPlayingXI, innings),
    },
  };
};
