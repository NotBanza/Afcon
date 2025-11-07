const FIRST_NAMES = [
  'Kwame',
  'Thabo',
  'Youssef',
  'Ahmed',
  'Chinedu',
  'Musa',
  'Aziz',
  'Bongani',
  'Samuel',
  'Idrissa',
  'Karim',
  'Mohamed',
  'Joseph',
  'Sadio',
  'Hakim',
  'Sofiane',
  'Ibrahim',
  'Trevor',
  'Gift',
  'Kamaldeen',
];

const LAST_NAMES = [
  'Mensah',
  'Bennani',
  'Diallo',
  'Ndiaye',
  'Okafor',
  'Mahrez',
  'Elneny',
  'Aguerd',
  'Onyeka',
  'Zungu',
  'Sarr',
  'Abdul-Rahman',
  'Boateng',
  'El Haddad',
  'Mane',
  'Benrahma',
  'Tau',
  'Jallow',
  'Koulibaly',
  'El Shaarawy',
];

const POSITIONS = ['GK', 'DF', 'MD', 'AT'];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement(list) {
  return list[randomInt(0, list.length - 1)];
}

function generateRatings(naturalPosition) {
  const ratings = {};
  POSITIONS.forEach((pos) => {
    const isNatural = pos === naturalPosition;
    ratings[pos] = isNatural ? randomInt(50, 100) : randomInt(0, 50);
  });
  return ratings;
}

export function generateRandomPlayer() {
  const naturalPosition = randomElement(POSITIONS);
  const id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;

  return {
    id,
    name: `${randomElement(FIRST_NAMES)} ${randomElement(LAST_NAMES)}`,
    naturalPosition,
    ratings: generateRatings(naturalPosition),
    isCaptain: false,
  };
}

export function generateRandomSquad(size = 23) {
  const squad = [];
  while (squad.length < size) {
    squad.push(generateRandomPlayer());
  }
  return squad;
}

export const POSITION_OPTIONS = POSITIONS;
