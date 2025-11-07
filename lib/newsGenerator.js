import admin from '@/lib/firebase-admin';

const NEWS_COLLECTION = 'news';

const SUPPORTED_LANGUAGES = ['en', 'fr'];

const MATCH_HEADLINES = [
  (ctx) => `${ctx.winnerName} edge ${ctx.loserName} ${ctx.scoreline}`,
  (ctx) => `${ctx.loserName} stunned by resilient ${ctx.winnerName} ${ctx.scoreline}`,
  (ctx) => `${ctx.team1.name} vs ${ctx.team2.name}: ${ctx.scoreline} thriller lights up ANL`,
  (ctx) => `${ctx.team1.name} march past ${ctx.team2.name} in ${ctx.roundLabel}`,
  (ctx) => `${ctx.team2.name} fightback falls short as ${ctx.team1.name} celebrate ${ctx.roundLabel} win`,
  (ctx) => `${ctx.winnerName} ${ctx.roundLabel} joy after ${ctx.scoreline} victory`,
];

const PLAYER_QUOTES = [
  (ctx) => `${ctx.playerName} reflects: "We trusted the plan and ${ctx.playerTeamName} delivered when it mattered."`,
  (ctx) => `${ctx.playerName} on the win: "Every supporter of ${ctx.playerTeamName} gave us belief—tonight we repaid them."`,
  (ctx) => `${ctx.playerName} beams: "The dressing room is pure joy—${ctx.playerTeamName} fought for every blade of grass."`,
  (ctx) => `${ctx.playerName} smiles: "${ctx.playerTeamName} fans pushed us over the line tonight."`,
  (ctx) => `${ctx.playerName} admits: "It felt like destiny for ${ctx.playerTeamName} in ${ctx.roundLabel}."`,
  (ctx) => `${ctx.playerName} tells reporters: "${ctx.playerTeamName} showed what this crest stands for."`,
];

const FUN_FACTS = [
  (ctx) => `Possession battle: ${ctx.team1.name} held ${ctx.stats.possessionTeam1}% while ${ctx.team2.name} answered with ${ctx.stats.possessionTeam2}%.`,
  (ctx) => `${ctx.team1.name} produced ${ctx.stats.shotsTeam1} shots to ${ctx.team2.name}'s ${ctx.stats.shotsTeam2}. Efficiency proved decisive.`,
  (ctx) => `Discipline watch: Officials brandished ${ctx.stats.totalYellows} yellows and ${ctx.stats.totalReds} reds.`,
  (ctx) => `${ctx.winnerName} have now won ${ctx.winCount} match${ctx.winCount === 1 ? '' : 'es'} this tournament.`,
  (ctx) => `${ctx.playerName} now has ${ctx.playerGoalCount} goal${ctx.playerGoalCount === 1 ? '' : 's'} in knockout play.`,
  (ctx) => `Fans from ${ctx.winnerName} erupted as the shoot-out tipped ${ctx.shootoutSummary}.`,
];

const TAGS = {
  RECAP: 'Match',
  PLAYER: 'Player',
  FEDERATION: 'Federation',
};

function pickRandom(array) {
  if (!array.length) {
    return null;
  }
  const index = Math.floor(Math.random() * array.length);
  return array[index];
}

function formatScore(score) {
  if (!score) {
    return '0-0';
  }
  return `${score.team1}-${score.team2}`;
}

function normaliseStats(team1, team2, stats = {}, score = { team1: 0, team2: 0 }) {
  const safeStats = stats || {};
  const possessionTeam1 = safeStats.possession?.[team1.id] ?? safeStats.possession?.[team1.name] ?? 50;
  const possessionTeam2 = safeStats.possession?.[team2.id] ?? safeStats.possession?.[team2.name] ?? (100 - possessionTeam1);
  const shotsTeam1 = safeStats.shots?.[team1.id] ?? safeStats.shots?.[team1.name] ?? Math.max(5, score.team1 || 0);
  const shotsTeam2 = safeStats.shots?.[team2.id] ?? safeStats.shots?.[team2.name] ?? Math.max(4, score.team2 || 0);
  const yellowsTeam1 = safeStats.yellowCards?.[team1.id] ?? safeStats.yellowCards?.[team1.name] ?? 0;
  const yellowsTeam2 = safeStats.yellowCards?.[team2.id] ?? safeStats.yellowCards?.[team2.name] ?? 0;
  const redsTeam1 = safeStats.redCards?.[team1.id] ?? safeStats.redCards?.[team1.name] ?? 0;
  const redsTeam2 = safeStats.redCards?.[team2.id] ?? safeStats.redCards?.[team2.name] ?? 0;

  return {
    possessionTeam1,
    possessionTeam2,
    shotsTeam1,
    shotsTeam2,
    totalYellows: yellowsTeam1 + yellowsTeam2,
    totalReds: redsTeam1 + redsTeam2,
  };
}

