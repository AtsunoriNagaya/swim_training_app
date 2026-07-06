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
    // gemini-2.0-flash は 2026-06-01 に提供終了。公式推奨の後継モデルを使用
    model: "gemini-3.5-flash",
    temperature: 0.4,
    displayName: "Google Gemini 3.5 Flash",
    description: "基本無料で使用可能。高速・軽量。初回利用・学習目的やコスト効率を重視する場合に推奨。",
    apiKeyFormat: "AIza",
    apiKeyDescription: "Google Gemini APIキーを入力してください",
    icon: "🛡️",
  },
  anthropic: {
    // claude-3-5-sonnet-20241022 は 2025-10-28 に提供終了。
    // 後継の claude-sonnet-5 は temperature 指定を受け付けないため設定しない
    model: "claude-sonnet-5",
    maxTokens: 4000,
    displayName: "Anthropic Claude Sonnet 5",
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

// プロンプトテンプレートは専用モジュールへ分割
export { PROMPT_TEMPLATES } from "./prompts";

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
