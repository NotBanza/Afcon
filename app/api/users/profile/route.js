// app/api/users/profile/route.js
import admin from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

const withError = (message, status = 400) =>
  NextResponse.json({ error: message }, { status });

function extractToken(request) {
  const authHeader = request.headers.get('authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.slice(7);
}

async function verifyRequest(request) {
  const token = extractToken(request);
  if (!token) {
    throw withError('Missing authorization token.', 401);
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error('Profile auth error:', error);
    throw withError('Invalid or expired session. Please sign in again.', 401);
  }
}

export async function GET(request) {
  try {
    const decodedToken = await verifyRequest(request);
    const usersCollection = admin.firestore().collection('users');
    const userRef = usersCollection.doc(decodedToken.uid);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      const defaultProfile = {
        email: decodedToken.email || null,
        role: 'representative',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        lastSeenAt: admin.firestore.FieldValue.serverTimestamp(),
      };
      await userRef.set(defaultProfile);
      return NextResponse.json({
        uid: decodedToken.uid,
        email: decodedToken.email || null,
        role: 'representative',
      });
    }

    const data = userDoc.data();
    await userRef.update({
      lastSeenAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return NextResponse.json({
      uid: decodedToken.uid,
      email: data.email || decodedToken.email || null,
      role: data.role || 'representative',
      displayName: data.displayName || null,
    });
  } catch (error) {
    if (error instanceof NextResponse || error instanceof Response) {
      return error;
    }
    console.error('Profile lookup error:', error);
    return withError('Internal server error', 500);
  }
}
