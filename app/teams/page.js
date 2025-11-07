import admin from '@/lib/firebase-admin';
import TeamsDirectory from './TeamsDirectory';

const FLAG_API_BASE = 'https://restcountries.com/v3.1';
const FLAG_FETCH_OPTIONS = { next: { revalidate: 86400 } };
const flagCache = new Map();

function serializeTimestamp(value) {
  if (!value) {
    return null;
  }

  if (value instanceof admin.firestore.Timestamp) {
    return value.toDate().toISOString();
  }

  if (typeof value.toDate === 'function') {
    return value.toDate().toISOString();
  }

  return value;
}

function normalizeRatings(ratings = {}) {
  return Object.entries(ratings).reduce((acc, [key, val]) => {
    acc[key] = Number.isFinite(val) ? Number(val) : null;
    return acc;
  }, {});
}

function normalizePlayer(playerDoc) {
  const data = playerDoc.data() || {};
  const natural = data.naturalPosition || 'N/A';
  const ratings = normalizeRatings(data.ratings || {});

  return {
    id: playerDoc.id,
    name: data.name || 'Unnamed Player',
    naturalPosition: natural,
    isCaptain: Boolean(data.isCaptain),
    ratings,
    overall: Number.isFinite(data.overall) ? Number(data.overall) : null,
    squadIndex: Number.isFinite(data.squadIndex) ? Number(data.squadIndex) : null,
    createdAt: serializeTimestamp(data.createdAt),
    updatedAt: serializeTimestamp(data.updatedAt),
  };
}

function calculateTeamOverall(players) {
  if (!players.length) {
    return null;
  }

  let total = 0;
  let counted = 0;

  players.forEach((player) => {
    const rating = player.ratings?.[player.naturalPosition];
    if (Number.isFinite(rating)) {
      total += rating;
      counted += 1;
    }
  });

  if (!counted) {
    return null;
  }

  return Number((total / counted).toFixed(2));
}

function pickFirstTruthy(values = []) {
  for (const value of values) {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      if (trimmed.length) {
        return trimmed;
      }
    }
  }
  return null;
}

async function fetchFlagByName(name) {
  const key = `name:${name.toLowerCase()}`;
  if (flagCache.has(key)) {
    return flagCache.get(key);
  }

  try {
    const response = await fetch(`${FLAG_API_BASE}/name/${encodeURIComponent(name)}?fields=name,cca2,flags`, FLAG_FETCH_OPTIONS);
    if (!response.ok) {
      flagCache.set(key, null);
      return null;
    }
    const payload = await response.json();
    const match = Array.isArray(payload) ? payload.find((entry) => entry?.flags?.svg || entry?.flags?.png) : null;
    if (!match) {
      flagCache.set(key, null);
      return null;
    }
    const info = {
      url: match.flags?.svg || match.flags?.png || null,
      alt: match.flags?.alt || `${match.name?.common || name} flag`,
      code: match.cca2 || null,
    };
    flagCache.set(key, info);
    return info;
  } catch (error) {
    console.warn('Flag lookup by name failed:', error);
    flagCache.set(key, null);
    return null;
  }
}

async function fetchFlagByCode(code) {
  const normalized = code.toUpperCase();
  const key = `code:${normalized}`;
  if (flagCache.has(key)) {
    return flagCache.get(key);
  }

  try {
    const response = await fetch(`${FLAG_API_BASE}/alpha/${encodeURIComponent(normalized)}?fields=name,cca2,flags`, FLAG_FETCH_OPTIONS);
    if (!response.ok) {
      flagCache.set(key, null);
      return null;
    }
    const payload = await response.json();
    const match = Array.isArray(payload) ? payload[0] : payload;
    if (!match) {
      flagCache.set(key, null);
      return null;
    }
    const info = {
      url: match.flags?.svg || match.flags?.png || null,
      alt: match.flags?.alt || `${match.name?.common || normalized} flag`,
      code: match.cca2 || normalized,
    };
    flagCache.set(key, info);
    return info;
  } catch (error) {
    console.warn('Flag lookup by code failed:', error);
    flagCache.set(key, null);
    return null;
  }
}

async function resolveFlagForTeam(teamData) {
  if (!teamData) {
    return null;
  }

  const codeCandidates = [teamData.flagCode, teamData.countryCode, teamData.fifa, teamData.isoCode]
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .filter((value) => value.length >= 2 && value.length <= 3);

  for (const code of codeCandidates) {
    const info = await fetchFlagByCode(code);
    if (info?.url) {
      return info;
    }
  }

  const nameCandidates = [teamData.country, teamData.federationName, teamData.countryName, teamData.name]
    .map((value) => (typeof value === 'string' ? value.trim() : ''))
    .filter((value) => value.length > 0);

  for (const name of nameCandidates) {
    const info = await fetchFlagByName(name);
    if (info?.url) {
      return info;
    }
  }

  return null;
}

function normalizeTeam(teamDoc, data, players, flagInfo) {
  const plainPlayers = players.map(normalizePlayer).sort((a, b) => {
    if (a.squadIndex === null) return 1;
    if (b.squadIndex === null) return -1;
    return a.squadIndex - b.squadIndex;
  });

  const computedOverall = calculateTeamOverall(plainPlayers);
  const storedAverage = Number.isFinite(data.averageRating) ? Number(data.averageRating) : null;
  const overallRating = computedOverall ?? storedAverage;
  const fallbackFlag = pickFirstTruthy([data.flag, data.flagUrl, data.flagEmoji]);
  const flagAsset = flagInfo?.url || fallbackFlag || null;
  const flagCode = flagInfo?.code || pickFirstTruthy([data.flagCode, data.countryCode]);
  const flagAlt = flagInfo?.alt || (flagAsset ? `${data.country || data.federationName || data.name || 'Federation'} flag` : null);

  return {
    id: teamDoc.id,
    name: data.country || data.federationName || data.name || 'Federation',
    federationName: data.federationName || data.countryName || null,
    coachName: data.coachName || null,
    contactEmail: data.contactEmail || null,
    flag: flagAsset,
    flagAlt,
    flagCode,
    playersCount: Number.isFinite(data.playersCount) ? Number(data.playersCount) : plainPlayers.length,
    overallRating,
    averageRating: overallRating,
    createdAt: serializeTimestamp(data.createdAt),
    updatedAt: serializeTimestamp(data.updatedAt),
    ratingLastComputedAt: serializeTimestamp(data.ratingLastComputedAt),
    players: plainPlayers,
  };
}

async function fetchTeamsWithPlayers() {
  const teamsSnapshot = await admin.firestore().collection('teams').get();

  if (teamsSnapshot.empty) {
    return [];
  }

  const teams = await Promise.all(
    teamsSnapshot.docs.map(async (teamDoc) => {
      const teamData = teamDoc.data() || {};
      const [playersSnapshot, flagInfo] = await Promise.all([
        teamDoc.ref.collection('players').get(),
        resolveFlagForTeam(teamData),
      ]);
      return normalizeTeam(teamDoc, teamData, playersSnapshot.docs, flagInfo);
    })
  );

  return teams;
}

export default async function TeamsPage() {
  const teams = await fetchTeamsWithPlayers();
  return <TeamsDirectory teams={teams} />;
}
