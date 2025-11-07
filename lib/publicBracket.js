import admin from '@/lib/firebase-admin';
import { BRACKET_ROUNDS } from '@/lib/seeding';
import { hydrateTeam, mapTeamSnapshot } from '@/lib/teamUtils';
import { evaluateTimelineAvailability } from '@/lib/matchTimeline';

const ROUND_PRIORITY = {
  [BRACKET_ROUNDS.QUARTER]: 1,
  [BRACKET_ROUNDS.SEMI]: 2,
  [BRACKET_ROUNDS.FINAL]: 3,
};

function serializeTimestamp(value) {
  if (!value) {
    return null;
  }

  if (typeof value.toMillis === 'function') {
    return value.toMillis();
  }

  if (typeof value.toDate === 'function') {
    return value.toDate().getTime();
  }

  const seconds = typeof value.seconds === 'number' ? value.seconds : value._seconds;
  const nanos = typeof value.nanoseconds === 'number' ? value.nanoseconds : value._nanoseconds;

  if (typeof seconds === 'number') {
    const millisecondPortion = seconds * 1000;
    const nanoPortion = typeof nanos === 'number' ? Math.floor(nanos / 1e6) : 0;
    return millisecondPortion + nanoPortion;
  }

  return value;
}

function sanitizeForClient(value) {
  if (value === null || value === undefined) {
    return value;
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeForClient(entry));
  }

  if (typeof value === 'object') {
    if (
      typeof value.toMillis === 'function' ||
      typeof value.toDate === 'function' ||
      typeof value.seconds === 'number' ||
      typeof value._seconds === 'number'
    ) {
      return serializeTimestamp(value);
    }

    if (value instanceof Map) {
      const obj = {};
      value.forEach((mapValue, mapKey) => {
        obj[mapKey] = sanitizeForClient(mapValue);
      });
      return obj;
    }

    const plain = {};
    Object.entries(value).forEach(([key, entry]) => {
      plain[key] = sanitizeForClient(entry);
    });
    return plain;
  }

  return value;
}

function groupMatches(matches) {
  const grouped = {
    quarter: [],
    semi: [],
    final: [],
  };

  matches.forEach((match) => {
    if (match.round === BRACKET_ROUNDS.QUARTER) {
      grouped.quarter.push(match);
    } else if (match.round === BRACKET_ROUNDS.SEMI) {
      grouped.semi.push(match);
    } else if (match.round === BRACKET_ROUNDS.FINAL) {
      grouped.final.push(match);
    }
  });

  const sortBySlot = (a, b) => (a.slot || 0) - (b.slot || 0);
  grouped.quarter.sort(sortBySlot);
  grouped.semi.sort(sortBySlot);
  grouped.final.sort(sortBySlot);

  return grouped;
}

async function fetchTeams(identifiers) {
  const ids = Array.from(new Set(identifiers.filter(Boolean)));
  if (!ids.length) {
    return new Map();
  }

  const db = admin.firestore();
  const teamsCollection = db.collection('teams');
  const teamsMap = new Map();
  const chunkSize = 10;

  for (let index = 0; index < ids.length; index += chunkSize) {
    const chunk = ids.slice(index, index + chunkSize);
    const snapshot = await teamsCollection.where(admin.firestore.FieldPath.documentId(), 'in', chunk).get();
    snapshot.forEach((docSnap) => {
      teamsMap.set(docSnap.id, mapTeamSnapshot(docSnap));
    });
  }

  return teamsMap;
}

function decorateMatches(rawMatches, teamsMap) {
  return rawMatches
    .map((match) => ({
      ...match,
      team1: hydrateTeam(teamsMap, match.team1Id),
      team2: hydrateTeam(teamsMap, match.team2Id),
      roundPriority: ROUND_PRIORITY[match.round] || 99,
      timelineType: evaluateTimelineAvailability(match),
    }))
    .sort((a, b) => {
      if (a.roundPriority !== b.roundPriority) {
        return a.roundPriority - b.roundPriority;
      }
      const createdA = typeof a.createdAt?.toMillis === 'function'
        ? a.createdAt.toMillis()
        : typeof a.createdAt?.seconds === 'number'
          ? a.createdAt.seconds * 1000
          : 0;
      const createdB = typeof b.createdAt?.toMillis === 'function'
        ? b.createdAt.toMillis()
        : typeof b.createdAt?.seconds === 'number'
          ? b.createdAt.seconds * 1000
          : 0;
      if (createdA !== createdB) {
        return createdA - createdB;
      }
      return (a.slot || 0) - (b.slot || 0);
    });
}

export async function fetchPublicBracket() {
  const db = admin.firestore();

  const [matchesSnapshot, teamsCountAgg] = await Promise.all([
    db.collection('matches').get(),
    db.collection('teams').count ? db.collection('teams').count().get() : null,
  ]);

  const rawMatches = matchesSnapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));
  const teamIds = rawMatches.flatMap((match) => [match.team1Id, match.team2Id]).filter(Boolean);
  const teamsMap = await fetchTeams(teamIds);
  const matches = decorateMatches(rawMatches, teamsMap);
  const matchesForClient = matches.map((match) => sanitizeForClient(match));

  const grouped = groupMatches(matchesForClient);
  const finalMatch = grouped.final[0] || null;
  const champion = finalMatch && finalMatch.status === 'completed' && finalMatch.winnerId
    ? sanitizeForClient(hydrateTeam(teamsMap, finalMatch.winnerId))
    : null;

  let teamCount = 0;
  if (teamsCountAgg) {
    teamCount = teamsCountAgg.data().count || 0;
  } else {
    const teamsSnapshot = await db.collection('teams').select().get();
    teamCount = teamsSnapshot.size;
  }

  return {
    quarter: grouped.quarter,
    semi: grouped.semi,
    final: grouped.final,
    seeded: matchesForClient.length > 0,
    champion,
    teamCount,
    matches: matchesForClient,
  };
}
