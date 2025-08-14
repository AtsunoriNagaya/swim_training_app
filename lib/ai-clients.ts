import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Anthropic from "@anthropic-ai/sdk";
import { AI_MODEL_CONFIGS, type AIModelKey } from "./ai-config";

// AIクライアントの初期化関数
export function initializeAIClient(aiModel: string, apiKey: string) {
  switch (aiModel) {
    case "openai":
      return new OpenAI({ apiKey });
    case "google":
      return new GoogleGenerativeAI(apiKey);
    case "anthropic":
      return new Anthropic({ apiKey });
    default:
      throw new Error("不正なAIモデルが指定されました");
  }
}

// JSONレスポンスを抽出・検証する関数
function extractAndValidateJSON(content: string): string {
  // コードブロックを除去
  let cleanedContent = content.replace(/```json\s*/g, '').replace(/```\s*$/g, '');
  
  // 前後の余分なテキストを除去
  cleanedContent = cleanedContent.trim();
  
  // JSONの開始と終了を探す
  const jsonStart = cleanedContent.indexOf('{');
  const jsonEnd = cleanedContent.lastIndexOf('}');
  
  if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
    cleanedContent = cleanedContent.substring(jsonStart, jsonEnd + 1);
  }
  
  // JSONとして有効かチェック
  try {
    JSON.parse(cleanedContent);
    return cleanedContent;
  } catch (e) {
    // JSONとして無効な場合、元のコンテンツを返す
    console.warn("JSON形式の検証に失敗しました。元のコンテンツを返します。", e);
    return content;
  }
}

// AIモデルの生成ロジック
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
          temperature: AI_MODEL_CONFIGS.openai.temperature,
          response_format: AI_MODEL_CONFIGS.openai.responseFormat,
        });
        return response.choices[0].message.content || "";
      } catch (error) {
        console.error("OpenAI API エラー:", error);
        if (error instanceof Error) {
          // APIキー関連のエラーをより詳細に
          if (error.message.includes('Incorrect API key') || error.message.includes('Invalid API key')) {
            throw new Error("OpenAI APIキーが無効です。正しいAPIキー（sk-で始まる）を入力してください。");
          }
          if (error.message.includes('rate_limit_exceeded')) {
            throw new Error("OpenAI APIのレート制限に達しました。しばらく待ってから再試行してください。");
          }
          if (error.message.includes('insufficient_quota')) {
            throw new Error("OpenAI APIの使用量制限に達しました。アカウントの使用量を確認してください。");
          }
        }
        throw new Error("OpenAIからの応答の取得に失敗しました");
      }
    }
  },
  
  google: {
    generate: async (prompt: string, systemPrompt: string, apiKey: string) => {
      try {
        const client = initializeAIClient("google", apiKey) as GoogleGenerativeAI;
        const model = client.getGenerativeModel({ 
          model: AI_MODEL_CONFIGS.google.model,
          generationConfig: {
            temperature: AI_MODEL_CONFIGS.google.temperature,
          }
        });
        
        // Gemini用にプロンプトを最適化
        const geminiPrompt = `${systemPrompt}

${prompt}

重要: 必ず有効なJSON形式のみで応答してください。説明文やコードブロックは含めないでください。`;
        
        const response = await model.generateContent(geminiPrompt);
        
        let content = "";
        try {
          const genResponse = response.response;
          if (typeof genResponse.text === 'function') {
            content = genResponse.text() || "";
          } 
          else if (genResponse.candidates && genResponse.candidates.length > 0) {
            const candidate = genResponse.candidates[0];
            if (candidate.content && candidate.content.parts && Array.isArray(candidate.content.parts)) {
              content = candidate.content.parts
                .map((part: any) => part.text || "")
                .join("");
            }
          }
        } catch (e) {
          console.error("Gemini応答解析エラー:", e);
        }
        
        if (!content) {
          throw new Error("AIモデルからの応答が空でした");
        }
        
        // JSON形式を抽出・検証
        return extractAndValidateJSON(content);
      } catch (error) {
        console.error("Gemini API エラー:", error);
        if (error instanceof Error) {
          // APIキー関連のエラーをより詳細に
          if (error.message.includes('API_KEY_INVALID') || error.message.includes('Invalid API key')) {
            throw new Error("Google Gemini APIキーが無効です。正しいAPIキーを入力してください。");
          }
          if (error.message.includes('QUOTA_EXCEEDED') || error.message.includes('quota exceeded')) {
            throw new Error("Google Gemini APIの使用量制限に達しました。しばらく待ってから再試行してください。");
          }
          if (error.message.includes('RATE_LIMIT_EXCEEDED')) {
            throw new Error("Google Gemini APIのレート制限に達しました。しばらく待ってから再試行してください。");
          }
        }
        throw new Error("Geminiからの応答の取得に失敗しました");
      }
    }
  },
  
  anthropic: {
    generate: async (prompt: string, systemPrompt: string, apiKey: string) => {
      try {
        const client = initializeAIClient("anthropic", apiKey) as Anthropic;
        
        // Claude用にプロンプトを最適化
        const fullPrompt = `${prompt}

重要: 必ず有効なJSON形式のみで応答してください。説明文やコードブロックは含めないでください。`;
        
        const response = await client.messages.create({
          model: AI_MODEL_CONFIGS.anthropic.model,
          max_tokens: AI_MODEL_CONFIGS.anthropic.maxTokens,
          system: systemPrompt,
          temperature: AI_MODEL_CONFIGS.anthropic.temperature,
          messages: [{ role: "user", content: fullPrompt }],
        });
        
        if (response.content[0] && response.content[0].type === 'text') {
          const content = response.content[0].text;
          // JSON形式を抽出・検証
          return extractAndValidateJSON(content);
        }
        throw new Error("Anthropic APIからテキスト応答を受け取れませんでした");
      } catch (error) {
        console.error("Anthropic API エラー:", error);
        if (error instanceof Error) {
          // APIキー関連のエラーをより詳細に
          if (error.message.includes('authentication_error') || error.message.includes('invalid x-api-key')) {
            throw new Error("Anthropic APIキーが無効です。正しいAPIキー（sk-ant-で始まる）を入力してください。");
          }
          if (error.message.includes('rate_limit')) {
            throw new Error("Anthropic APIのレート制限に達しました。しばらく待ってから再試行してください。");
          }
          if (error.message.includes('not_found_error') && error.message.includes('model:')) {
            throw new Error("指定されたAnthropic AIモデルが見つかりません。モデル名を確認してください。");
          }
          if (error.message.includes('overloaded_error')) {
            throw new Error("Anthropic APIが過負荷状態です。しばらく待ってから再試行してください。");
          }
        }
        throw new Error("Anthropicからの応答の取得に失敗しました");
      }
    }
  }
} as const;

// 選択されたAIモデルの生成関数を取得
export function getSelectedAIModel(aiModel: string) {
  const selectedModel = AI_MODELS[aiModel as AIModelKey];
  if (!selectedModel) {
    throw new Error("不正なAIモデルが指定されました");
  }
  return selectedModel;
}
