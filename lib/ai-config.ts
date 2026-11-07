// AIモデルの設定
// モデルを切り替えるときは、各プロバイダの model（と表示名）を書き換えるだけでよい。
// 料金・廃止予定は各社の公式ページで確認すること。
export const AI_MODEL_CONFIGS = {
  openai: {
    // gpt-4o は 2027-01-14 に提供終了予定。公式が後継として案内する最安ティアを使用。
    // gpt-6 系（推論モデル）は temperature を受け付けないため指定しない
    model: "gpt-6-luna",
    responseFormat: { type: "json_object" },
    displayName: "OpenAI GPT-6 Luna",
    description: "低コスト・高速。日常的なメニュー生成に十分な品質。",
    apiKeyFormat: "sk-proj-",
    apiKeyDescription: "OpenAIのAPIキーを入力してください（sk-で始まる形式）",
    icon: "🤖",
  },
  google: {
    // "-latest" は Google 公式の自動追従エイリアス。Flash 系の新版が出ると自動で切り替わる
    // （切り替えの2週間前にメール通知）。モデル廃止のたびに書き換える必要がない。
    // Gemini 3 系は temperature 既定値(1.0)の利用が推奨のため指定しない
    model: "gemini-flash-latest",
    displayName: "Google Gemini Flash（最新版に自動追従）",
    description: "無料枠あり。高速・軽量。Flash 系の最新版に自動で切り替わる。初回利用・学習目的やコスト効率を重視する場合に推奨。",
    apiKeyFormat: "AIza",
    apiKeyDescription: "Google Gemini APIキーを入力してください",
    icon: "🛡️",
  },
  anthropic: {
    // claude-sonnet-5 の後継として、現行の低コストモデル Haiku 5.5 を使用。
    // Haiku 5.5 は adaptive thinking が既定で有効で、thinking 分も max_tokens に計上されるため余裕を持たせる。
    // temperature は API 側で受け付けないため指定しない
    model: "claude-haiku-5-5",
    maxTokens: 16000,
    displayName: "Anthropic Claude Haiku 5.5",
    description: "低コスト・高速。安全性と一貫性を重視したバランスの良い出力。",
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
  // constructor / __proto__ などプロトタイプ由来のキーを通さない
  const config = Object.prototype.hasOwnProperty.call(AI_MODEL_CONFIGS, aiModel)
    ? AI_MODEL_CONFIGS[aiModel as AIModelKey]
    : undefined;
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
