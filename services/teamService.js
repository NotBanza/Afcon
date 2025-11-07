import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const TEAMS_COLLECTION = 'teams';

export async function createTeam(teamPayload) {
  if (!db) {
    throw new Error('Database not initialised');
  }

  const payload = {
    ...teamPayload,
    createdAt: serverTimestamp(),
  };

  const docRef = await addDoc(collection(db, TEAMS_COLLECTION), payload);
  return docRef.id;
}
