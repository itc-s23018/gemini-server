// pages/api/geminiWord.js
import { verifyUser } from "./auth.js";

export default async function handler(req, res) {
  try {
    const { idToken, history = [] } = req.body;
    const decodedToken = await verifyUser(idToken);

    const apiKey = process.env.API_KEY_WORD;

    // ✅ プロンプト生成
    const recentHistory = history.slice(-5).join("\n");
    const finalPrompt = `
    以下は会話履歴です。この中から専門用語を抽出してください。
    出力は必ず JSON 配列形式のみで返してください。
    各要素は {"word": "用語", "wordRuby": "読み仮名"} の形にしてください。
    他の文字列や説明は返さないでください。
    
    会話履歴:
    ${recentHistory}
    
    専門用語リスト(JSON):
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
    console.error("Gemini Word API呼び出し失敗:", error);
    res.status(500).json({ error: error.message });
  }
}
