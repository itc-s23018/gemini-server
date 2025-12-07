// pages/api/geminiText.js
import { verifyUser } from "./auth.js";

export default async function handler(req, res) {
  try {
    const { idToken, history = [], dbWords = [] } = req.body;
    const decodedToken = await verifyUser(idToken);

    const apiKey = process.env.API_KEY_TEXT;

    // 直近5件の履歴をまとめる
    const recentHistory = history.slice(-5).join("\n");
    const latestMessage = history.length > 0 ? history[history.length - 1] : "";

    // 保存済み用語を文字列化
    const dictionaryText = dbWords
      .map(w => `${w.word}(${w.wordRuby || ""})`)
      .join(", ");

    // ✅ プロンプトは最小限の修正で「余計な説明禁止」「3行のみ」を強調
    const finalPrompt = `
    以下は会話の履歴と保存済みの専門用語です。
    最後のメッセージに対して、自然で適切な返答を3つ提案してください。
    可能であれば保存済み用語を活用してください。
    
    会話履歴（直近5件）:
    ${recentHistory}
    
    保存済み用語:
    ${dictionaryText}
    
    最後のメッセージ: 「${latestMessage}」
    
    返答の提案:
    - 出力はプレーンテキストのみ。Markdownや見出し、番号、箇条書き、前置き、説明は禁止。
    - ちょうど3行で出力。各行は1つの自然な返答文のみ。
    - 先頭に「返答1:」などのラベルは付けない。文だけを返す。
    `.trim();

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: finalPrompt }] }]
        }),
      }
    );

    const data = await response.json();
    res.status(response.ok ? 200 : response.status).json({
      uid: decodedToken.uid,
      data,
    });
  } catch (error) {
    console.error("Gemini Text API呼び出し失敗:", error);
    res.status(500).json({ error: error.message });
  }
}
