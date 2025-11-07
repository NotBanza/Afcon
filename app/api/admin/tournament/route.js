// app/api/admin/tournament/route.js
import admin from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';
import { assertAdmin } from '@/lib/adminAuth';
import { startTournamentBracket } from '@/lib/bracket';

const withError = (message, status = 400) =>
  NextResponse.json({ error: message }, { status });

const simplifyTeam = (doc) => {
  const data = doc.data();
  return {
    id: doc.id,
    country: data.country || 'Unknown',
    managerName: data.managerName || '',
    averageRating: data.averageRating || null,
    ownerId: data.ownerId || null,
    createdAt: data.createdAt || null,
  };
};

const enrichMatch = (doc, teamLookup) => {
  const data = doc.data();
  const team1 = data.team1Id ? teamLookup.get(data.team1Id) || null : null;
  const team2 = data.team2Id ? teamLookup.get(data.team2Id) || null : null;

  return {
    id: doc.id,
    round: data.round,
    slot: data.slot || null,
    status: data.status,
    team1Id: data.team1Id || null,
    team2Id: data.team2Id || null,
    team1,
    team2,
    score: data.score || null,
    winnerId: data.winnerId || null,
    commentary: data.commentary || null,
    commentaryType: data.commentaryType || null,
    penalties: data.penalties || null,
    resolution: data.resolution || null,
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
  };
};

async function fetchOverview() {
  const db = admin.firestore();
  const teamsSnapshot = await db.collection('teams').orderBy('createdAt', 'asc').get();
  const teams = teamsSnapshot.docs.map(simplifyTeam);

  const teamLookup = new Map(teams.map((team) => [team.id, team]));

  const matchesSnapshot = await db
    .collection('matches')
    .orderBy('createdAt', 'asc')
    .get();
  const matches = matchesSnapshot.docs.map((doc) => enrichMatch(doc, teamLookup));

  return {
    teams,
    matches,
    teamsCount: teams.length,
    matchesCount: matches.length,
  };
}

export async function GET(request) {
  try {
    await assertAdmin(request);

    const overview = await fetchOverview();
    return NextResponse.json(overview);
  } catch (error) {
    if (error instanceof NextResponse || error instanceof Response) {
      return error;
    }
    console.error('Tournament overview error:', error);
    return withError('Internal server error', 500);
  }
}

export async function POST(request) {
  try {
    await assertAdmin(request);

    const overview = await fetchOverview();
    if (overview.teamsCount < 8) {
      return withError('Need at least 8 registered teams to start the tournament.', 400);
    }

    if (overview.matchesCount > 0) {
      return withError('Tournament already started. Reset before seeding again.', 409);
    }

    await startTournamentBracket();

    const updatedOverview = await fetchOverview();
    return NextResponse.json({
      message: 'Tournament seeded successfully.',
      overview: updatedOverview,
    });
  } catch (error) {
    if (error instanceof NextResponse || error instanceof Response) {
      return error;
    }
    console.error('Tournament start error:', error);
    return withError('Internal server error', 500);
  }
}
