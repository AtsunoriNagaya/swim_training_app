import OpenAI from "openai";
import { GoogleGenAI, ApiError as GoogleApiError } from "@google/genai";
import Anthropic from "@anthropic-ai/sdk";
import { AI_MODEL_CONFIGS, type AIModelKey } from "./ai-config";
import { extractAndValidateJSON } from "./json-sanitizer";

// Gemini / Claude はプロンプト側でも JSON のみの応答を念押しする
const JSON_ONLY_NOTE = `

重要: 必ず有効なJSON形式のみで応答してください。説明文やコードブロックは含めないでください。`;

// AIクライアントの初期化関数
export function initializeAIClient(aiModel: string, apiKey: string) {
  switch (aiModel) {
    case "openai":
      return new OpenAI({ apiKey });
    case "google":
      return new GoogleGenAI({ apiKey });
    case "anthropic":
      return new Anthropic({ apiKey });
    default:
      throw new Error("不正なAIモデルが指定されました");
  }
}

// JSONレスポンスの抽出・検証は json-sanitizer に集約

// AIモデルの生成ロジック
// エラー判定は SDK の型付きエラー（status コード）で行い、文字列一致に頼らない
export const AI_MODELS = {
  openai: {
    generate: async (prompt: string, systemPrompt: string, apiKey: string) => {
      try {
        const client = initializeAIClient("openai", apiKey) as OpenAI;
        const response = await client.chat.completions.create({
          model: AI_MODEL_CONFIGS.openai.model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: prompt },
          ],
          response_format: AI_MODEL_CONFIGS.openai.responseFormat,
          // 混入した指示や長い特記事項で出力が膨らんでも、利用者のキーの消費を上限で抑える
          max_completion_tokens: 16000,
        });
        if (response.choices[0]?.finish_reason === "length") {
          throw new Error("OpenAI APIの応答が長すぎて途中で切れました。もう一度お試しください。");
        }
        return response.choices[0]?.message.content || "";
      } catch (error) {
        console.error("OpenAI API エラー:", error);
        if (error instanceof OpenAI.AuthenticationError) {
          throw new Error("OpenAI APIキーが無効です。正しいAPIキー（sk-で始まる）を入力してください。");
        }
        if (error instanceof OpenAI.RateLimitError) {
          if (error.code === "insufficient_quota") {
            throw new Error("OpenAI APIの使用量制限に達しました。アカウントの使用量を確認してください。");
          }
          throw new Error("OpenAI APIのレート制限に達しました。しばらく待ってから再試行してください。");
        }
        // モデル廃止・名称誤りを総称エラーに丸めない（原因特定を容易にする）
        if (error instanceof OpenAI.NotFoundError) {
          throw new Error(`指定された OpenAI モデル（${AI_MODEL_CONFIGS.openai.model}）が見つかりません。モデルが廃止された可能性があります。`);
        }
        throw new Error("OpenAIからの応答の取得に失敗しました");
      }
    }
  },
  
  google: {
    generate: async (prompt: string, systemPrompt: string, apiKey: string) => {
      try {
        const client = initializeAIClient("google", apiKey) as GoogleGenAI;
        const response = await client.models.generateContent({
          model: AI_MODEL_CONFIGS.google.model,
          contents: prompt + JSON_ONLY_NOTE,
          config: {
            systemInstruction: systemPrompt,
            responseMimeType: "application/json",
            maxOutputTokens: 16000,
          },
        });

        if (response.candidates?.[0]?.finishReason === "MAX_TOKENS") {
          throw new Error("Gemini APIの応答が長すぎて途中で切れました。もう一度お試しください。");
        }
        const content = response.text ?? "";
        if (!content) {
          throw new Error("AIモデルからの応答が空でした");
        }
        
        // JSON形式を抽出・検証
        return extractAndValidateJSON(content);
      } catch (error) {
        console.error("Gemini API エラー:", error);
        if (error instanceof GoogleApiError) {
          // Gemini は無効キーを 400（API key not valid）または 401/403 で返す
          if (error.status === 401 || error.status === 403 || (error.status === 400 && /api key/i.test(error.message))) {
            throw new Error("Google Gemini APIキーが無効です。正しいAPIキーを入力してください。");
          }
          // モデル廃止・名称誤りを総称エラーに丸めない（原因特定を容易にする）
          if (error.status === 404) {
            throw new Error(`指定された Gemini モデル（${AI_MODEL_CONFIGS.google.model}）が見つかりません。モデルが廃止された可能性があります。`);
          }
          if (error.status === 429) {
            throw new Error("Google Gemini APIの使用量制限またはレート制限に達しました。しばらく待ってから再試行してください。");
          }
          throw new Error("Geminiからの応答の取得に失敗しました");
        }
        // 自前で投げたエラー（応答が空・JSON不正）はそのまま返す
        throw error;
      }
    }
  },
  
  anthropic: {
    generate: async (prompt: string, systemPrompt: string, apiKey: string) => {
      try {
        const client = initializeAIClient("anthropic", apiKey) as Anthropic;
        const response = await client.messages.create({
          model: AI_MODEL_CONFIGS.anthropic.model,
          max_tokens: AI_MODEL_CONFIGS.anthropic.maxTokens,
          system: systemPrompt,
          messages: [{ role: "user", content: prompt + JSON_ONLY_NOTE }],
        });

        if (response.stop_reason === "refusal") {
          throw new Error("Anthropic APIが安全上の理由で応答を拒否しました。入力内容を見直してください。");
        }
        if (response.stop_reason === "max_tokens") {
          throw new Error("Anthropic APIの応答が長すぎて途中で切れました。もう一度お試しください。");
        }

        // 先頭に thinking ブロックが来ることがあるため、位置ではなく type で探す
        const textBlock = response.content.find(
          (block): block is Anthropic.TextBlock => block.type === "text",
        );
        if (!textBlock) {
          throw new Error("Anthropic APIからテキスト応答を受け取れませんでした");
        }
        // JSON形式を抽出・検証
        return extractAndValidateJSON(textBlock.text);
      } catch (error) {
        console.error("Anthropic API エラー:", error);
        if (error instanceof Anthropic.AuthenticationError) {
          throw new Error("Anthropic APIキーが無効です。正しいAPIキー（sk-ant-で始まる）を入力してください。");
        }
        if (error instanceof Anthropic.RateLimitError) {
          throw new Error("Anthropic APIのレート制限に達しました。しばらく待ってから再試行してください。");
        }
        if (error instanceof Anthropic.NotFoundError) {
          throw new Error(`指定された Anthropic モデル（${AI_MODEL_CONFIGS.anthropic.model}）が見つかりません。モデルが廃止された可能性があります。`);
        }
        if (error instanceof Anthropic.APIError) {
          if (error.status === 529) {
            throw new Error("Anthropic APIが過負荷状態です。しばらく待ってから再試行してください。");
          }
          throw new Error("Anthropicからの応答の取得に失敗しました");
        }
        // 自前で投げたエラー（拒否・途中切れ・JSON不正）はそのまま返す
        throw error;
      }
    }
  }
} as const;

// 選択されたAIモデルの生成関数を取得
export function getSelectedAIModel(aiModel: string) {
  const selectedModel = Object.prototype.hasOwnProperty.call(AI_MODELS, aiModel)
    ? AI_MODELS[aiModel as AIModelKey]
    : undefined;
  if (!selectedModel) {
    throw new Error("不正なAIモデルが指定されました");
  }
  return selectedModel;
}
