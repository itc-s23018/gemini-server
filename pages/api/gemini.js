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

    // クライアントから mode を受け取る
    const { prompt, mode } = req.body;

    // mode に応じて APIキーを切り替え
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

    // Gemini API 呼び出し
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
    res.status(500).json({ error: error.message });
  }
}

