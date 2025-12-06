export function buildVoicePrompt(rawText, history = [], dbWords = [], user = null) {
  const recentHistory = history.slice(-5); // 直近5件だけ
  const historyText = recentHistory.join("\n");

  // 辞書を reduce で高速結合
  const dictionaryText = dbWords.reduce((acc, w, i) => {
    return acc + (i > 0 ? ", " : "") + `${w.word}(${w.wordRuby || ""})`;
  }, "");

  // ユーザー情報を直接まとめる
  const userTextSection = user
    ? `ユーザー情報:\nユーザー名: ${user.lastName}${user.firstName} (${user.lastNameRuby || ""} ${user.firstNameRuby || ""})\n`
    : "";

  return `
あなたのタスクは「最新の入力の文」を自然な日本語に補正することです。
これまでの直近の会話履歴、マイ辞書、ユーザーの名前情報を参考にして、
会話の流れに沿った自然な文になるようにしてください。
補正対象は必ず最新の入力のみです。

会話履歴（直近5件）:
${historyText}

マイ辞書:
${dictionaryText}

${userTextSection}最新の入力: 「${rawText}」

補正後の文:
  `.trim();
}
