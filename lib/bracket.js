// lib/bracket.js
// Utilities for creating, advancing, and resetting the tournament bracket.

import admin from '@/lib/firebase-admin';

export const ROUNDS = {
  QUARTER: 'Quarter-Final',
  SEMI: 'Semi-Final',
  FINAL: 'Final',
};

const MATCHES_COLLECTION = 'matches';
const ARCHIVE_COLLECTION = 'matches_archive';

const distribution = [
  { slot: 1, nextSlot: 1, nextMatchSlot: 1 },
  { slot: 2, nextSlot: 2, nextMatchSlot: 1 },
  { slot: 3, nextSlot: 1, nextMatchSlot: 2 },
  { slot: 4, nextSlot: 2, nextMatchSlot: 2 },
];

const timestamp = () => admin.firestore.FieldValue.serverTimestamp();

export async function startTournamentBracket() {
  const teamsSnapshot = await admin
    .firestore()
    .collection('teams')
    .orderBy('createdAt', 'asc')
    .limit(8)
    .get();

  if (teamsSnapshot.size < 8) {
    throw new Error('Need at least 8 teams to start the tournament.');
  }

  const matchesSnapshot = await admin.firestore().collection(MATCHES_COLLECTION).limit(1).get();
  if (!matchesSnapshot.empty) {
    throw new Error('Tournament already has active matches. Restart before starting again.');
  }

  const teams = teamsSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  const matchesCollection = admin.firestore().collection(MATCHES_COLLECTION);

  const semiFinalRefs = [matchesCollection.doc(), matchesCollection.doc()];
  const finalRef = matchesCollection.doc();

  const batch = admin.firestore().batch();

  semiFinalRefs.forEach((semiRef, index) => {
    batch.set(semiRef, {
      round: ROUNDS.SEMI,
      slot: index + 1,
      team1Id: null,
      team2Id: null,
      status: 'waiting',
      advancesToMatchId: finalRef.id,
      advancesToSlot: index + 1,
      createdAt: timestamp(),
      updatedAt: timestamp(),
    });
  });

  batch.set(finalRef, {
    round: ROUNDS.FINAL,
    slot: 1,
    team1Id: null,
    team2Id: null,
    status: 'waiting',
    createdAt: timestamp(),
    updatedAt: timestamp(),
  });

  distribution.forEach(({ slot, nextSlot, nextMatchSlot }) => {
    const team1 = teams[(slot - 1) * 2];
    const team2 = teams[(slot - 1) * 2 + 1];
    const quarterRef = matchesCollection.doc();

    batch.set(quarterRef, {
      round: ROUNDS.QUARTER,
      slot,
      team1Id: team1.id,
      team2Id: team2.id,
      status: 'pending',
      advancesToMatchId: semiFinalRefs[nextMatchSlot - 1].id,
      advancesToSlot: nextSlot,
      createdAt: timestamp(),
      updatedAt: timestamp(),
    });
  });

  await batch.commit();
}

export async function archiveAndResetTournament() {
  const matchesSnapshot = await admin.firestore().collection(MATCHES_COLLECTION).get();
  if (matchesSnapshot.empty) {
    return;
  }

  const archiveCollection = admin.firestore().collection(ARCHIVE_COLLECTION);
  const batch = admin.firestore().batch();
  const archivedAt = timestamp();

  matchesSnapshot.docs.forEach((doc) => {
    const archiveRef = archiveCollection.doc();
    batch.set(archiveRef, {
      originalMatchId: doc.id,
      archivedAt,
      ...doc.data(),
    });
    batch.delete(doc.ref);
  });

  await batch.commit();
}

export async function advanceWinner(matchData, winnerId) {
  if (!matchData?.advancesToMatchId || !winnerId) {
    return;
  }

  const nextRef = admin.firestore().collection(MATCHES_COLLECTION).doc(matchData.advancesToMatchId);
  const nextDoc = await nextRef.get();
  if (!nextDoc.exists) {
    return;
  }

  const slotField = matchData.advancesToSlot === 2 ? 'team2Id' : 'team1Id';

  const nextData = nextDoc.data();
  const newTeam1 = slotField === 'team1Id' ? winnerId : nextData.team1Id;
  const newTeam2 = slotField === 'team2Id' ? winnerId : nextData.team2Id;

  const updates = {
    [slotField]: winnerId,
    updatedAt: timestamp(),
    status: newTeam1 && newTeam2 ? 'pending' : 'waiting',
  };

  await nextRef.update(updates);
}
