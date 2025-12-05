export function buildVoicePrompt(rawText, history = [], dbWords = [], user = null) {
  const historyText = history.join("\n");
  const dictionaryText = dbWords.map(w => `${w.word}(${w.wordRuby || ""})`).join(", ");
  const userText = user
    ? `ユーザー名: ${user.lastName}${user.firstName} (${user.lastNameRuby || ""} ${user.firstNameRuby || ""})`
    : "";
  const userTextSection = userText ? `ユーザー情報:\n${userText}\n` : "";

  return `
あなたのタスクは「最新の入力の文」を自然な日本語に補正することです。
これまでの会話履歴、マイ辞書、ユーザーの名前情報を参考にして、
会話の流れに沿った自然な文になるようにしてください。
補正対象は必ず最新の入力のみです。

会話履歴:
${historyText}

マイ辞書:
${dictionaryText}

${userTextSection}
最新の入力: 「${rawText}」

補正後の文:
  `.trim();
}
