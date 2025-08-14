import { type NextRequest, NextResponse } from "next/server";
import { saveMenu, searchSimilarMenus } from "@/lib/neon-db";
import { getSelectedAIModel } from "@/lib/ai-clients";
import { PROMPT_TEMPLATES, convertLoadLevels, validateApiKey } from "@/lib/ai-config";
import { cleanAIResponse, validateMenuData, calculateMenuTimes } from "@/lib/ai-response-processor";
import { type TrainingMenu } from "@/types/menu";
import { getEmbedding } from "@/lib/embedding"; // 追加: embedding関連のインポート

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

// AI応答の型定義（TrainingMenuと互換性のある形）
export interface GeneratedMenuData {
  title: string;
  menu: Array<{
    name: string;
    items: Array<{
      description: string;
      distance: string | number; // 文字列または数値を許可
      sets: number;
      circle: string;
      equipment?: string;
      notes?: string;
      time?: number;
    }>;
    totalTime?: number;
  }>;
  totalTime: number;
  intensity?: string | null;
  targetSkills?: string[] | null;
}

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

    // AIモデルの選択
    const selectedModel = getSelectedAIModel(aiModel);

    // 負荷レベルの文字列化
    const loadLevelStr = convertLoadLevels(loadLevelsArray);

    // 過去の類似メニューを検索（RAG機能が有効な場合のみ）
    let relevantMenus = "";
    const { useRAG, openaiApiKey } = requestBody;
    
    if (useRAG && openaiApiKey) {
      try {
        // OpenAI APIキーの検証
        const openaiKeyValidation = validateApiKey("openai", openaiApiKey);
        if (!openaiKeyValidation.isValid) {
          console.warn("RAG機能用のOpenAI APIキーが無効です:", openaiKeyValidation.message);
        } else {
          // 検索クエリを構築
          const queryText = loadLevelsArray.join(" ") + " " + duration + "分";
          const notesText = notes ? " " + notes.toString() : "";
          
          // テキストからembeddingを生成して類似メニューを検索
          const queryEmbedding = await getEmbedding(queryText + notesText, openaiApiKey);
          const results = await searchSimilarMenus(queryEmbedding, 5, duration);
          
          // 関連メニューの抽出と整形
          if (results && results.length > 0) {
            relevantMenus = results
              .map((scoredMenu: { id: string; metadata: any; similarity: number }) => {
                try {
                  // metadataからメニュー情報を取得
                  const metadata = scoredMenu.metadata;
                  if (!metadata) return ""; // metadataがない場合はスキップ
                  
                  const title = metadata.title || 'Untitled';
                  const totalTime = metadata.totalTime || 0;
                  const targetSkills = Array.isArray(metadata.targetSkills) ? metadata.targetSkills : [];
                  const skills = targetSkills.join(", ");
                  
                  return `- ${title} (${totalTime}分): ${skills}`;
                } catch (e) {
                  console.error("メニュー整形エラー:", e);
                  return "";
                }
              })
              .filter(Boolean)
              .join("\n");
          }
        }
      } catch (error) {
        console.error("RAG検索エラー:", error);
        // RAGの失敗はメニュー生成の致命的なエラーではないため、空文字列で続行
        relevantMenus = "";
      }
    }

    // プロンプトの構築
    const systemPrompt = PROMPT_TEMPLATES.system(duration);
    const userPrompt = PROMPT_TEMPLATES.user(loadLevelStr, duration, notes, relevantMenus);

    // AIによるメニュー生成
    const text = await selectedModel.generate(userPrompt, systemPrompt, apiKey) || "";
    if (!text) {
      throw new Error("AIモデルからの応答が空でした");
    }

    // メニューデータの検証と時間計算
    let menuData: GeneratedMenuData;
    try {
      // AIからの応答をクリーニング
      const cleanedText = cleanAIResponse(text);
      
      try {
        // AIからの応答をパースし、型キャスト
        menuData = JSON.parse(cleanedText) as GeneratedMenuData;
        console.log("menuData:", JSON.stringify(menuData, null, 2));
      } catch (parseError) {
        console.error("JSON解析エラー:", parseError);
        throw new Error("AIモデルの応答が有効なJSON形式ではありません");
      }
      
      // フィールドの存在チェックとフォールバック処理
      if (!menuData) {
        throw new Error("AIモデルの応答が有効なメニューデータを含んでいません");
      }
      
      // 必須フィールドのチェックとデフォルト値の設定
      if (!menuData.title) {
        console.warn("メニュータイトルが不足しているためデフォルト値を設定します");
        menuData.title = `${loadLevelStr}の${duration}分トレーニングメニュー`;
      }
      
      // メニューデータの検証
      if (!validateMenuData(menuData)) {
        throw new Error("AIモデルの応答が有効なメニューデータ形式ではありません");
      }
      
      // 時間の自動計算
      menuData = calculateMenuTimes(menuData);
      
      // 合計時間の検証
      if (menuData.totalTime > duration) {
        console.warn(`生成されたメニューの合計時間(${menuData.totalTime}分)が指定時間(${duration}分)を超過しています`);
        // 時間調整のロジックをここに追加することも可能
      }
      
    } catch (error) {
      console.error("メニューデータ処理エラー:", error);
      throw new Error(`メニューデータの処理に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // メニューの保存
    const menuId = `menu_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 保存用のデータを構築
    const saveData = {
      ...menuData,
      menuId,
      createdAt: new Date().toISOString(),
      loadLevels: loadLevelsArray,
      duration,
      notes: notes || "",
      aiModel,
    };
    
    try {
      // メニューテキストからembeddingを生成
      const menuText = `${menuData.title} ${menuData.menu.map(section => 
        section.items.map(item => item.description).join(' ')
      ).join(' ')}`;
      
      let embedding: number[] | undefined;
      
      // Embedding生成用のAPIキーを決定（RAG機能が有効な場合はopenaiApiKey、そうでなければメイン生成用APIキーがOpenAIの場合のみ）
      let embeddingApiKey: string | undefined;
      if (useRAG && openaiApiKey) {
        embeddingApiKey = openaiApiKey;
      } else if (aiModel === "openai") {
        embeddingApiKey = apiKey;
      }
      
      if (embeddingApiKey) {
        try {
          embedding = await getEmbedding(menuText, embeddingApiKey);
          console.log("✅ Embedding生成成功");
        } catch (embeddingError) {
          console.warn("⚠️ Embedding生成に失敗しましたが、メニュー保存は続行します:", embeddingError);
          // embedding生成に失敗しても続行
        }
      } else {
        console.log("ℹ️ OpenAI APIキーが利用できないため、Embeddingなしでメニューを保存します");
      }
      
      // メタデータを構築
      const metadata = {
        title: menuData.title,
        description: `AI生成メニュー: ${loadLevelStr} ${duration}分`,
        loadLevels: loadLevelsArray.join(','),
        duration: duration.toString(),
        notes: notes || "",
        totalTime: menuData.totalTime.toString(),
        intensity: menuData.intensity || "",
        targetSkills: menuData.targetSkills || [],
        aiModel,
        createdAt: new Date().toISOString(),
      };
      
      // Neonデータベースに保存（embeddingが生成できた場合のみ）
      if (embedding) {
        await saveMenu(menuId, saveData, embedding, metadata);
        console.log("✅ メニューが正常に保存されました:", menuId);
      } else {
        // embeddingなしで保存（検索機能は制限される）
        await saveMenu(menuId, saveData, undefined, metadata);
        console.log("⚠️ メニューを保存しましたが、embeddingなしのため検索機能は制限されます:", menuId);
      }
    } catch (saveError) {
      console.error("メニュー保存エラー:", saveError);
      // 保存に失敗しても生成されたメニューは返す
      console.log("データベース保存に失敗しましたが、メニューは生成されています");
    }

    // 成功レスポンス
    return NextResponse.json({
      success: true,
      menuId,
      menu: menuData,
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
      if (error.message.includes("APIキー") || error.message.includes("不正なAIモデル")) {
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
