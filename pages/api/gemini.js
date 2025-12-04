import admin from "firebase-admin";

// Firebase Admin 初期化
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
    // FirebaseAuth トークンをヘッダーから取得
    const idToken = req.headers.authorization?.split("Bearer ")[1];
    if (!idToken) {
      return res.status(401).json({ error: "ログインが必要です" });
    }

    // トークン検証
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log("ログインユーザー:", decodedToken.uid);

    // Gemini API 呼び出し
    const response = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.GEMINI_API_KEY}`
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: req.body.prompt }] }]
        })
      }
    );

    const data = await response.json();
    res.status(200).json(data);

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

