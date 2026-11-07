import { type NextRequest, NextResponse } from "next/server";
import { validateApiKey, LOAD_LEVEL_MAPPING } from "@/lib/ai-config";
import { type TrainingMenu, type GeneratedMenuData } from "@/types/menu";
import { generateMenu } from "@/services/menuService";

// 型定義
type GeminiResponse = {
  text: () => string;
  candidates?: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
};

// 型は types/menu へ集約

// エラー型の定義
interface APIError extends Error {
  response?: {
    status?: number;
    data?: any;
  };
  status?: number;
}

export async function POST(req: NextRequest) {
  try {
    // デバッグ情報の出力
    console.log("[API] 🔍 generate-menu API が呼び出されました");
    console.log("[API] 📊 環境変数の状態:", {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      nodeEnv: process.env.NODE_ENV,
      hasOpenAIKey: !!process.env.OPENAI_API_KEY
    });
    
    // リクエストボディの詳細をログに記録
    const requestBody = await req.json();
    console.log("リクエストデータ:", JSON.stringify({ 
      aiModel: requestBody.aiModel,
      loadLevelsType: Array.isArray(requestBody.loadLevels) ? 'array' : typeof requestBody.loadLevels,
      loadLevelsValue: requestBody.loadLevels,
      duration: requestBody.duration,
      hasNotes: !!requestBody.notes
    }));

    const { aiModel, apiKey, loadLevels, duration, notes } = requestBody;
    
    // 入力値の検証
    if (!apiKey) {
      throw new Error("APIキーが提供されていません");
    }
    
    if (!aiModel) {
      throw new Error("AIモデルが選択されていません");
    }

    // APIキーの形式検証
    const apiKeyValidation = validateApiKey(aiModel, apiKey);
    if (!apiKeyValidation.isValid) {
      throw new Error(apiKeyValidation.message || "APIキーの形式が正しくありません");
    }

    // loadLevelsのバリデーション
    if (!loadLevels) {
      throw new Error("負荷レベルが指定されていません");
    }
    
    // loadLevelsが配列でない場合は配列に変換
    const loadLevelsArray = Array.isArray(loadLevels) ? loadLevels : [loadLevels];
    if (loadLevelsArray.length === 0) {
      throw new Error("少なくとも1つの負荷レベルを選択してください");
    }

    // サーバー側でも入力を検証する（クライアントの zod だけに頼らない）。
    // 未検証の負荷レベル文字列は RAG の参照データとして他の利用者のプロンプトに混入するため、A/B/C に限定する
    const validLoadLevels = Object.keys(LOAD_LEVEL_MAPPING);
    if (!loadLevelsArray.every((level: unknown) => typeof level === "string" && validLoadLevels.includes(level))) {
      throw new Error("負荷レベルの指定が正しくありません（A/B/C のいずれか）");
    }
    const durationNum = Number(duration);
    if (!Number.isInteger(durationNum) || durationNum < 15 || durationNum > 240) {
      throw new Error("練習時間は15〜240分の整数で指定してください");
    }
    if (notes !== undefined && notes !== null && (typeof notes !== "string" || notes.length > 2000)) {
      throw new Error("特記事項は2000文字以内で入力してください");
    }

    const { useRAG, openaiApiKey } = requestBody;
    const { menuId, menu } = await generateMenu({
      aiModel,
      apiKey,
      loadLevelsArray,
      duration: durationNum,
      notes,
      useRAG,
      openaiApiKey,
    });

    // 成功レスポンス
    return NextResponse.json({
      success: true,
      menuId,
      menu,
      message: "メニューが正常に生成されました"
    });

  } catch (error) {
    console.error("メニュー生成エラー:", error);
    
    // エラーレスポンスの構築
    let errorMessage = "メニューの生成に失敗しました";
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // 特定のエラーに対するステータスコードの設定
      if (
        error.message.includes("APIキー") ||
        error.message.includes("不正なAIモデル") ||
        error.message.includes("負荷レベル") ||
        error.message.includes("練習時間") ||
        error.message.includes("特記事項")
      ) {
        statusCode = 400;
      } else if (error.message.includes("AIモデルからの応答が空")) {
        statusCode = 503;
      }
    }
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage,
        timestamp: new Date().toISOString()
      },
      { status: statusCode }
    );
  }
}
