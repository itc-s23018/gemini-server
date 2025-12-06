export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { idToken, prompt, mode, history = [], dbWords = [], user = null } = req.body;

    if (!idToken) return res.status(400).json({ error: "idToken is required" });
    if (!prompt) return res.status(400).json({ error: "prompt is required" });

    const decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log("ログインユーザー:", decodedToken.uid);

    let apiKey;
    switch (mode) {
      case "voice": apiKey = process.env.API_KEY_VOICE; break;
      case "word": apiKey = process.env.API_KEY_WORD; break;
      case "text":
      default: apiKey = process.env.API_KEY_TEXT;
    }

    let finalPrompt;
    if (mode === "voice") {
      finalPrompt = buildVoicePrompt(prompt, history, dbWords, user);
    } else if (mode === "word") {
      finalPrompt = buildWordPrompt(prompt);
    } else {
      finalPrompt = buildTextPrompt(prompt);
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: finalPrompt }] }] }),
        signal: controller.signal
      }
    );

    clearTimeout(timeout);

    if (!response.ok) {
      const errData = await response.json();
      console.error("Gemini API error:", errData);
      return res.status(response.status).json(errData);
    }

    const data = await response.json();

    res.status(200).json({
      uid: decodedToken.uid,
      data
    });

  } catch (error) {
    console.error("Gemini API呼び出し失敗:", error);
    res.status(500).json({ error: error.message });
  }
}
