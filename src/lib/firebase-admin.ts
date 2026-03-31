import admin from 'firebase-admin';

let app: admin.app.App;

if (!admin.apps.length) {
  try {
    app = admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // Replace \\n with \n to correctly parse the private key from environment variables
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } catch (error) {
    console.error('Firebase admin initialization error', error);
    // You might want to handle this more gracefully
    // For now, we'll let it fail and the API routes will throw an error
  }
} else {
  app = admin.app();
}

export const adminApp = app;
export const adminDb = admin.firestore();
