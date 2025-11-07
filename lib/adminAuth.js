// lib/adminAuth.js
// Shared helper to ensure API requests are performed by administrators only.

import admin from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

export async function assertAdmin(request) {
  const authHeader = request.headers.get('authorization') || '';
  const token = authHeader.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null;

  if (!token) {
    throw NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let decodedToken;
  try {
    decodedToken = await admin.auth().verifyIdToken(token);
  } catch (error) {
    console.error('Admin assertion error:', error);
    throw NextResponse.json({ error: 'Invalid or expired session.' }, { status: 401 });
  }

  const userDoc = await admin.firestore().collection('users').doc(decodedToken.uid).get();
  if (!userDoc.exists || userDoc.data().role !== 'administrator') {
    throw NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 });
  }

  return { decodedToken, userDoc };
}
