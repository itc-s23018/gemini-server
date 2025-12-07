// pages/api/geminiVoice.js
import { verifyUser } from "./auth.js";

export default async function handler(req, res) {
  try {
    const { idToken, prompt, history = [], dbWords = [], user = null } = req.body;
    const decodedToken = await verifyUser(idToken);

    const apiKey = process.env.API_KEY_VOICE;

    // ✅ プロンプト生成をここに直接書く
    const recentHistory = history.slice(-5).join("\n");
    const dictionaryText = dbWords
      .map(w => `${w.word}(${w.wordRuby || ""})`)
      .join(", ");
    const userText = user
      ? `ユーザー名: ${user.lastName}${user.firstName} (${user.lastNameRuby || ""} ${user.firstNameRuby || ""})`
      : "";
    const userTextSection = userText ? `ユーザー情報:\n${userText}\n` : "";

    const finalPrompt = `
    あなたのタスクは「最新の入力の文」を自然な日本語に補正することです。
    これまでの直近の会話履歴、マイ辞書、ユーザーの名前情報を参考にして、
    会話の流れに沿った自然な文になるようにしてください。
    補正対象は必ず最新の入力のみです。
    
    会話履歴（直近5件）:
    ${recentHistory}
    
    マイ辞書:
    ${dictionaryText}
    
    ${userTextSection}最新の入力: 「${prompt}」
    
    補正後の文:
    `.trim();

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: finalPrompt }] }] }),
      }
    );

    const data = await response.json();
    res.status(response.ok ? 200 : response.status).json({ uid: decodedToken.uid, data });
  } catch (error) {
    console.error("Gemini Voice API呼び出し失敗:", error);
    res.status(500).json({ error: error.message });
  }
}
