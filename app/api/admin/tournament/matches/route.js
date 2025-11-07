// app/api/admin/tournament/matches/route.js
import admin from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';
import { assertAdmin } from '@/lib/adminAuth';

const withError = (message, status = 400) =>
  NextResponse.json({ error: message }, { status });

export async function DELETE(request) {
  try {
    await assertAdmin(request);
    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids');

    if (!idsParam) {
      return withError('Missing match IDs.', 400);
    }

    const ids = idsParam.split(',').map((id) => id.trim()).filter(Boolean);
    if (!ids.length) {
      return withError('No valid match IDs provided.', 400);
    }

    const db = admin.firestore();
    const batch = db.batch();
    const matchesCollection = db.collection('matches');

    ids.forEach((id) => {
      const ref = matchesCollection.doc(id);
      batch.delete(ref);
    });

    await batch.commit();

    return NextResponse.json({
      message: 'Matches reset successfully.',
      deleted: ids,
    });
  } catch (error) {
    if (error instanceof NextResponse || error instanceof Response) {
      return error;
    }
    console.error('Reset matches error:', error);
    return withError('Internal server error', 500);
  }
}
