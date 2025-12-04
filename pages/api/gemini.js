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

export default async function handler(req, res) {
  try {
    const { idToken, prompt, mode } = req.body;

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log("ログインユーザー:", decodedToken.uid);

    let apiKey;
    switch (mode) {
      case "voice":
        apiKey = process.env.GEMINI_API_KEY_VOICE;
        break;
      case "word":
        apiKey = process.env.GEMINI_API_KEY_WORD;
        break;
      default:
        apiKey = process.env.GEMINI_API_KEY_TEXT;
    }

    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await response.json();
    res.status(200).json(data);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
}
