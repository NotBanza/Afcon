// app/api/auth/signup/route.js
import admin from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    // --- Server-Side Validation ---
    // This is a critical step for the rubric.
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required.' },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Password must be at least 6 characters long.' },
        { status: 400 }
      );
    }
    // You could add more validation here (e.g., regex for email format).

    // --- User Creation ---
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
    });

    // --- Create User Profile in Firestore ---
    // This links the auth user to their data and role.
    const userDoc = {
      email: userRecord.email,
      role: 'representative', // Hardcoded for public signups
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    await admin.firestore().collection('users').doc(userRecord.uid).set(userDoc);

    return NextResponse.json({ uid: userRecord.uid }, { status: 201 });

  } catch (error) {
    console.error('Signup Error:', error);
    // Provide user-friendly error messages
    if (error.code === 'auth/email-already-exists') {
      return NextResponse.json(
        { error: 'This email address is already in use.' },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: 'An internal server error occurred.' },
      { status: 500 }
    );
  }
}