export function buildTextPrompt(historyText) {
  return `
以下は会話の履歴と保存済みの専門用語です。
最後のメッセージに対して、自然で適切な返答を3つ提案してください。
可能であれば保存済み用語を活用してください。

会話履歴:
${historyText}

返答の提案:
  `.trim();
}