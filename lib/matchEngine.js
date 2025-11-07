// lib/matchEngine.js
// Shared helpers for simulating matches, including extra time and penalties.

import { calculatePlayerOverall } from '@/lib/playerUtils';

const REGULAR_TIME_MINUTES = 90;
const EXTRA_TIME_MINUTES = 30;
const GOAL_PROBABILITY_MODIFIER = 0.055;

const roundToTwo = (value) => Number(value.toFixed(2));

const ensureNumber = (value, fallback = 0) =>
  Number.isFinite(value) ? value : fallback;

const pickRandom = (items = []) => {
  if (!items.length) return null;
  const index = Math.floor(Math.random() * items.length);
  return items[index];
};

const calculateTeamStrength = (players = [], fallbackAverage = 50) => {
  if (!players.length) {
    return ensureNumber(fallbackAverage, 50);
  }

  const totals = players.map((player) => {
    if (typeof player.overall === 'number') {
      return player.overall;
    }
    return calculatePlayerOverall(player.ratings || {});
  });

  const sum = totals.reduce((acc, item) => acc + item, 0);
  return roundToTwo(sum / players.length);
};

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const simulatePeriod = ({
  startMinute,
  duration,
  team1,
  team2,
  team1Chance,
  team2Chance,
  results,
}) => {
  for (let minute = 0; minute < duration; minute += 1) {
    const absoluteMinute = startMinute + minute;
    if (Math.random() < team1Chance) {
      const scorer = pickRandom(team1.players);
      results.score.team1 += 1;
      if (scorer) {
        results.goalscorers.push({
          minute: absoluteMinute,
          scorerName: scorer.name,
          playerId: scorer.id,
          playerCountry: scorer.country || scorer.nationality,
          teamId: team1.id,
          teamCountry: team1.name,
          teamName: team1.name,
        });
      }
    }
    if (Math.random() < team2Chance) {
      const scorer = pickRandom(team2.players);
      results.score.team2 += 1;
      if (scorer) {
        results.goalscorers.push({
          minute: absoluteMinute,
          scorerName: scorer.name,
          playerId: scorer.id,
          playerCountry: scorer.country || scorer.nationality,
          teamId: team2.id,
          teamCountry: team2.name,
          teamName: team2.name,
        });
      }
    }
  }
};

const runPenaltyShootout = (team1, team2) => {
  const sequence = [];
  let team1Score = 0;
  let team2Score = 0;
  const totalRounds = 5;

  for (let round = 1; round <= totalRounds; round += 1) {
    const team1Goal = Math.random() < 0.75; // 75% conversion rate
    const team2Goal = Math.random() < 0.75;

    if (team1Goal) team1Score += 1;
    if (team2Goal) team2Score += 1;

    sequence.push({
      round,
      team1Goal,
      team2Goal,
    });
  }

  let suddenDeathRound = 1;
  while (team1Score === team2Score) {
    const team1Goal = Math.random() < 0.75;
    const team2Goal = Math.random() < 0.75;
    if (team1Goal) team1Score += 1;
    if (team2Goal) team2Score += 1;
    sequence.push({
      round: totalRounds + suddenDeathRound,
      team1Goal,
      team2Goal,
      suddenDeath: true,
    });
    suddenDeathRound += 1;
  }

  const winnerId = team1Score > team2Score ? team1.id : team2.id;
  return {
    winnerId,
    penalties: {
      team1: team1Score,
      team2: team2Score,
      sequence,
    },
  };
};

const buildMatchStats = (team1, team2, results) => {
  const possessionTeam1 = randomInt(40, 60);
  const possessionTeam2 = 100 - possessionTeam1;

  const baseShotsTeam1 = Math.max(results.score.team1, randomInt(5, 15));
  const baseShotsTeam2 = Math.max(results.score.team2, randomInt(3, 12));

  const foulsTeam1 = randomInt(5, 20);
  const foulsTeam2 = randomInt(5, 20);

  const yellowTeam1 = Math.min(randomInt(0, 3), foulsTeam1);
  const yellowTeam2 = Math.min(randomInt(0, 3), foulsTeam2);

  const redTeam1 = yellowTeam1 > 1 && randomInt(0, 4) === 0 ? 1 : 0;
  const redTeam2 = yellowTeam2 > 1 && randomInt(0, 4) === 0 ? 1 : 0;

  return {
    possession: {
      [team1.id]: possessionTeam1,
      [team2.id]: possessionTeam2,
    },
    shots: {
      [team1.id]: baseShotsTeam1,
      [team2.id]: baseShotsTeam2,
    },
    fouls: {
      [team1.id]: foulsTeam1,
      [team2.id]: foulsTeam2,
    },
    yellowCards: {
      [team1.id]: yellowTeam1,
      [team2.id]: yellowTeam2,
    },
    redCards: {
      [team1.id]: redTeam1,
      [team2.id]: redTeam2,
    },
  };
};

export const determineWinner = (team1Id, team2Id, score, fallbackWinner) => {
  if (score.team1 > score.team2) {
    return team1Id;
  }
  if (score.team2 > score.team1) {
    return team2Id;
  }
  return fallbackWinner;
};

export function buildTeamContext(teamDoc, players) {
  const data = teamDoc.data() || {};
  return {
    id: teamDoc.id,
    name: data.country,
    players,
    averageRating: ensureNumber(data.averageRating, 50),
    contactEmail: data.contactEmail,
  };
}

export function simulateMatch({ team1, team2 }) {
  const team1Strength = calculateTeamStrength(team1.players, team1.averageRating);
  const team2Strength = calculateTeamStrength(team2.players, team2.averageRating);

  const totalStrength = team1Strength + team2Strength || 1;

  const combinedStrength = team1Strength + team2Strength || 1;
  const baseChance = Math.min(Math.max(combinedStrength / 170, 0.65), 1.15);
  const team1Chance = (team1Strength / totalStrength) * GOAL_PROBABILITY_MODIFIER * baseChance;
  const team2Chance = (team2Strength / totalStrength) * GOAL_PROBABILITY_MODIFIER * baseChance;

  const results = {
    score: { team1: 0, team2: 0 },
    goalscorers: [],
    resolution: 'regular',
    penalties: null,
    team1Strength,
    team2Strength,
  };

  simulatePeriod({
    startMinute: 1,
    duration: REGULAR_TIME_MINUTES,
    team1,
    team2,
    team1Chance,
    team2Chance,
    results,
  });

  if (results.score.team1 === results.score.team2) {
    results.resolution = 'extra-time';
    simulatePeriod({
      startMinute: REGULAR_TIME_MINUTES + 1,
      duration: EXTRA_TIME_MINUTES,
      team1,
      team2,
      team1Chance: team1Chance / 1.5,
      team2Chance: team2Chance / 1.5,
      results,
    });
  }

  let winnerId = determineWinner(team1.id, team2.id, results.score, team1Strength >= team2Strength ? team1.id : team2.id);

  if (results.score.team1 === results.score.team2) {
    results.resolution = 'penalties';
    const shootout = runPenaltyShootout(team1, team2);
    winnerId = shootout.winnerId;
    results.penalties = shootout.penalties;
  }

  const stats = buildMatchStats(team1, team2, results);

  return {
    ...results,
    winnerId,
    stats,
  };
}
