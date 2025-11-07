// app/api/matches/simulate/route.js
import admin from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { buildTeamContext, simulateMatch } from '@/lib/matchEngine';
import {
  autoGenerateSquad,
  generateRatings,
  calculatePlayerOverall,
  calculateSquadAverage,
} from '@/lib/playerUtils';
import { advanceWinner } from '@/lib/bracket';
import { assertAdmin } from '@/lib/adminAuth';
import { publishNewsArticles } from '@/lib/newsGenerator';
import { sendMatchResultEmail } from '@/lib/emailService';
import { buildKeyMoments, formatKeyMomentLines, buildLocalCommentary } from '@/lib/matchTimeline';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

function calculateTeamRating(players = []) {
  if (!Array.isArray(players) || players.length === 0) {
    return 50;
  }

  let total = 0;
  let counted = 0;

  players.forEach((player) => {
    if (!player || !player.naturalPosition) {
      return;
    }

    const ratings = player.ratings || {};
    const positionRating = ratings[player.naturalPosition];

    if (typeof positionRating === 'number' && Number.isFinite(positionRating)) {
      total += positionRating;
      counted += 1;
    }
  });

  if (counted === 0) {
    return 50;
  }

  return Number((total / counted).toFixed(2));
}

async function rebuildSquad(teamRef, teamDoc) {
  const generatedEntries = [];
  const batch = admin.firestore().batch();

  autoGenerateSquad().forEach((player, index) => {
    const playerRef = teamRef.collection('players').doc();
    const ratings = generateRatings(player.naturalPosition);
    const overall = calculatePlayerOverall(ratings);

    const firestorePayload = {
      name: player.name,
      naturalPosition: player.naturalPosition,
      isCaptain: index === 0,
      ratings,
      overall,
      squadIndex: index,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    batch.set(playerRef, firestorePayload);
    generatedEntries.push({
      id: playerRef.id,
      name: firestorePayload.name,
      naturalPosition: firestorePayload.naturalPosition,
      isCaptain: firestorePayload.isCaptain,
      ratings,
      overall,
      squadIndex: index,
    });
  });

  const averageRating = calculateSquadAverage(generatedEntries);

  batch.update(teamRef, {
    averageRating,
    playersCount: generatedEntries.length,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    ratingLastComputedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  await batch.commit();

  return { players: generatedEntries, averageRating };
}

async function getTeamContext(teamId) {
  const teamRef = admin.firestore().collection('teams').doc(teamId);
  const [teamDoc, playersSnapshot] = await Promise.all([
    teamRef.get(),
    teamRef.collection('players').orderBy('squadIndex').get(),
  ]);

  if (!teamDoc.exists) {
    throw withError('Team not found.', 404);
  }

  let players = playersSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  let rebuiltAverage = null;

  if (!players.length) {
    const rebuilt = await rebuildSquad(teamRef, teamDoc);
    players = rebuilt.players;
    rebuiltAverage = rebuilt.averageRating;
  }

  const teamContext = buildTeamContext(teamDoc, players);
  const ratingFromNatural = calculateTeamRating(players);
  if (Number.isFinite(ratingFromNatural)) {
    teamContext.averageRating = ratingFromNatural;
  }
  if (rebuiltAverage !== null) {
    teamContext.averageRating = Number.isFinite(ratingFromNatural) ? ratingFromNatural : rebuiltAverage;
  }

  return teamContext;
}

async function generateCommentary(mode, matchResult, team1, team2, keyMoments) {
  const computedMoments = keyMoments || buildKeyMoments(matchResult, team1, team2);
  const timelineLines = formatKeyMomentLines(computedMoments);
  const fallbackCommentary = buildLocalCommentary(matchResult, team1, team2, computedMoments);

  if (mode !== 'play') {
    return fallbackCommentary;
  }

  if (!process.env.OPENAI_API_KEY) {
    return fallbackCommentary;
  }

  const topPlayers = (players = []) => players.slice(0, 6).map((player) => `${player.name} (${player.naturalPosition})`).join(', ');
  const team1Players = topPlayers(team1.players);
  const team2Players = topPlayers(team2.players);
  const scoreline = `${team1.name} ${matchResult.score.team1}-${matchResult.score.team2} ${team2.name}`;
  const penaltiesLine = matchResult.resolution === 'penalties' && matchResult.penalties
    ? `${team1.name} ${matchResult.penalties.team1}-${matchResult.penalties.team2} ${team2.name}`
    : 'No shoot-out';

  const systemMessage = {
    role: 'system',
    content: 'You are an African football commentator crafting concise match timelines. Write energetic bullet points in chronological order, focusing on goals, turning points, extra time, penalties, and the final result.',
  };

  const userMessage = {
    role: 'user',
    content: `African Nations League 2026 match commentary.
Fixture: ${team1.name} vs ${team2.name}.
Final score: ${scoreline}.
Resolution: ${matchResult.resolution}.
Penalty shoot-out: ${penaltiesLine}.
Key players ${team1.name}: ${team1Players || 'Not provided'}.
Key players ${team2.name}: ${team2Players || 'Not provided'}.
Use these raw key moments as factual anchors and do not invent new scorers:
${timelineLines.map((line) => `- ${line}`).join('\n')}
Produce 6-9 bullet points. Each must start with the minute label (e.g. "12'", "HT", "Pens"). The final line must clearly confirm who wins and how.`,
  };

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [systemMessage, userMessage],
      max_tokens: 320,
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content?.trim() || fallbackCommentary;
  } catch (error) {
    console.warn('OpenAI commentary error:', error);
    return fallbackCommentary || 'Commentary service unavailable — match decided without story mode summary.';
  }
}

const formatGoalscorers = (entries = []) =>
  entries
    .filter((entry) => entry && entry.scorerName)
    .map((entry) => ({
      minute: Number.isFinite(entry.minute) ? entry.minute : null,
      scorerName: entry.scorerName,
      teamId: entry.teamId || null,
      teamCountry: entry.teamCountry || null,
      teamName: entry.teamName || entry.teamCountry || null,
      playerId: entry.playerId || null,
      playerCountry: entry.playerCountry || entry.teamCountry || null,
    }));

const formatGoalForEmail = (goal, team1, team2) => {
  const minute = Number.isFinite(goal?.minute) ? `${goal.minute}'` : '—';
  const scorer = goal?.scorerName || 'Unnamed scorer';
  let teamLabel = goal?.teamName || null;
  if (!teamLabel) {
    if (goal?.teamId === team1.id) {
      teamLabel = team1.name;
    } else if (goal?.teamId === team2.id) {
      teamLabel = team2.name;
    }
  }
  return `${minute} ${scorer}${teamLabel ? ` (${teamLabel})` : ''}`;
};

async function advanceBracket(matchData, winnerId) {
  await advanceWinner(matchData, winnerId);
}

async function notifyFederations({ matchId, simulation, team1, team2, goalscorers, keyMomentLines, commentary }) {
  const recipients = new Map();
  if (team1.contactEmail) {
    recipients.set(team1.contactEmail, team1.name);
  }
  if (team2.contactEmail) {
    recipients.set(team2.contactEmail, team2.name);
  }

  if (!recipients.size) {
    return;
  }

  const finalScore = simulation.score || { team1: 0, team2: 0 };
  const winnerName = simulation.winnerId === team2.id ? team2.name : team1.name;
  const loserName = winnerName === team1.name ? team2.name : team1.name;

  let resolutionLine = `${winnerName} prevail over ${loserName}.`;
  if (simulation.resolution === 'penalties' && simulation.penalties) {
    resolutionLine = `${winnerName} win on penalties ${simulation.penalties.team1}-${simulation.penalties.team2}.`;
  } else if (simulation.resolution === 'extra-time') {
    resolutionLine = `${winnerName} win after extra time.`;
  }

  const goalsLine = goalscorers?.length
    ? `Goals: ${goalscorers.map((goal) => formatGoalForEmail(goal, team1, team2)).join(', ')}`
    : 'No goals from open play.';

  const summary = `${resolutionLine} ${goalsLine}`;
  const timeline = Array.isArray(keyMomentLines) && keyMomentLines.length
    ? keyMomentLines
    : commentary
        ?.split('\n')
        .map((line) => line.trim())
        .filter(Boolean);

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.PUBLIC_APP_URL || '';
  const newsLink = baseUrl ? `${baseUrl.replace(/\/$/, '')}/news?match=${matchId}` : null;
  for (const [email, federationName] of recipients.entries()) {
    try {
      const personalisedSummary = `${summary} ${winnerName === federationName ? 'Congratulations on the win!' : 'We will regroup and go again.'}`.trim();
      const result = await sendMatchResultEmail({
        recipientEmail: email,
        team1Name: team1.name,
        team2Name: team2.name,
        score: finalScore,
        summary: personalisedSummary,
        timeline,
        newsLink,
      });
      if (!result.delivered) {
        console.warn('Federation email delivery skipped or failed.', { email, reason: result.reason });
      }
    } catch (error) {
      console.error('Federation notification error:', { email, error });
    }
  }
}

export async function POST(request) {
  try {
    await assertAdmin(request);

    const body = await request.json();
    const matchId = body.matchId;
    const mode = body.mode === 'play' ? 'play' : 'quick';

    if (!matchId) {
      return withError('Match ID is required.');
    }

    const matchRef = admin.firestore().collection('matches').doc(matchId);
    const matchDoc = await matchRef.get();
    if (!matchDoc.exists) {
      return withError('Match not found.', 404);
    }

    const matchData = matchDoc.data();
    if (!matchData.team1Id || !matchData.team2Id) {
      return withError('Match does not have both teams assigned yet.', 400);
    }

    const [team1, team2] = await Promise.all([
      getTeamContext(matchData.team1Id),
      getTeamContext(matchData.team2Id),
    ]);

    const simulation = simulateMatch({ team1, team2 });
    const keyMoments = buildKeyMoments(simulation, team1, team2);
    const keyMomentLines = formatKeyMomentLines(keyMoments);

    const commentary = await generateCommentary(mode, simulation, team1, team2, keyMoments);

    const updatePayload = {
      status: 'completed',
      score: simulation.score,
      goalscorers: formatGoalscorers(simulation.goalscorers),
      winnerId: simulation.winnerId,
      resolution: simulation.resolution,
      penalties: simulation.penalties,
      commentary,
      commentaryType: mode === 'play' ? 'ai-play' : 'quick-sim',
      stats: simulation.stats || null,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      completedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await matchRef.update(updatePayload);

    await advanceBracket(matchData, simulation.winnerId);
    await notifyFederations({
      matchId,
      simulation,
      team1,
      team2,
      goalscorers: updatePayload.goalscorers,
      keyMomentLines,
      commentary,
    });

    try {
      await publishNewsArticles({ match: { id: matchId, ...matchData }, team1, team2, simulation, commentary });
    } catch (newsError) {
      console.error('News generation failed:', newsError);
    }

    return NextResponse.json({
      message: 'Match resolved',
      mode,
      score: simulation.score,
      winnerId: simulation.winnerId,
      resolution: simulation.resolution,
      stats: simulation.stats || null,
    });
  } catch (error) {
    if (error instanceof NextResponse) {
      return error;
    }
    if (error instanceof Response) {
      return error;
    }
    console.error('Simulation Error:', error);
    return withError('Internal server error', 500);
  }
}