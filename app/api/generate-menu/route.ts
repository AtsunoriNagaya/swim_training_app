          export const runtime = 'edge';

import { type NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"
import { GoogleGenerativeAI } from "@google/generative-ai"
import Anthropic from "@anthropic-ai/sdk"
import { saveMenu, searchSimilarMenus } from "@/lib/kv-storage"

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

// AI応答の型定義
interface MenuItem {
  description: string;
  distance: string;
  sets: number;
  circle: string;
  rest: string | number;
  equipment?: string;
  notes?: string;
  time?: number; // Calculated
}

interface MenuSection {
  name: string;
  items: MenuItem[];
  totalTime?: number; // Calculated
}

interface GeneratedMenuData {
  title: string;
  menu: MenuSection[];
  totalTime: number; // Initially from AI, recalculated later
  intensity?: string | null; // AI might not return this
  targetSkills?: string[] | null; // AI might not return this
}


// AIモデルの設定
const AI_MODEL_CONFIGS = {
  openai: {
    model: "gpt-4o",
  },
  google: {
    model: "gemini-1.5-pro",
  },
  anthropic: {
    model: "claude-3.5-sonnet",
  },
}

// エラー型の定義
interface APIError extends Error {
  response?: {
    status?: number;
    data?: any;
  };
  status?: number;
}

// AIクライアントの初期化関数
function initializeAIClient(aiModel: string, apiKey: string) {
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


// 所要時間計算関数
function calculateItemTime(distance: number, circle: string, sets: number, rest: number): number {
  // サークルタイムを秒に変換（例: "1:30" → 90秒）
  const [minutes, seconds] = circle.split(":").map(Number)
  const circleSeconds = (minutes * 60) + (seconds || 0)
  
  // 1セットの時間（秒）
  const setTimeSeconds = circleSeconds * sets
  
  // 休憩時間（秒）を加算
  const totalSeconds = setTimeSeconds + (rest * 60)
  
  // 分に変換して返す
  return Math.ceil(totalSeconds / 60)
}

// メニュー生成関数
// AIモデル設定
const AI_MODELS = {
  openai: {
    generate: async (prompt: string, systemPrompt: string, apiKey: string) => {
      const client = initializeAIClient("openai", apiKey) as OpenAI;
      const response = await client.chat.completions.create({
        model: AI_MODEL_CONFIGS.openai.model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
      })
      return response.choices[0].message.content
    }
  },
  google: {
    generate: async (prompt: string, systemPrompt: string, apiKey: string) => {
      try {
        const client = initializeAIClient("google", apiKey) as GoogleGenerativeAI;
        const model = client.getGenerativeModel({ model: AI_MODEL_CONFIGS.google.model })
        const response = await model.generateContent([systemPrompt, prompt])
        
        let content = ""
        try {
          const genResponse = response.response
          if (typeof genResponse.text === 'function') {
            content = genResponse.text() || ""
          } 
          else if (genResponse.candidates && genResponse.candidates.length > 0) {
            const candidate = genResponse.candidates[0]
            if (candidate.content && candidate.content.parts && Array.isArray(candidate.content.parts)) {
              content = candidate.content.parts
                .map((part: any) => part.text || "")
                .join("")
            }
          }
        } catch (e) {
          console.error("Gemini応答解析エラー:", e)
        }
        
        if (!content) {
          throw new Error("AIモデルからの応答が空でした")
        }
        return content
      } catch (error) {
        console.error("Gemini API エラー:", error)
        throw new Error("Geminiからの応答の取得に失敗しました")
      }
    }
  },
  anthropic: {
    generate: async (prompt: string, systemPrompt: string, apiKey: string) => {
      const client = initializeAIClient("anthropic", apiKey) as Anthropic;
      const response = await client.messages.create({
        model: AI_MODEL_CONFIGS.anthropic.model,
        max_tokens: 4000,
        system: systemPrompt,
        messages: [{ role: "user", content: prompt }],
      })
      if (response.content[0] && response.content[0].type === 'text') {
        return response.content[0].text
      }
      throw new Error("Anthropic APIからテキスト応答を受け取れませんでした")
    }
  }
}

type AIModelKey = keyof typeof AI_MODELS;

export async function POST(req: NextRequest) {
  try {
    // リクエストボディの詳細をログに記録
    const requestBody = await req.json()
    console.log("リクエストデータ:", JSON.stringify({ 
      aiModel: requestBody.aiModel,
      loadLevelsType: Array.isArray(requestBody.loadLevels) ? 'array' : typeof requestBody.loadLevels,
      loadLevelsValue: requestBody.loadLevels,
      duration: requestBody.duration,
      hasNotes: !!requestBody.notes
    }))

    const { aiModel, apiKey, loadLevels, duration, notes } = requestBody
    
    // 入力値の検証
    if (!apiKey) {
      throw new Error("APIキーが提供されていません")
    }
    
    if (!aiModel) {
      throw new Error("AIモデルが選択されていません")
    }

    // loadLevelsのバリデーション
    if (!loadLevels) {
      throw new Error("負荷レベルが指定されていません")
    }
    
    // loadLevelsが配列でない場合は配列に変換
    const loadLevelsArray = Array.isArray(loadLevels) ? loadLevels : [loadLevels]
    if (loadLevelsArray.length === 0) {
      throw new Error("少なくとも1つの負荷レベルを選択してください")
    }

    // AIモデルの選択
    const selectedModel = AI_MODELS[aiModel as AIModelKey]
    if (!selectedModel) {
      throw new Error("不正なAIモデルが指定されました")
    }

    // 負荷レベルの文字列化
    const loadLevelStr = loadLevelsArray
      .map((level: string) => {
        switch (level) {
          case "A":
            return "高負荷"
          case "B":
            return "中負荷"
          case "C":
            return "低負荷"
          default:
            return level
        }
      })
      .join("・")

    // 過去の類似メニューを検索
    let relevantMenus = ""
    try {
      // 検索クエリを構築
      const queryText = loadLevelsArray.join(" ") + " " + duration + "分"
      const notesText = notes ? " " + notes.toString() : ""
      
      // 類似メニューを検索
      const results = await searchSimilarMenus(queryText + notesText, duration)
      
      // 関連メニューの抽出と整形
      if (results.length > 0) {
        relevantMenus = results
          .map(menu => {
            try {
              const skills = Array.isArray(menu.targetSkills) ? menu.targetSkills : []
              return `- ${menu.title} (${menu.totalTime}分): ${skills.join(", ")}`
            } catch (e) {
              console.error("メニュー整形エラー:", e)
              return ""
            }
          })
          .filter(Boolean)
          .join("\n")
      }
    } catch (error) {
      console.error("RAG検索エラー:", error)
      // RAGの失敗はメニュー生成の致命的なエラーではないため、空文字列で続行
      relevantMenus = ""
    }

    // プロンプトの構築
    const systemPrompt = `あなたは水泳部の練習メニュー作成の専門家です。
指定された条件に基づいて、最適な水泳練習メニューを作成してください。

メニューは以下の構成要素を含めてください：
1. W-up（ウォームアップ）: 体を温め、メイン練習に備えるための準備運動
2. Kick（キック練習）: 下半身の強化と技術向上
3. Pull（プル練習）: 上半身の強化と技術向上
4. Main（メイン練習）: その日の主要な練習課題
5. Drill（ドリル練習）: フォーム改善のための技術練習
6. Down（クールダウン）: 体をクールダウンさせ、疲労を軽減

各項目には以下の詳細を必ず含めてください：
- 種目（自由形、背泳ぎ、平泳ぎ、バタフライ、メドレーなど）
- 距離（25m、50m、100mなど）
- 本数
- サークルタイム（例：100mを2分00秒で回る → "2:00"）
- セット間の休憩時間
- 使用器具（必要な場合）
- 特記事項（ポイントとなる技術的な指示など）

また、以下の点に注意してください：
1. 各項目の所要時間と合計時間を正確に計算すること
2. 指定された総時間（${duration}分）内に収まるようにすること
3. 選手の疲労度を考慮した適切な休憩時間を設定すること
4. 練習の強度が徐々に上がり、最後に下がるような流れを作ること

出力形式は以下のJSON形式で返してください：
{
  "title": "メニュータイトル",
  "menu": [
    {
      "name": "セクション名（例：W-up）",
      "items": [
        {
          "description": "項目の詳細説明",
          "distance": "総距離（m）",
          "sets": "セット数",
          "circle": "サークルタイム",
          "rest": "休憩時間",
          "equipment": "使用器具（オプション）",
          "notes": "特記事項（オプション）",
          "time": "所要時間（分）"
        }
      ],
      "totalTime": "セクション合計時間（分）"
    }
  ],
  "totalTime": "メニュー合計時間（分）",
  "intensity": "メニュー全体の負荷レベル（A/B/C）",
  "targetSkills": ["強化される技術や能力の配列"]
}`

    const userPrompt = `${loadLevelStr}の${duration}分練習メニューを作成してください。
${notes ? `特記事項：${notes}` : ""}
${relevantMenus ? `参考にすべき過去のメニュー情報：${relevantMenus}` : ""}`

    // AIによるメニュー生成
    const text = await selectedModel.generate(userPrompt, systemPrompt, apiKey) || ""
    if (!text) {
      throw new Error("AIモデルからの応答が空でした")
    }

    // メニューデータの検証と時間計算
    let menuData: GeneratedMenuData
    try {
      // AIからの応答をパースし、型キャスト
      menuData = JSON.parse(text) as GeneratedMenuData
      
      // 基本的なバリデーション (キャスト後に行う)
      if (!menuData || !menuData.title || !Array.isArray(menuData.menu) || typeof menuData.totalTime !== 'number') {
        throw new Error("必須フィールドが不足しています")
      }
      
      // 各項目の所要時間を計算して更新
      let calculatedTotal = 0
      for (const section of menuData.menu) {
        let sectionTotal = 0
        for (const item of section.items) {
          // 距離とサークルタイムから所要時間を計算
          if (item.distance && item.circle && item.sets) {
            const distance = parseInt(item.distance.replace(/[^0-9]/g, ""))
            // item.rest (string | number) を数値 (分) に変換
            let restMinutes = 0;
            if (item.rest !== undefined) {
              if (typeof item.rest === 'string') {
                restMinutes = parseInt(item.rest) || 0; 
              } else { // item.rest is number
                restMinutes = item.rest;
              }
            }
            item.time = calculateItemTime(distance, item.circle, item.sets, restMinutes)
            sectionTotal += item.time ?? 0 // item.timeがundefinedの場合0を加算
          }
        }
        section.totalTime = sectionTotal
        calculatedTotal += sectionTotal
      }
      
      // 時間の整合性チェック
      menuData.totalTime = calculatedTotal
      if (calculatedTotal > duration) {
        throw new Error(`生成されたメニュー（${calculatedTotal}分）が指定時間（${duration}分）を超過しています`)
      }
    } catch (error: unknown) {
      const validationError = error as Error
      console.error("メニューデータ検証エラー:", validationError)
      return NextResponse.json(
        { error: `メニューデータの検証に失敗しました: ${validationError.message}` },
        { status: 400 }
      )
    }

    // メニューIDの生成と保存
    const menuId = `menu-${Date.now()}`
    
    // メニューをVercel KVに保存
    try {
      await saveMenu(menuId, {
        ...menuData,
        loadLevels: loadLevelsArray, // 変換済みの配列を使用
        duration,
        notes,
        createdAt: new Date().toISOString()
      })
    } catch (error) {
      console.error("メニュー保存エラー:", error)
      // エラーをログに記録するが、ユーザーには通知しない（ユーザビリティ重視）
    }

    // 結果の返却
    // レスポンス用に値を準備 (型安全性を高める)
    const responseIntensity = menuData.intensity ?? "";
    const responseTargetSkills = Array.isArray(menuData.targetSkills) ? menuData.targetSkills : [];

    return NextResponse.json({
      menuId,
      title: menuData.title,
      createdAt: new Date().toISOString(),
      aiModel: aiModel,
      loadLevels: loadLevelsArray, // 変換済みの配列を使用
      duration: duration,
      notes: notes,
      menu: menuData.menu,
      totalTime: menuData.totalTime,
      intensity: responseIntensity,
      targetSkills: responseTargetSkills,
      remainingTime: duration - menuData.totalTime,
    })
  } catch (error: unknown) {
    console.error("メニュー生成エラー:", error)
    
    const apiError = error as APIError
    
    // エラーの種類に応じた適切なレスポンス
    if (apiError.response?.status === 429 || apiError.status === 429) {
      return NextResponse.json(
        { error: "AIサービスのレート制限に達しました。しばらく待ってから再試行してください。" },
        { status: 429 }
      )
    } else if (apiError.response?.status === 401 || apiError.status === 401) {
      return NextResponse.json(
        { error: "AIサービスの認証に失敗しました。システム管理者に連絡してください。" },
        { status: 401 }
      )
    } else if (apiError.message?.includes("超過")) {
      return NextResponse.json(
        { error: apiError.message },
        { status: 400 }
      )
    }
    
    // その他のエラー
    console.error("詳細なエラー情報:", apiError)
    return NextResponse.json(
      { 
        error: "メニュー生成中にエラーが発生しました。再度お試しください。",
        details: process.env.NODE_ENV === "development" ? apiError.message : undefined
      },
      { status: 500 }
    )
  }
}
