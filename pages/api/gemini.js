import admin from "firebase-admin";
import { buildVoicePrompt } from "../../app/lib/prompts/voice.js";
import { buildWordPrompt } from "../../app/lib/prompts/word.js";
import { buildTextPrompt } from "../../app/lib/prompts/text.js";


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
    const { idToken, prompt, mode, history = [], dbWords = [], user = null } = req.body;

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

    let finalPrompt;
    if (mode === "voice") {
      finalPrompt = buildVoicePrompt(prompt, history, dbWords, user);
    } else if (mode === "word") {
      finalPrompt = buildWordPrompt(prompt);
    } else {
      finalPrompt = buildTextPrompt(prompt);
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: finalPrompt }] }]
        })
      }
    );

    const data = await response.json();
    res.status(200).json(data);

  } catch (error) {
    console.error("Gemini API呼び出し失敗:", error);
    res.status(500).json({ error: error.message });
  }
}
