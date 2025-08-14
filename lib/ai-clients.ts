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

// AIモデルの生成ロジック
export const AI_MODELS = {
  openai: {
    generate: async (prompt: string, systemPrompt: string, apiKey: string) => {
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
      return response.choices[0].message.content;
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
        const response = await model.generateContent([systemPrompt, prompt]);
        
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
        return content;
      } catch (error) {
        console.error("Gemini API エラー:", error);
        throw new Error("Geminiからの応答の取得に失敗しました");
      }
    }
  },
  
  anthropic: {
    generate: async (prompt: string, systemPrompt: string, apiKey: string) => {
      const client = initializeAIClient("anthropic", apiKey) as Anthropic;
      const response = await client.messages.create({
        model: AI_MODEL_CONFIGS.anthropic.model,
        max_tokens: AI_MODEL_CONFIGS.anthropic.maxTokens,
        system: systemPrompt,
        temperature: AI_MODEL_CONFIGS.anthropic.temperature,
        messages: [{ role: "user", content: prompt }],
      });
      if (response.content[0] && response.content[0].type === 'text') {
        return response.content[0].text;
      }
      throw new Error("Anthropic APIからテキスト応答を受け取れませんでした");
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
