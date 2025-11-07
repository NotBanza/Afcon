// lib/playerUtils.js
// Utility helpers shared between client and server for squad generation and ratings.

export const POSITIONS = ['GK', 'DF', 'MD', 'AT'];

const FIRST_NAMES = [
  'Ade', 'Kwame', 'Lebo', 'Ibrahim', 'Yao', 'Samuel', 'Kofi', 'Thabo', 'Said', 'Ahmed',
  'Chidi', 'Femi', 'Sipho', 'Tariq', 'Ansu', 'Didier', 'Youssef', 'Karim', 'Hakim', 'Ali'
];

const LAST_NAMES = [
  'Okoro', 'Traore', 'Diallo', 'Mensah', 'Moyo', 'Ndlovu', 'Abebe', 'Mahrez', 'Koulibaly', 'Etim',
  'Kamara', 'Ajayi', 'Bwalya', 'Abdi', 'Boakye', 'Dlamini', 'Ouedraogo', 'Onyango', 'Mabena', 'Amadou'
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateRatings(naturalPosition) {
  const ratings = {};
  POSITIONS.forEach((pos) => {
    if (pos === naturalPosition) {
      ratings[pos] = randomInt(50, 100);
    } else {
      ratings[pos] = randomInt(0, 50);
    }
  });
  return ratings;
}

export function calculatePlayerOverall(ratings) {
  const values = Object.values(ratings || {});
  if (values.length === 0) {
    return 0;
  }
  const total = values.reduce((sum, value) => sum + value, 0);
  return Number((total / values.length).toFixed(2));
}

export function calculateSquadAverage(players) {
  if (!players || players.length === 0) {
    return 0;
  }
  const total = players.reduce((sum, player) => sum + (player.overall || 0), 0);
  return Number((total / players.length).toFixed(2));
}

export function generateRandomName() {
  const first = FIRST_NAMES[randomInt(0, FIRST_NAMES.length - 1)];
  const last = LAST_NAMES[randomInt(0, LAST_NAMES.length - 1)];
  return `${first} ${last}`;
}

function generatePositionDistribution() {
  return [
    { count: 3, position: 'GK' },
    { count: 7, position: 'DF' },
    { count: 8, position: 'MD' },
    { count: 5, position: 'AT' },
  ];
}

export function autoGenerateSquad() {
  const squad = [];
  const distribution = generatePositionDistribution();
  distribution.forEach(({ count, position }) => {
    for (let i = 0; i < count; i++) {
      squad.push({
        name: generateRandomName(),
        naturalPosition: position,
        isCaptain: false,
      });
    }
  });

  if (squad.length > 0) {
    squad[0].isCaptain = true;
  }

  return squad.slice(0, 23);
}

export function sanitizePlayers(players = []) {
  return players
    .filter((player) => player && player.name && player.naturalPosition)
    .map((player) => ({
      name: player.name.trim(),
      naturalPosition: player.naturalPosition,
      isCaptain: Boolean(player.isCaptain),
    }));
}
