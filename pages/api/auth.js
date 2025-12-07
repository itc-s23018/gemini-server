// pages/api/auth.js
import admin from "firebase-admin";

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

export async function verifyUser(idToken) {
  if (!idToken) {
    throw new Error("idToken is required");
  }
  return await admin.auth().verifyIdToken(idToken);
}
