const DEFAULT_LABEL = 'Key moment';

export const formatMinuteLabel = (minute) => {
  if (minute === null || minute === undefined) {
    return DEFAULT_LABEL;
  }
  if (typeof minute === 'string') {
    return minute;
  }
  const value = Number(minute);
  if (Number.isNaN(value)) {
    return DEFAULT_LABEL;
  }
  return `${value}'`;
};

const computeScoreUntil = (goals = [], team1Id, team2Id, maxMinute = Infinity) => {
  let team1Goals = 0;
  let team2Goals = 0;

  goals.forEach((goal) => {
    const minute = Number.isFinite(goal?.minute) ? goal.minute : 0;
    if (minute <= maxMinute) {
      if (goal.teamId === team1Id) {
        team1Goals += 1;
      } else if (goal.teamId === team2Id) {
        team2Goals += 1;
      }
    }
  });

  return { team1: team1Goals, team2: team2Goals };
};

export const buildKeyMoments = (matchResult, team1, team2) => {
  const goals = Array.isArray(matchResult?.goalscorers)
    ? [...matchResult.goalscorers].sort((a, b) => {
        const minuteA = Number.isFinite(a?.minute) ? a.minute : 1000;
        const minuteB = Number.isFinite(b?.minute) ? b.minute : 1000;
        return minuteA - minuteB;
      })
    : [];

  const safeTeam1 = team1 || { name: 'Team 1', id: matchResult?.team1Id };
  const safeTeam2 = team2 || { name: 'Team 2', id: matchResult?.team2Id };

  const moments = [];
  moments.push({ label: "1'", description: `${safeTeam1.name} face ${safeTeam2.name} under the lights.` });

  const halfTimeScore = computeScoreUntil(goals, safeTeam1.id, safeTeam2.id, 45);
  const regulationScore = computeScoreUntil(goals, safeTeam1.id, safeTeam2.id, 90);

  let runningScore = { team1: 0, team2: 0 };
  let halfTimeLogged = false;
  let fullTimeLogged = false;

  goals.forEach((goal) => {
    const minute = Number.isFinite(goal?.minute) ? goal.minute : null;
    if (!halfTimeLogged && minute !== null && minute > 45) {
      moments.push({ label: 'HT', description: `Half-time: ${safeTeam1.name} ${halfTimeScore.team1}-${halfTimeScore.team2} ${safeTeam2.name}.` });
      halfTimeLogged = true;
    }
    if (!fullTimeLogged && minute !== null && minute > 90) {
      moments.push({ label: 'FT', description: `End of 90: ${safeTeam1.name} ${regulationScore.team1}-${regulationScore.team2} ${safeTeam2.name}.` });
      fullTimeLogged = true;
    }

    if (goal.teamId === safeTeam1.id) {
      runningScore.team1 += 1;
    } else if (goal.teamId === safeTeam2.id) {
      runningScore.team2 += 1;
    }

    const scorerName = goal.scorerName || 'Unnamed scorer';
    const teamName = goal.teamId === safeTeam1.id
      ? safeTeam1.name
      : goal.teamId === safeTeam2.id
        ? safeTeam2.name
        : 'Unknown side';
    const label = minute === null ? 'Goal' : `${minute}'`;
    const scoreline = `${runningScore.team1}-${runningScore.team2}`;
    moments.push({ label, description: `${scorerName} puts ${teamName} ${scoreline}.` });
  });

  if (!halfTimeLogged) {
    moments.push({ label: 'HT', description: `Half-time: ${safeTeam1.name} ${halfTimeScore.team1}-${halfTimeScore.team2} ${safeTeam2.name}.` });
  }

  if (!fullTimeLogged) {
    moments.push({ label: 'FT', description: `End of 90: ${safeTeam1.name} ${regulationScore.team1}-${regulationScore.team2} ${safeTeam2.name}.` });
  }

  const finalScore = matchResult?.score || { team1: runningScore.team1, team2: runningScore.team2 };

  if (matchResult?.resolution === 'extra-time') {
    moments.push({ label: 'AET', description: `After extra time: ${safeTeam1.name} ${finalScore.team1}-${finalScore.team2} ${safeTeam2.name}.` });
  }

  if (matchResult?.resolution === 'penalties') {
    const penalties = matchResult.penalties;
    const shootoutLine = penalties
      ? `${safeTeam1.name} ${penalties.team1}-${penalties.team2} ${safeTeam2.name}`
      : `${safeTeam1.name} edge it on penalties.`;
    moments.push({ label: 'Pens', description: `Decided on penalties: ${shootoutLine}` });
  }

  const winnerName = matchResult?.winnerId === safeTeam2.id ? safeTeam2.name : safeTeam1.name;
  const loserName = winnerName === safeTeam1.name ? safeTeam2.name : safeTeam1.name;
  const outcomeLabel = matchResult?.resolution === 'penalties' ? 'Result' : 'Full-time';
  moments.push({ label: outcomeLabel, description: `${winnerName} eliminate ${loserName} ${finalScore.team1}-${finalScore.team2}.` });

  return moments;
};

export const formatKeyMomentLines = (moments = []) =>
  (Array.isArray(moments) ? moments : [])
    .map((moment) => `${formatMinuteLabel(moment.label ?? moment.minute)} ${moment.description}`);

export function buildLocalCommentary(matchResult, team1, team2, keyMoments) {
  const timeline = formatKeyMomentLines(keyMoments || buildKeyMoments(matchResult, team1, team2));
  return timeline.join('\n');
}

export function parseCommentaryLines(commentary) {
  if (!commentary) {
    return [];
  }

  return commentary
    .split('\n')
    .map((line) => line.replace(/^[-•\s]+/, '').trim())
    .filter(Boolean);
}

export function evaluateTimelineAvailability(match) {
  if (!match) {
    return 'none';
  }

  if (match.commentaryType === 'ai-play' || match.mode === 'play' || match.status === 'played') {
    return 'play-by-play';
  }

  if (match.commentaryType === 'quick-sim' || match.status === 'simulated') {
    return 'simulated';
  }

  return 'summary';
}
