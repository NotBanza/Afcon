import admin from '@/lib/firebase-admin';

const MATCHES_COLLECTION = 'matches';
const TEAMS_COLLECTION = 'teams';

const ROUND_KEYS = {
  'Quarter-Final': 'quarterfinals',
  'Semi-Final': 'semifinals',
  Final: 'finals',
};

function toDateValue(timestamp) {
  if (!timestamp) {
    return null;
  }
  try {
    if (typeof timestamp.toDate === 'function') {
      return timestamp.toDate();
    }
    if (timestamp instanceof Date) {
      return timestamp;
    }
  } catch (error) {
    console.warn('Unable to convert timestamp to Date', error);
  }
  return null;
}

async function fetchTeamsMap(teamIds = []) {
  if (!teamIds.length) {
    return new Map();
  }

  const uniqueIds = Array.from(new Set(teamIds.filter(Boolean)));
  const teamsMap = new Map();
  const chunkSize = 10;
  for (let index = 0; index < uniqueIds.length; index += chunkSize) {
    const chunk = uniqueIds.slice(index, index + chunkSize);
    const snapshot = await admin
      .firestore()
      .collection(TEAMS_COLLECTION)
      .where(admin.firestore.FieldPath.documentId(), 'in', chunk)
      .get();

    snapshot.forEach((docSnap) => {
      teamsMap.set(docSnap.id, docSnap.data());
    });
  }
  return teamsMap;
}

function deriveTeamMeta(teamDoc) {
  const data = teamDoc.data();
  const rawCountry = data.country;

  let name = data.federationName || data.countryName || data.displayName || data.name || 'Unknown Federation';
  let flag = data.flag || null;
  let managerName = data.managerName || 'Not listed';
  let shortName = data.shortName || null;

  if (!flag && rawCountry && typeof rawCountry === 'object') {
    flag = rawCountry.flag || rawCountry.flagUrl || null;
    name = name === 'Unknown Federation' ? rawCountry.name || rawCountry.country || name : name;
    shortName = shortName || rawCountry.code || rawCountry.abbr || null;
  }

  if (typeof rawCountry === 'string' && name === 'Unknown Federation') {
    name = rawCountry;
  }

  const rating = typeof data.rating === 'number'
    ? data.rating
    : typeof data.averageRating === 'number'
      ? data.averageRating
      : 0;

  return {
    id: teamDoc.id,
    name,
    shortName: (shortName || name.slice(0, 3)).toUpperCase(),
    managerName,
    flag,
    rating,
    raw: data,
  };
}

function buildGoalTrend(matches, teamId, opponentsMap) {
  const trend = [];
  let goalsFor = 0;
  let goalsAgainst = 0;
  let wins = 0;
  let losses = 0;
  let draws = 0;

  matches.forEach((match, index) => {
    const isTeam1 = match.team1Id === teamId;
    const opponentId = isTeam1 ? match.team2Id : match.team1Id;
    const opponentData = opponentId ? opponentsMap.get(opponentId) : null;

    const opponentName = opponentData?.federationName
      || opponentData?.countryName
      || opponentData?.name
      || opponentData?.displayName
      || 'Awaiting Opponent';

    const teamScore = Number(isTeam1 ? match.score?.team1 : match.score?.team2) || 0;
    const opponentScore = Number(isTeam1 ? match.score?.team2 : match.score?.team1) || 0;

    goalsFor += teamScore;
    goalsAgainst += opponentScore;

    if (teamScore > opponentScore) {
      wins += 1;
    } else if (teamScore < opponentScore) {
      losses += 1;
    } else {
      draws += 1;
    }

    trend.push({
      matchNumber: index + 1,
      goals: teamScore,
      opponent: opponentName,
      matchId: match.id,
      date: toDateValue(match.completedAt) || toDateValue(match.updatedAt) || toDateValue(match.createdAt) || null,
    });
  });

  return {
    trend,
    summary: {
      wins,
      losses,
      draws,
      goalsFor,
      goalsAgainst,
    },
  };
}

function buildPerformance(matches) {
  const performance = {
    quarterfinals: 0,
    semifinals: 0,
    finals: 0,
  };

  matches.forEach((match) => {
    const key = ROUND_KEYS[match.round];
    if (key) {
      performance[key] += 1;
    }
  });

  return performance;
}

function buildRatingTrend(matches, teamMeta) {
  const history = Array.isArray(teamMeta.raw?.ratingHistory) ? teamMeta.raw.ratingHistory : null;

  if (history && history.length) {
    return history.map((entry, index) => ({
      matchNumber: index + 1,
      rating: typeof entry.rating === 'number' ? entry.rating : teamMeta.rating,
      date: toDateValue(entry.date) || null,
    }));
  }

  return matches.map((match, index) => ({
    matchNumber: index + 1,
    rating: teamMeta.rating,
    date: toDateValue(match.completedAt) || toDateValue(match.updatedAt) || null,
  }));
}

export async function getTeamAnalytics(teamId) {
  if (!teamId) {
    throw new Error('Team ID is required for analytics.');
  }

  const teamRef = admin.firestore().collection(TEAMS_COLLECTION).doc(teamId);
  const teamDoc = await teamRef.get();

  if (!teamDoc.exists) {
    return null;
  }

  const [asTeam1Snap, asTeam2Snap] = await Promise.all([
    admin
      .firestore()
      .collection(MATCHES_COLLECTION)
      .where('team1Id', '==', teamId)
      .get(),
    admin
      .firestore()
      .collection(MATCHES_COLLECTION)
      .where('team2Id', '==', teamId)
      .get(),
  ]);

  const matches = [...asTeam1Snap.docs, ...asTeam2Snap.docs]
    .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }))
    .filter((match) => ['completed', 'simulated'].includes(match.status));

  matches.sort((a, b) => {
    const timeA = (toDateValue(a.completedAt) || toDateValue(a.updatedAt) || toDateValue(a.createdAt) || new Date(0)).getTime();
    const timeB = (toDateValue(b.completedAt) || toDateValue(b.updatedAt) || toDateValue(b.createdAt) || new Date(0)).getTime();
    return timeA - timeB;
  });

  const opponents = await fetchTeamsMap(
    matches.map((match) => (match.team1Id === teamId ? match.team2Id : match.team1Id)),
  );

  const teamMeta = deriveTeamMeta(teamDoc);
  const { trend: goalTrend, summary } = buildGoalTrend(matches, teamId, opponents);
  const ratingTrend = buildRatingTrend(matches, teamMeta);
  const performance = buildPerformance(matches);

  const totalMatches = matches.length;
  const winRateData = [
    { name: 'Wins', value: summary.wins },
    { name: 'Draws', value: summary.draws },
    { name: 'Losses', value: summary.losses },
  ];

  return {
    team: teamMeta,
    matches,
    performance,
    summary: {
      ...summary,
      matchesPlayed: totalMatches,
      goalDifference: summary.goalsFor - summary.goalsAgainst,
      winPercentage: totalMatches ? Number(((summary.wins / totalMatches) * 100).toFixed(1)) : 0,
    },
    trends: {
      goals: goalTrend,
      rating: ratingTrend,
      winRate: winRateData,
    },
  };
}
