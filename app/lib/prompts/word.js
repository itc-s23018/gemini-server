export function buildWordPrompt(historyText) {
  return `
以下は会話履歴です。この中から専門用語を抽出してください。
出力は必ず JSON 配列形式のみで返してください。
各要素は {"word": "用語", "wordRuby": "読み仮名"} の形にしてください。
他の文字列や説明は返さないでください。

会話履歴:
${historyText}

専門用語リスト(JSON):
  `.trim();
}
