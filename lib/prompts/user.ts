export const userPrompt = (
  loadLevelStr: string,
  duration: number,
  notes?: string,
  relevantMenus?: string
) => `${loadLevelStr}の${duration}分練習メニューを作成してください。
${notes ? `特記事項：${notes}` : ""}
${relevantMenus ? `参考にすべき過去のメニュー情報：${relevantMenus}` : ""}

【重要】必ず有効なJSON形式のみで応答してください。説明文やコードブロックは含めないでください。`;