function buildContext({ match, team1, team2, simulation, commentary }) {
  const scoreline = formatScore(simulation?.score || match?.score);
  const stats = normaliseStats(team1, team2, simulation?.stats || {}, simulation?.score || match?.score || {});
  const winnerId = simulation?.winnerId || match?.winnerId;
  const winnerName = winnerId === team2.id ? team2.name : team1.name;
  const loserName = winnerId === team2.id ? team1.name : team2.name;
  const roundLabel = match?.round || 'Knockout Round';

  const goalscorers = simulation?.goalscorers || match?.goalscorers || [];
  const playerGoalMap = goalscorers.reduce((map, goal) => {
    if (!goal?.scorerName) {
      return map;
    }
    map[goal.scorerName] = (map[goal.scorerName] || 0) + 1;
    return map;
  }, {});

  const topScorerName = Object.keys(playerGoalMap)[0] || team1.managerName || team2.managerName || winnerName;
  const topScorerTeam = goalscorers.find((goal) => goal.scorerName === topScorerName)?.teamId === team2.id
    ? team2.name
    : team1.name;

  const penalties = simulation?.penalties || match?.penalties;
  const shootoutSummary = penalties
    ? `${team1.name} ${penalties.team1} - ${penalties.team2} ${team2.name}`
    : 'their way';

  return {
    match,
    team1,
    team2,
    simulation,
    commentary,
    scoreline,
    stats,
    winnerName,
    loserName,
    roundLabel,
    playerName: topScorerName,
    playerTeamName: topScorerTeam,
    playerGoalCount: playerGoalMap[topScorerName] || 0,
  winCount: match?.status === 'completed' ? 1 : 1,
    shootoutSummary,
  };
}

function translateContent(base, language) {
  if (language === 'en') {
    return base;
  }

  if (language === 'fr') {
    return `FR: ${base}`;
  }

  return base;
}

export function composeNewsArticles({ match, team1, team2, simulation, commentary }) {
  const context = buildContext({ match, team1, team2, simulation, commentary });

  const leadingHeadline = pickRandom(MATCH_HEADLINES) || MATCH_HEADLINES[0];
  const baseHeadline = leadingHeadline(context);

  const quoteBuilder = pickRandom(PLAYER_QUOTES) || PLAYER_QUOTES[0];
  const baseQuote = quoteBuilder(context);

  const factBuilder = pickRandom(FUN_FACTS) || FUN_FACTS[0];
  const baseFact = factBuilder(context);

  const baseArticles = [
    {
      tag: TAGS.RECAP,
      title: baseHeadline,
      summary: `${team1.name} and ${team2.name} delivered a pulsating encounter ending ${context.scoreline}.`,
      body: `${baseHeadline}. ${commentary || 'The matchup kept fans on the edge of their seats from start to finish.'}`,
    },
    {
      tag: TAGS.PLAYER,
      title: `${context.playerName} steals the spotlight`,
      summary: baseQuote,
      body: `${baseQuote} ${context.playerName} has now become a fan favourite for ${context.playerTeamName}.`,
    },
    {
      tag: TAGS.FEDERATION,
      title: `${team1.name} vs ${team2.name}: By the numbers`,
      summary: baseFact,
      body: `${baseFact} Supporters are already debating what this means for the next round.`,
    },
  ];

  const enriched = [];

  baseArticles.forEach((article) => {
    SUPPORTED_LANGUAGES.forEach((language) => {
      enriched.push({
        ...article,
        language,
        title: translateContent(article.title, language),
        summary: translateContent(article.summary, language),
        body: translateContent(article.body, language),
      });
    });
  });

  return enriched;
}

export async function publishNewsArticles({ match, team1, team2, simulation, commentary }) {
  const articles = composeNewsArticles({ match, team1, team2, simulation, commentary });

  if (!articles.length) {
    return 0;
  }

  const batch = admin.firestore().batch();
  const collectionRef = admin.firestore().collection(NEWS_COLLECTION);
  const createdAt = admin.firestore.FieldValue.serverTimestamp();

  articles.forEach((article) => {
    const docRef = collectionRef.doc();
    batch.set(docRef, {
      matchId: match.id,
      matchRound: match.round,
      teams: [team1.id, team2.id],
      teamNames: [team1.name, team2.name],
      tag: article.tag,
      language: article.language,
      title: article.title,
      summary: article.summary,
      body: article.body,
      createdAt,
    });
  });

  await batch.commit();
  return articles.length;
}
