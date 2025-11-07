import admin from '@/lib/firebase-admin';
import { hydrateTeam, mapTeamSnapshot } from '@/lib/teamUtils';
import { buildKeyMoments, buildLocalCommentary, formatKeyMomentLines, parseCommentaryLines } from '@/lib/matchTimeline';

async function fetchTeamsByIds(teamIds = []) {
  const ids = Array.from(new Set(teamIds.filter(Boolean)));
  const teamsMap = new Map();

  if (!ids.length) {
    return teamsMap;
  }

  const db = admin.firestore();
  const teamsCollection = db.collection('teams');
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

function parseTimeline({ match, team1, team2 }) {
  const commentaryLines = parseCommentaryLines(match.commentary);
  const isStoryMode = match.commentaryType === 'ai-play' || match.status === 'played' || match.mode === 'play';
  const isSimulated = match.commentaryType === 'quick-sim' || match.status === 'simulated';
  const showPlayByPlay = isStoryMode && !isSimulated;

  if (!showPlayByPlay) {
    return {
      timeline: [],
      isSimulated,
      showPlayByPlay,
      summary: match.commentary || buildLocalCommentary(match, team1, team2),
    };
  }

  if (commentaryLines.length) {
    return {
      timeline: commentaryLines,
      isSimulated,
      showPlayByPlay,
      summary: match.commentary,
    };
  }

  const keyMoments = buildKeyMoments(match, team1, team2);
  const timelineLines = formatKeyMomentLines(keyMoments);
  const fallbackCommentary = buildLocalCommentary(match, team1, team2, keyMoments);

  return {
    timeline: timelineLines,
    isSimulated,
    showPlayByPlay,
    summary: fallbackCommentary,
  };
}

export async function fetchMatchWithTeams(matchId) {
  const db = admin.firestore();
  const matchDoc = await db.collection('matches').doc(matchId).get();

  if (!matchDoc.exists) {
    return null;
  }

  const matchData = { id: matchDoc.id, ...matchDoc.data() };
  const teamsMap = await fetchTeamsByIds([matchData.team1Id, matchData.team2Id]);
  const team1 = hydrateTeam(teamsMap, matchData.team1Id);
  const team2 = hydrateTeam(teamsMap, matchData.team2Id);

  const timeline = parseTimeline({ match: matchData, team1, team2 });

  return {
    match: matchData,
    team1,
    team2,
    timeline,
  };
}
