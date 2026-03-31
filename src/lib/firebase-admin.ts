
'use server';

import 'dotenv/config'; // Ensures .env variables are loaded
import admin from 'firebase-admin';

let app: admin.app.App;

if (!admin.apps.length) {
  try {
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
        throw new Error('One or more Firebase Admin SDK environment variables are not set.');
    }
    app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Replace \\n with \n to correctly parse the private key from environment variables
        privateKey: privateKey.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
} else {
  app = admin.app();
}

export const adminApp = app;
export const adminDb = app ? admin.firestore() : null;
