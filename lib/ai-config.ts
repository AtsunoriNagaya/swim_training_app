// AIモデルの設定
export const AI_MODEL_CONFIGS = {
  openai: {
    model: "gpt-4o",
    temperature: 0.5,
    responseFormat: { type: "json_object" },
  },
  google: {
    model: "gemini-2.0-flash",
    temperature: 0.4,
  },
  anthropic: {
    model: "claude-3.5-sonnet",
    temperature: 0.5,
    maxTokens: 4000,
  },
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

【重要: 出力形式について】
必ず生のJSONのみを返してください。コードブロック('json')やマークダウン形式は使用しないでください。
以下の形式に厳密に従って応答してください。必須フィールドを必ず含めてください：

{
  "title": "メニュータイトル",  // 文字列：必須
  "menu": [                    // 配列：必須
    {
      "name": "セクション名（例：W-up）",
      "items": [               // 配列：必須
        {
          "description": "項目の詳細説明",  // 文字列：必須
          "distance": "総距離（m）",        // 文字列：必須
          "sets": 3,                      // 数値：必須
          "circle": "2:00",               // 文字列：必須
          "equipment": "使用器具（オプション）",
          "notes": "特記事項（オプション）",
          "time": 10                      // 数値：自動計算します
        }
      ],
      "totalTime": 15                     // 数値：自動計算します
    }
  ],
  "totalTime": 90,             // 数値：必須（練習の合計時間 - 分単位）
  "intensity": "B",            // 文字列：任意
  "targetSkills": ["キック", "持久力"]  // 文字列配列：任意
}

重要な点：
- title（文字列）：メニュータイトルは必須です
- menu（配列）：メニューセクションの配列は必須です
- totalTime（数値）：合計時間（分）は必須で、必ず数値型で返してください

JSONオブジェクトのみを返し、JSONの前後に余分なテキストや説明を含めないでください。`,

  user: (loadLevelStr: string, duration: number, notes?: string, relevantMenus?: string) => 
    `${loadLevelStr}の${duration}分練習メニューを作成してください。
${notes ? `特記事項：${notes}` : ""}
${relevantMenus ? `参考にすべき過去のメニュー情報：${relevantMenus}` : ""}`,
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
