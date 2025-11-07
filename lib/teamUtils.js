export const DEFAULT_TEAM = {
  id: null,
  name: 'To Be Determined',
  shortName: 'TBD',
  flag: null,
  rating: 0,
  managerName: '',
  countryName: '',
};

export function mapTeamSnapshot(docSnap) {
  if (!docSnap) {
    return { ...DEFAULT_TEAM };
  }

  const data = typeof docSnap.data === 'function' ? docSnap.data() : docSnap;
  if (!data) {
    return { ...DEFAULT_TEAM, id: docSnap.id || null };
  }

  const rawCountry = data.country;

  let countryName = '';
  let countryCode = '';
  let countryFlag = null;

  if (typeof rawCountry === 'string') {
    countryName = rawCountry;
  } else if (rawCountry && typeof rawCountry === 'object') {
    countryName = rawCountry.name || rawCountry.country || '';
    countryCode = rawCountry.code || rawCountry.iso || rawCountry.abbr || '';
    countryFlag = rawCountry.flag || rawCountry.flagUrl || null;
  }

  const ratingValue = typeof data.rating === 'number' ? data.rating : data.averageRating || 0;
  const resolvedName = data.federationName || data.countryName || countryName || data.displayName || 'Unnamed Federation';
  const shortCandidate = data.shortName || countryCode || resolvedName.slice(0, 3);
  const resolvedShort = shortCandidate ? shortCandidate.toUpperCase() : 'TBD';

  return {
    id: docSnap.id || data.id || null,
    name: resolvedName,
    shortName: resolvedShort,
    flag: data.flag || countryFlag || null,
    rating: Math.round(ratingValue),
    managerName: data.managerName || '',
    countryName: countryName || resolvedName,
    contactEmail: data.contactEmail || null,
    raw: data,
  };
}

export function hydrateTeam(teamsMap, teamId) {
  if (!teamId) {
    return { ...DEFAULT_TEAM };
  }

  if (teamsMap instanceof Map && teamsMap.has(teamId)) {
    return teamsMap.get(teamId);
  }

  if (Array.isArray(teamsMap)) {
    const match = teamsMap.find((team) => team.id === teamId);
    if (match) {
      return match;
    }
  }

  return { ...DEFAULT_TEAM, id: teamId };
}
