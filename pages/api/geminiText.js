import admin from "firebase-admin";

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

/**
 * プロンプト生成（返答提案用）
 */
function buildTextPrompt(messages = [], savedWords = [], categories = []) {
  if (!messages || messages.length === 0) {
    return "メッセージ履歴が空です";
  }

  const historyText = messages.slice(0, -1).join("\n");
  const latestMessage = messages[messages.length - 1];

  const categoryMap = {};
  categories.forEach(c => { categoryMap[c.id] = c.name; });

  const wordsText = savedWords.map(w => {
    const categoryName = categoryMap[w.categoryId] || "Unknown";
    return `- ${w.word} (${w.wordRuby || ""}) [${categoryName}]`;
  }).join("\n");

  return `
以下は会話の履歴と保存済みの専門用語です。
最後のメッセージに対して、自然で適切な返答を3つ提案してください。
可能であれば保存済み用語を活用してください。

会話履歴:
${historyText}

保存済み用語:
${wordsText}

最後のメッセージ: 「${latestMessage}」

返答の提案:
  `.trim();
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { idToken, messages = [], savedWords = [], categories = [] } = req.body;

    if (!idToken) return res.status(400).json({ error: "idToken is required" });
    if (!messages || messages.length === 0) return res.status(400).json({ error: "messages is required" });

    // Firebase ID トークン検証
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log("ログインユーザー:", decodedToken.uid);

    // プロンプト生成
    const finalPrompt = buildTextPrompt(messages, savedWords, categories);

    // Gemini API 呼び出し
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.API_KEY_TEXT}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: finalPrompt }] }] })
      }
    );

    if (!response.ok) {
      const errData = await response.json();
      console.error("Gemini API error:", errData);
      return res.status(response.status).json(errData);
    }

    const data = await response.json();

    // Android 側と同じ形式で返す
    res.status(200).json({
      uid: decodedToken.uid,
      data
    });

  } catch (error) {
    console.error("GeminiText API呼び出し失敗:", error);
    res.status(500).json({ error: error.message });
  }
}
