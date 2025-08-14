// AIモデルの設定
export const AI_MODEL_CONFIGS = {
  openai: {
    model: "gpt-4o",
    temperature: 0.5,
    responseFormat: { type: "json_object" },
    displayName: "OpenAI GPT-4o",
    description: "最高品質・専門的な内容に最適。複雑な指示や高品質な出力が必要な場合に推奨。",
    apiKeyFormat: "sk-proj-",
    apiKeyDescription: "OpenAIのAPIキーを入力してください（sk-で始まる形式）",
    icon: "🤖",
  },
  google: {
    model: "gemini-2.0-flash",
    temperature: 0.4,
    displayName: "Google Gemini 2.0 Flash",
    description: "高速・軽量。初回利用・学習目的やコスト効率を重視する場合に推奨。",
    apiKeyFormat: "AIza",
    apiKeyDescription: "Google Gemini APIキーを入力してください",
    icon: "🛡️",
  },
  anthropic: {
    model: "claude-3-5-sonnet-20241022",
    temperature: 0.5,
    maxTokens: 4000,
    displayName: "Anthropic Claude 3.5 Sonnet",
    description: "安全性と倫理性を重視。日常的な利用やバランスの取れた品質に最適。",
    apiKeyFormat: "sk-ant-",
    apiKeyDescription: "Anthropic Claude APIキーを入力してください（sk-ant-で始まる形式）",
    icon: "⚡",
  },
  // 新しいAIモデルを追加する場合は、以下のような形式で追加できます
  // cohere: {
  //   model: "command-r-plus",
  //   temperature: 0.5,
  //   maxTokens: 4000,
  //   displayName: "Cohere Command R+",
  //   description: "高性能な多言語対応モデル。企業向けの用途に最適。",
  //   apiKeyFormat: "co-",
  //   apiKeyDescription: "Cohere APIキーを入力してください",
  //   icon: "🚀",
  // },
} as const;

export type AIModelKey = keyof typeof AI_MODEL_CONFIGS;

// プロンプトテンプレート
export const PROMPT_TEMPLATES = {
  system: (duration: number) => `あなたは水泳部の練習メニュー作成の専門家です。
指定された条件に基づいて、最適な水泳練習メニューを作成してください。

メニューは以下の構成要素を含めてください：
1. W-up（ウォームアップ）: 体を温め、メイン練習に備えるための準備運動
2. Kick（キック練習）: 下半身の強化と技術向上
3. Pull（プル練習）: 上半身の強化と技術向上
4. Main（メイン練習）: その日の主要な練習課題
5. Drill（ドリル練習）: フォーム改善のための技術練習
6. Down（クールダウン）: 体をクールダウンさせ、疲労を軽減

各項目には以下の詳細を必ず含めてください：
- メニュー名: 距離×本数の形式で記述（例: "25m×4本"）
- 種目（自由形、背泳ぎ、平泳ぎ、バタフライ、メドレーなど）
- 距離: メニュー名と一致させること
- サークルタイム（例：100mを2分00秒で回る → "2:00"）
- 使用器具（必要な場合）
- 特記事項（ポイントとなる技術的な指示など）

【重要】メニュー名と距離の整合性について：
- メニュー名が"25m×4本"の場合、distanceは"25"と設定すること
- メニュー名に含まれる本数とsetsの値を一致させること

また、以下の点に注意してください：
1. 各項目の所要時間と合計時間を正確に計算すること
2. 【最重要】指定された総時間（${duration}分）内に収まるようにすること - この条件を満たさないメニューは無効です
3. 選手の疲労度を考慮した適切な休憩時間を設定すること
4. 練習の強度が徐々に上がり、最後に下がるような流れを作ること

必ず合計時間が${duration}分以内になるようにメニューを作成してください。それを超えるものは受け入れられません。

【最重要: 出力形式について】
必ず生のJSONのみを返してください。コードブロック('json')やマークダウン形式、説明文、余分なテキストは一切含めないでください。
以下の形式に厳密に従って応答してください。必須フィールドを必ず含めてください：

{
  "title": "メニュータイトル",
  "menu": [
    {
      "name": "セクション名（例：W-up）",
      "items": [
        {
          "description": "項目の詳細説明",
          "distance": "総距離（m）",
          "sets": 3,
          "circle": "2:00",
          "equipment": "使用器具（オプション）",
          "notes": "特記事項（オプション）",
          "time": 10
        }
      ],
      "totalTime": 15
    }
  ],
  "totalTime": 90,
  "intensity": "B",
  "targetSkills": ["キック", "持久力"]
}

【絶対に守ってください】
- JSONオブジェクトのみを返す
- 前後に説明文やコードブロックを付けない
- マークダウン記法を使用しない
- 日本語のコメントは含めない
- 有効なJSON形式で返す
- 必須フィールド（title, menu, totalTime）を必ず含める`,

  user: (loadLevelStr: string, duration: number, notes?: string, relevantMenus?: string) => 
    `${loadLevelStr}の${duration}分練習メニューを作成してください。
${notes ? `特記事項：${notes}` : ""}
${relevantMenus ? `参考にすべき過去のメニュー情報：${relevantMenus}` : ""}

【重要】必ず有効なJSON形式のみで応答してください。説明文やコードブロックは含めないでください。`,
};

// 負荷レベルの変換マッピング
export const LOAD_LEVEL_MAPPING = {
  A: "高負荷",
  B: "中負荷", 
  C: "低負荷",
} as const;

export type LoadLevelKey = keyof typeof LOAD_LEVEL_MAPPING;

// 負荷レベルを文字列に変換する関数
export function convertLoadLevels(loadLevels: string[]): string {
  return loadLevels
    .map((level: string) => LOAD_LEVEL_MAPPING[level as LoadLevelKey] || level)
    .join("・");
}

// APIキー形式の検証関数
export function validateApiKey(aiModel: string, apiKey: string): { isValid: boolean; message?: string } {
  const config = AI_MODEL_CONFIGS[aiModel as AIModelKey];
  if (!config) {
    return { isValid: false, message: "不正なAIモデルが指定されました" };
  }

  if (!apiKey || apiKey.trim() === "") {
    return { isValid: false, message: "APIキーを入力してください" };
  }

  const trimmedKey = apiKey.trim();

  switch (aiModel) {
    case "openai":
      if (!trimmedKey.startsWith("sk-")) {
        return { isValid: false, message: "OpenAI APIキーは「sk-」で始まる必要があります" };
      }
      if (trimmedKey.length < 20) {
        return { isValid: false, message: "OpenAI APIキーの形式が正しくありません" };
      }
      break;

    case "google":
      if (!trimmedKey.startsWith("AIza")) {
        return { isValid: false, message: "Google Gemini APIキーは「AIza」で始まる必要があります" };
      }
      if (trimmedKey.length < 30) {
        return { isValid: false, message: "Google Gemini APIキーの形式が正しくありません" };
      }
      break;

    case "anthropic":
      if (!trimmedKey.startsWith("sk-ant-")) {
        return { isValid: false, message: "Anthropic APIキーは「sk-ant-」で始まる必要があります" };
      }
      if (trimmedKey.length < 40) {
        return { isValid: false, message: "Anthropic APIキーの形式が正しくありません" };
      }
      break;

    default:
      // 新しいAIモデルの場合は基本的な検証のみ
      if (trimmedKey.length < 10) {
        return { isValid: false, message: "APIキーが短すぎます" };
      }
      break;
  }

  return { isValid: true };
}
