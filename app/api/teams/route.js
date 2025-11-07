// app/api/teams/route.js
import admin from '@/lib/firebase-admin';
import { NextResponse } from 'next/server';
import {
  POSITIONS,
  autoGenerateSquad,
  sanitizePlayers,
  generateRatings,
  calculatePlayerOverall,
  calculateSquadAverage,
} from '@/lib/playerUtils';

const withError = (message, status = 400) =>
  NextResponse.json({ error: message }, { status });

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  try {
    const authHeader = request.headers.get('authorization') || '';
    const token = authHeader.startsWith('Bearer ')
      ? authHeader.slice(7)
      : null;

    if (!token) {
      return withError('Missing authorization token.', 401);
    }

    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(token);
    } catch (error) {
      console.error('Team creation auth error:', error);
      return withError('Invalid or expired session. Please sign in again.', 401);
    }

    const body = await request.json();
    const country = body.country?.trim();
    const managerName = body.managerName?.trim();
    const autoFill = Boolean(body.autoFill);
  const contactEmail = body.contactEmail?.trim();

    if (!country) {
      return withError('Country is required.');
    }

    if (!contactEmail) {
      return withError('Federation contact email is required.');
    }

    if (!EMAIL_REGEX.test(contactEmail)) {
      return withError('Federation contact email must be valid.');
    }

    if (!managerName) {
      return withError('Manager name is required.');
    }

    let incomingPlayers = Array.isArray(body.players)
      ? sanitizePlayers(body.players)
      : [];

    if (autoFill || incomingPlayers.length === 0) {
      incomingPlayers = autoGenerateSquad();
    }

    if (incomingPlayers.length !== 23) {
      return withError('A squad must include exactly 23 players.');
    }

    incomingPlayers.forEach((player) => {
      if (!POSITIONS.includes(player.naturalPosition)) {
        throw new Error(`Invalid position for player ${player.name}`);
      }
    });

    const captainCount = incomingPlayers.filter((player) => player.isCaptain).length;
    if (captainCount === 0) {
      incomingPlayers[0].isCaptain = true;
    } else if (captainCount > 1) {
      let captainAssigned = false;
      incomingPlayers = incomingPlayers.map((player) => {
        if (player.isCaptain && !captainAssigned) {
          captainAssigned = true;
          return { ...player, isCaptain: true };
        }
        return { ...player, isCaptain: false };
      });
    }

    const teamsCollection = admin.firestore().collection('teams');

    const existingSnapshot = await teamsCollection
      .where('ownerId', '==', decodedToken.uid)
      .limit(1)
      .get();

    if (!existingSnapshot.empty) {
      return withError('You have already registered a team.', 409);
    }

    const enrichedPlayers = incomingPlayers.map((player, index) => {
      const ratings = generateRatings(player.naturalPosition);
      const overall = calculatePlayerOverall(ratings);
      return {
        index,
        name: player.name,
        naturalPosition: player.naturalPosition,
        isCaptain: player.isCaptain,
        ratings,
        overall,
      };
    });

    const averageRating = calculateSquadAverage(enrichedPlayers);

    const teamRef = teamsCollection.doc();
    const batch = admin.firestore().batch();

    batch.set(teamRef, {
      country,
      managerName,
  contactEmail,
      ownerId: decodedToken.uid,
      averageRating,
      playersCount: enrichedPlayers.length,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      ratingLastComputedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    enrichedPlayers.forEach((player) => {
      const playerRef = teamRef.collection('players').doc();
      batch.set(playerRef, {
        name: player.name,
        naturalPosition: player.naturalPosition,
        isCaptain: player.isCaptain,
        ratings: player.ratings,
        overall: player.overall,
        squadIndex: player.index,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();

    return NextResponse.json(
      {
        success: true,
        teamId: teamRef.id,
        averageRating,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Team creation error:', error);
    return withError('Internal server error. Please try again later.', 500);
  }
}
