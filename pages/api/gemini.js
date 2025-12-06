import admin from "firebase-admin";
import { buildVoicePrompt } from "../../app/lib/prompts/voice.js";
import { buildWordPrompt } from "../../app/lib/prompts/word.js";
import { buildTextPrompt } from "../../app/lib/prompts/text.js";

// Firebase Admin 初期化（1回だけ）
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

    // バリデーション
    if (!idToken) {
      return res.status(400).json({ error: "idToken is required" });
    }
    if (!prompt) {
      return res.status(400).json({ error: "prompt is required" });
    }

    // Firebase ID トークンを検証
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log("ログインユーザー:", decodedToken.uid);

    // APIキー選択
    let apiKey;
    switch (mode) {
      case "voice":
        apiKey = process.env.API_KEY_VOICE;
        break;
      case "word":
        apiKey = process.env.API_KEY_WORD;
        break;
      case "text":
      default:
        apiKey = process.env.API_KEY_TEXT;
    }

    // プロンプト生成
    let finalPrompt;
    if (mode === "voice") {
      finalPrompt = buildVoicePrompt(prompt, history, dbWords, user);
    } else if (mode === "word") {
      finalPrompt = buildWordPrompt(prompt);
    } else {
      // ✅ 履歴の最新5件だけを結合して渡す
      const recentHistory = history.slice(-5).join("\n");
      finalPrompt = buildTextPrompt(recentHistory);
    }

    // ✅ タイムアウト制御を追加
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000); // 30秒で中断

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: finalPrompt }] }]
        }),
        signal: controller.signal,
      }
    );

    clearTimeout(timeout);

    if (!response.ok) {
      const errData = await response.json();
      console.error("Gemini API error:", errData);
      return res.status(response.status).json(errData);
    }

    const data = await response.json();

    // 認証済みユーザー情報も返す
    res.status(200).json({ uid: decodedToken.uid, data });

  } catch (error) {
    console.error("Gemini API呼び出し失敗:", error);
    res.status(500).json({ error: error.message });
  }
}
