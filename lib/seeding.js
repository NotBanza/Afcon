export const BRACKET_ROUNDS = {
  QUARTER: 'Quarter-Final',
  SEMI: 'Semi-Final',
  FINAL: 'Final',
};

const PAIRINGS = [
  [0, 7],
  [1, 6],
  [2, 5],
  [3, 4],
];

export function sortTeamsByRating(teams) {
  return [...teams].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
}

export function seedQuarterFinals(teams) {
  const rankedTeams = sortTeamsByRating(teams);
  const pairings = PAIRINGS.map(([seedA, seedB]) => ({
    teamA: rankedTeams[seedA] ?? null,
    teamB: rankedTeams[seedB] ?? null,
  }));

  return pairings;
}

export function validateSeedingInput(teams) {
  if (!Array.isArray(teams) || teams.length < 8) {
    throw new Error('Seeding requires at least 8 teams.');
  }
  const validCount = teams.filter((team) => team && team.id).length;
  if (validCount < 8) {
    throw new Error('Each seeded team must include an identifier.');
  }
}

export function buildMatchGraph(teams) {
  validateSeedingInput(teams);

  const pairs = seedQuarterFinals(teams);

  return {
    quarterfinals: pairs.map((pair, index) => ({
      slot: index + 1,
      team1Id: pair.teamA.id,
      team2Id: pair.teamB.id,
    })),
    semifinals: [
      { slot: 1 },
      { slot: 2 },
    ],
    final: { slot: 1 },
  };
}
