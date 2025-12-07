// pages/api/geminiText.js
import { verifyUser } from "./auth.js";

export default async function handler(req, res) {
  try {
    const { idToken, history = [], dbWords = [], user = null } = req.body;
    const decodedToken = await verifyUser(idToken);

    const apiKey = process.env.API_KEY_TEXT;

    // ✅ プロンプト生成
    const recentHistory = history.slice(-5).join("\n");
    const latestMessage = history.length > 0 ? history[history.length - 1] : "";

    const dictionaryText = dbWords
      .map(w => `${w.word}(${w.wordRuby || ""})`)
      .join(", ");

    const userText = user
      ? `ユーザー名: ${user.lastName}${user.firstName} (${user.lastNameRuby || ""} ${user.firstNameRuby || ""})`
      : "";
    const userTextSection = userText ? `ユーザー情報:\n${userText}\n` : "";

    const finalPrompt = `
    以下は会話の履歴と保存済みの専門用語です。
    最後のメッセージに対して、自然で適切な返答を3つ提案してください。
    可能であれば保存済み用語を活用してください。
    
    会話履歴（直近5件）:
    ${recentHistory}
    
    保存済み用語:
    ${dictionaryText}
    
    ${userTextSection}最後のメッセージ: 「${latestMessage}」
    
    返答の提案:
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
    console.error("Gemini Text API呼び出し失敗:", error);
    res.status(500).json({ error: error.message });
  }
}
