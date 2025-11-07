import admin from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';
import { assertAdmin } from '@/lib/adminAuth';
import { publishNewsArticles } from '@/lib/newsGenerator';

const MATCHES_COLLECTION = 'matches';
const TEAMS_COLLECTION = 'teams';
const NEWS_COLLECTION = 'news';

function mapTeamDoc(docSnap) {
  if (!docSnap.exists) {
    return { id: docSnap.id, name: 'Unknown Federation', managerName: 'Not listed' };
  }
  const data = docSnap.data() || {};
  const rawCountry = data.country;
  let resolvedName = data.federationName || data.countryName || data.displayName || data.name || 'Unknown Federation';
  let flag = data.flag || null;
  let shortName = data.shortName || null;

  if (typeof rawCountry === 'string') {
    resolvedName = resolvedName === 'Unknown Federation' ? rawCountry : resolvedName;
  } else if (rawCountry && typeof rawCountry === 'object') {
    resolvedName = resolvedName === 'Unknown Federation' ? rawCountry.name || rawCountry.country || resolvedName : resolvedName;
    flag = flag || rawCountry.flag || rawCountry.flagUrl || null;
    shortName = shortName || rawCountry.code || rawCountry.abbr || null;
  }

  return {
    id: docSnap.id,
    name: resolvedName,
    flag,
    shortName: (shortName || resolvedName.slice(0, 3)).toUpperCase(),
    managerName: data.managerName || 'Not listed',
  };
}

async function fetchTeam(teamId) {
  if (!teamId) {
    return { id: null, name: 'Awaiting Team', managerName: 'TBD' };
  }
  const docSnap = await admin.firestore().collection(TEAMS_COLLECTION).doc(teamId).get();
  return mapTeamDoc(docSnap);
}

function buildSimulationFromMatch(match) {
  return {
    score: match.score || { team1: 0, team2: 0 },
    goalscorers: Array.isArray(match.goalscorers) ? match.goalscorers : [],
    stats: match.stats || {},
    winnerId: match.winnerId || null,
    resolution: match.resolution || 'regular',
    penalties: match.penalties || null,
  };
}

async function hasExistingNews(matchId) {
  const snapshot = await admin
    .firestore()
    .collection(NEWS_COLLECTION)
    .where('matchId', '==', matchId)
    .limit(1)
    .get();

  return !snapshot.empty;
}

export async function POST(request) {
  try {
    await assertAdmin(request);
    const { matchIds } = await request.json().catch(() => ({ matchIds: null }));

    let matchesQuery = admin.firestore().collection(MATCHES_COLLECTION).where('status', 'in', ['completed', 'simulated']);
    if (Array.isArray(matchIds) && matchIds.length > 0) {
      matchesQuery = admin.firestore().collection(MATCHES_COLLECTION).where(admin.firestore.FieldPath.documentId(), 'in', matchIds.slice(0, 10));
    }

    const matchesSnapshot = await matchesQuery.get();
    if (matchesSnapshot.empty) {
      return NextResponse.json({ message: 'No matches found to backfill.', generated: 0 });
    }

    let generatedCount = 0;
    let skipped = 0;

    for (const docSnap of matchesSnapshot.docs) {
      const match = { id: docSnap.id, ...docSnap.data() };
      const alreadyHasNews = await hasExistingNews(match.id);
      if (alreadyHasNews) {
        skipped += 1;
        continue;
      }

      const [team1, team2] = await Promise.all([
        fetchTeam(match.team1Id),
        fetchTeam(match.team2Id),
      ]);

      await publishNewsArticles({ match, team1, team2, simulation: buildSimulationFromMatch(match), commentary: match.commentary });
      generatedCount += 1;
    }

    return NextResponse.json({ message: 'News backfill complete.', generated: generatedCount, skipped });
  } catch (error) {
    console.error('News backfill error:', error);
    if (error instanceof NextResponse) {
      return error;
    }
    return NextResponse.json({ error: 'Failed to backfill news.' }, { status: 500 });
  }
}
