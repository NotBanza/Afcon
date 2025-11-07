import {
  collection,
  doc,
  getCountFromServer,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  where,
  writeBatch,
} from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { BRACKET_ROUNDS, buildMatchGraph, sortTeamsByRating } from '@/lib/seeding';
import { hydrateTeam, mapTeamSnapshot } from '@/lib/teamUtils';

const MATCHES_COLLECTION = 'matches';
const TEAMS_COLLECTION = 'teams';

const ROUND_PRIORITY = {
  [BRACKET_ROUNDS.QUARTER]: 1,
  [BRACKET_ROUNDS.SEMI]: 2,
  [BRACKET_ROUNDS.FINAL]: 3,
};

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

async function fetchTeamsByIds(teamIds) {
  if (!teamIds.length) {
    return new Map();
  }

  const uniqueIds = Array.from(new Set(teamIds.filter(Boolean)));
  const teamsMap = new Map();

  const chunkSize = 10;
  for (let index = 0; index < uniqueIds.length; index += chunkSize) {
    const chunk = uniqueIds.slice(index, index + chunkSize);
    const teamQuery = query(
      collection(db, TEAMS_COLLECTION),
      where('__name__', 'in', chunk),
    );
    try {
      const snapshot = await getDocs(teamQuery);
      snapshot.forEach((docSnap) => {
        teamsMap.set(docSnap.id, mapTeamSnapshot(docSnap));
      });
    } catch (err) {
      console.error('Failed to fetch team chunk:', err);
      throw err;
    }
  }

  return teamsMap;
}

export function listenToBracket(onUpdate, onError) {
  if (!db) {
    const error = new Error('Firestore client not initialised.');
    if (onError) {
      onError(error);
    }
    return () => {};
  }

  const matchesRef = collection(db, MATCHES_COLLECTION);

  const unsubscribe = onSnapshot(
    matchesRef,
    async (snapshot) => {
      try {
        const rawMatches = snapshot.docs.map((docSnap) => ({ id: docSnap.id, ...docSnap.data() }));

        const teamIds = rawMatches.flatMap((match) => [match.team1Id, match.team2Id]).filter(Boolean);
        const teamsMap = await fetchTeamsByIds(teamIds);

        const matches = rawMatches
          .map((match) => ({
            ...match,
            roundPriority: ROUND_PRIORITY[match.round] || 99,
            team1: hydrateTeam(teamsMap, match.team1Id),
            team2: hydrateTeam(teamsMap, match.team2Id),
          }))
          .sort((a, b) => {
            if (a.roundPriority !== b.roundPriority) {
              return a.roundPriority - b.roundPriority;
            }
            const createdA = a.createdAt?.toMillis?.() || 0;
            const createdB = b.createdAt?.toMillis?.() || 0;
            if (createdA !== createdB) {
              return createdA - createdB;
            }
            return (a.slot || 0) - (b.slot || 0);
          });

        const grouped = groupMatches(matches);

        const finalMatch = grouped.final[0] || null;
        const champion = finalMatch && finalMatch.status === 'completed' && finalMatch.winnerId
          ? hydrateTeam(teamsMap, finalMatch.winnerId)
          : null;

        let teamCount = 0;
        try {
          const teamCountSnap = await getCountFromServer(collection(db, TEAMS_COLLECTION));
          teamCount = teamCountSnap.data().count || 0;
        } catch (countError) {
          console.error('Failed to fetch team count:', countError);
          teamCount = matches.reduce((acc, match) => acc + (match.team1Id ? 1 : 0) + (match.team2Id ? 1 : 0), 0);
        }

        onUpdate({
          quarter: grouped.quarter,
          semi: grouped.semi,
          final: grouped.final,
          seeded: matches.length > 0,
          champion,
          teamCount,
          matches,
        });
      } catch (err) {
        console.error('Bracket listener processing error:', err);
        if (onError) {
          onError(err);
        }
      }
    },
    (err) => {
      console.error('Bracket listener error:', err);
      if (onError) {
        onError(err);
      }
    },
  );

  return unsubscribe;
}

