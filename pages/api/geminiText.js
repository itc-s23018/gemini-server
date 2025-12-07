// pages/api/geminiText.js
import { verifyUser } from "./auth.js";

export default async function handler(req, res) {
  try {
    const { idToken, history = [], dbWords = [], user = null } = req.body;
    const decodedToken = await verifyUser(idToken);

    const apiKey = process.env.API_KEY_TEXT;

    const recentHistory = history.slice(-5).join("\n");
    const latestMessage = history.length > 0 ? history[history.length - 1] : "";
    const dictionaryText = dbWords.map(w => `${w.word}(${w.wordRuby || ""})`).join(", ");
    const userText = user
      ? `ユーザー名: ${user.lastName}${user.firstName} (${user.lastNameRuby || ""} ${user.firstNameRuby || ""})`
      : "";
    const userTextSection = userText ? `ユーザー情報:\n${userText}\n` : "";

    const finalPrompt = `
    あなたは日本語で返答候補を作るAIアシスタントです。
    出力仕様を必ず守ってください。
    
    [文脈]
    会話履歴（直近5件）:
    ${recentHistory}
    
    保存済み用語:
    ${dictionaryText}
    
    ${userTextSection}最後のメッセージ: 「${latestMessage}」

    [出力仕様]
    - プレーンテキストのみ。Markdown、見出し、番号、箇条書き、前置き、説明は一切禁止。
    - ちょうど3行で出力。各行は1つの自然な返答文のみ。
    - 丁寧で自然な日本語。必要なら保存済み用語を自然に含める。
    - 先頭の「返答1:」や「-」などは付けない。文だけ。
    
    
    [出力]
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
