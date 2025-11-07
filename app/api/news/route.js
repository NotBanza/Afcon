// app/api/news/route.js
import { NextResponse } from 'next/server';
import admin from '@/lib/firebase-admin';

function toMillis(value) {
  if (!value) {
    return null;
  }

  if (typeof value.toMillis === 'function') {
    return value.toMillis();
  }

  if (typeof value.toDate === 'function') {
    return value.toDate().getTime();
  }

  const seconds = typeof value.seconds === 'number' ? value.seconds : value._seconds;
  const nanoseconds = typeof value.nanoseconds === 'number' ? value.nanoseconds : value._nanoseconds;

  if (typeof seconds === 'number') {
    const millis = seconds * 1000;
    const nanoPortion = typeof nanoseconds === 'number' ? Math.floor(nanoseconds / 1e6) : 0;
    return millis + nanoPortion;
  }

  if (value instanceof Date) {
    return value.getTime();
  }

  if (typeof value === 'number') {
    return value;
  }

  return null;
}

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const limitParam = Number.parseInt(url.searchParams.get('limit') || '20', 10);
    const limit = Number.isFinite(limitParam) ? Math.min(Math.max(limitParam, 1), 100) : 20;

    const snapshot = await admin
      .firestore()
      .collection('news')
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();

    const articles = snapshot.docs.map((docSnap) => {
      const raw = docSnap.data() || {};
      const { createdAt, ...rest } = raw;
      const createdAtMs = toMillis(createdAt);

      return {
        id: docSnap.id,
        ...rest,
        createdAtMs,
        createdAtIso: createdAtMs ? new Date(createdAtMs).toISOString() : null,
      };
    });

    return NextResponse.json({ articles });
  } catch (error) {
    console.error('News fetch error:', error);
    return NextResponse.json({ error: 'Unable to load news.' }, { status: 500 });
  }
}