export async function seedTournament(selectedTeamIds = []) {
  const matchesSnapshot = await getDocs(collection(db, MATCHES_COLLECTION));
  if (!matchesSnapshot.empty) {
    throw new Error('Tournament already seeded. Reset before seeding again.');
  }

  const useSpecificTeams = Array.isArray(selectedTeamIds) && selectedTeamIds.length > 0;
  let teams = [];

  if (useSpecificTeams) {
    const uniqueSelections = Array.from(new Set(selectedTeamIds));
    if (uniqueSelections.length !== 8) {
      throw new Error('Please select exactly 8 unique teams to seed.');
    }

    const teamsMap = await fetchTeamsByIds(uniqueSelections);
    const missing = uniqueSelections.filter((id) => !teamsMap.has(id));
    if (missing.length) {
      throw new Error('Some selected teams could not be found. Refresh the team list and try again.');
    }

    teams = uniqueSelections.map((id) => teamsMap.get(id));
  } else {
    const teamsSnapshot = await getDocs(collection(db, TEAMS_COLLECTION));
    teams = teamsSnapshot.docs.map(mapTeamSnapshot);
  }

  const ranked = sortTeamsByRating(teams).slice(0, 8);

  if (ranked.length < 8) {
    throw new Error('Need at least 8 registered teams to seed the tournament.');
  }

  const graph = buildMatchGraph(ranked);

  const matchesCollection = collection(db, MATCHES_COLLECTION);
  const batch = writeBatch(db);

  const finalRef = doc(matchesCollection);
  const semiRefs = [doc(matchesCollection), doc(matchesCollection)];
  const quarterRefs = [doc(matchesCollection), doc(matchesCollection), doc(matchesCollection), doc(matchesCollection)];

  const timestamp = serverTimestamp();

  batch.set(finalRef, {
    round: BRACKET_ROUNDS.FINAL,
    slot: 1,
    team1Id: null,
    team2Id: null,
    status: 'waiting',
    createdAt: timestamp,
    updatedAt: timestamp,
  });

  semiRefs.forEach((semiRef, index) => {
    batch.set(semiRef, {
      round: BRACKET_ROUNDS.SEMI,
      slot: index + 1,
      team1Id: null,
      team2Id: null,
      status: 'waiting',
      advancesToMatchId: finalRef.id,
      advancesToSlot: index + 1,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  });

  graph.quarterfinals.forEach((match, index) => {
    const targetSemi = index < 2 ? semiRefs[0] : semiRefs[1];
    const advancesToSlot = index % 2 === 0 ? 1 : 2;

    batch.set(quarterRefs[index], {
      round: BRACKET_ROUNDS.QUARTER,
      slot: index + 1,
      team1Id: match.team1Id,
      team2Id: match.team2Id,
      status: 'pending',
      advancesToMatchId: targetSemi.id,
      advancesToSlot,
      createdAt: timestamp,
      updatedAt: timestamp,
      seededAt: timestamp,
    });
  });

  await batch.commit();
}

export async function fetchRegisteredTeams() {
  const teamsSnapshot = await getDocs(collection(db, TEAMS_COLLECTION));
  const teams = teamsSnapshot.docs.map(mapTeamSnapshot);
  return sortTeamsByRating(teams);
}

export async function resetTournament() {
  const matchesSnapshot = await getDocs(collection(db, MATCHES_COLLECTION));
  if (matchesSnapshot.empty) {
    return;
  }
  const batch = writeBatch(db);
  matchesSnapshot.forEach((docSnap) => {
    batch.delete(docSnap.ref);
  });
  await batch.commit();
}

export async function simulateMatch(matchId, mode = 'quick') {
  const token = await auth.currentUser?.getIdToken();
  if (!token) {
    throw new Error('Authentication required.');
  }

  const response = await fetch('/api/matches/simulate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ matchId, mode }),
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    throw new Error(payload.error || 'Failed to simulate match.');
  }

  return response.json();
}
