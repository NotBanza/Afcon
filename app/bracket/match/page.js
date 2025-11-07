import { notFound } from 'next/navigation';
import MatchDetails from '@/components/match/MatchDetails';
import admin from '@/lib/firebase-admin';
import { mapTeamSnapshot } from '@/lib/teamUtils';

async function getMatchDetails(matchId) {
  if (!matchId) {
    return null;
  }

  const db = admin.firestore();
  const matchDoc = await db.collection('matches').doc(matchId).get();

  if (!matchDoc.exists) {
    return null;
  }

  const matchData = matchDoc.data();
  const teamIds = [matchData.team1Id, matchData.team2Id].filter(Boolean);
  const teamsMap = new Map();

  await Promise.all(
    teamIds.map(async (teamId) => {
      const teamDoc = await db.collection('teams').doc(teamId).get();
      if (teamDoc.exists) {
        teamsMap.set(teamId, mapTeamSnapshot(teamDoc));
      }
    }),
  );

  const fallbackTeam = (teamId) => mapTeamSnapshot({ id: teamId || null, data: () => ({}) });

  return {
    id: matchDoc.id,
    ...matchData,
    score: matchData.score || { team1: null, team2: null },
    commentary: matchData.commentary || '',
    goalscorers: Array.isArray(matchData.goalscorers) ? matchData.goalscorers : [],
    team1: teamsMap.get(matchData.team1Id) || fallbackTeam(matchData.team1Id),
    team2: teamsMap.get(matchData.team2Id) || fallbackTeam(matchData.team2Id),
  };
}

export default async function MatchPage({ searchParams }) {
  const matchId = searchParams?.id;
  const match = await getMatchDetails(matchId);

  if (!match) {
    notFound();
  }

  return <MatchDetails match={match} />;
}
