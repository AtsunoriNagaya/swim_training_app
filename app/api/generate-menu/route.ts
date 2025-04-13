export const runtime = 'edge';

import { type NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Anthropic from "@anthropic-ai/sdk";
import { saveMenu, searchSimilarMenus } from "@/lib/kv-storage";

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
export interface MenuItem {
  description: string;
  distance: string;
  sets: number;
  circle: string;
  equipment?: string;
  notes?: string;
  time?: number; // Calculated
}

export interface MenuSection {
  name: string;
  items: MenuItem[];
  totalTime?: number; // Calculated
}

export interface GeneratedMenuData {
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
    model: "gemini-2.0-flash", // gemini-1.5-proからgemini-2.0-flashに更新
  },
  anthropic: {
    model: "claude-3.5-sonnet",
  },
};

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
function calculateItemTime(distance: number, circle: string, sets: number): number {
  try {
    // サークルタイムを秒に変換（"1:30" → 90秒）
    const [minutes, seconds] = circle.split(":").map(Number);
    if (isNaN(minutes) || isNaN(seconds)) {
      console.error(`Invalid circle time format: ${circle}`);
      throw new Error("サークルタイムの形式が不正です");
    }
    const circleSeconds = (minutes * 60) + (seconds || 0);
    
    // 所要時間（秒）= サークルタイム × 本数
    const totalSeconds = circleSeconds * sets;
    
    // 分に変換して返す（切り上げ）
    const calculatedTime = Math.ceil(totalSeconds / 60);
    console.log(`calculateItemTime: distance=${distance}, circle=${circle}, sets=${sets}, calculatedTime=${calculatedTime}`);
    return calculatedTime;
  } catch (error) {
    console.error("Time calculation error:", error);
    // エラー時は概算値を返す
    const estimatedTime = Math.ceil((distance * sets) / 50);
    console.log(`calculateItemTime (estimated): distance=${distance}, circle=${circle}, sets=${sets}, estimatedTime=${estimatedTime}`);
    return estimatedTime;
  }
}

// メニュー生成関数
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
        temperature: 0.5, // より一貫した応答を得るために温度を下げる
        response_format: { type: "json_object" }, // JSONレスポンスを強制
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
            temperature: 0.4, // より一貫した応答を得るために温度を下げる
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
        max_tokens: 4000,
        system: systemPrompt,
        temperature: 0.5, // より一貫した応答を得るために温度を下げる
        messages: [{ role: "user", content: prompt }],
      });
      if (response.content[0] && response.content[0].type === 'text') {
        return response.content[0].text;
      }
      throw new Error("Anthropic APIからテキスト応答を受け取れませんでした");
    }
  }
};

type AIModelKey = keyof typeof AI_MODELS;

export async function POST(req: NextRequest) {
  try {
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
    const selectedModel = AI_MODELS[aiModel as AIModelKey];
    if (!selectedModel) {
      throw new Error("不正なAIモデルが指定されました");
    }

    // 負荷レベルの文字列化
    const loadLevelStr = loadLevelsArray
      .map((level: string) => {
        switch (level) {
          case "A":
            return "高負荷";
          case "B":
            return "中負荷";
          case "C":
            return "低負荷";
          default:
            return level;
        }
      })
      .join("・");

    // 過去の類似メニューを検索
    let relevantMenus = "";
    try {
      // 検索クエリを構築
      const queryText = loadLevelsArray.join(" ") + " " + duration + "分";
      const notesText = notes ? " " + notes.toString() : "";
      
      // 類似メニューを検索
      const results = await searchSimilarMenus(queryText + notesText, duration);
      
      // 関連メニューの抽出と整形
      if (results && results.length > 0) {
        relevantMenus = results
          .map((scoredMenu: { menuData: GeneratedMenuData }) => {
            try {
              // ScoredMenuからmenuDataを取得
              const menu = scoredMenu.menuData;
              if (!menu) return ""; // menuDataがない場合はスキップ
              
              const skills = Array.isArray(menu.targetSkills) ? menu.targetSkills : [];
              return `- ${menu.title} (${menu.totalTime}分): ${skills.join(", ")}`;
            } catch (e) {
              console.error("メニュー整形エラー:", e);
              return "";
            }
          })
          .filter(Boolean)
          .join("\n");
      }
    } catch (error) {
      console.error("RAG検索エラー:", error);
      // RAGの失敗はメニュー生成の致命的なエラーではないため、空文字列で続行
      relevantMenus = "";
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

JSONオブジェクトのみを返し、JSONの前後に余分なテキストや説明を含めないでください。`;

    const userPrompt = `${loadLevelStr}の${duration}分練習メニューを作成してください。
${notes ? `特記事項：${notes}` : ""}
${relevantMenus ? `参考にすべき過去のメニュー情報：${relevantMenus}` : ""}`;

    // AIによるメニュー生成
    const text = await selectedModel.generate(userPrompt, systemPrompt, apiKey) || "";
    if (!text) {
      throw new Error("AIモデルからの応答が空でした");
    }

    // メニューデータの検証と時間計算
    let menuData: GeneratedMenuData;
    try {
      // AIからの応答をクリーニング (不要なテキストとMarkdownコードブロックの除去)
      let cleanedText = text;
      
      console.log("AIモデルからの生の応答:", text.substring(0, 200) + "...");
      
      // ```json などのコードブロックを検出してクリーニング
      const jsonBlockRegex = /```(?:json)?\s*\n([\s\S]*?)\n```/;
      const match = text.match(jsonBlockRegex);
      if (match && match[1]) {
        cleanedText = match[1].trim();
        console.log("マークダウンコードブロックを検出してクリーニングしました");
      }
      
      // 先頭と末尾の余分なテキストを除去 (JSON以外のテキストを取り除く試み)
      const jsonStartIndex = cleanedText.indexOf('{');
      const jsonEndIndex = cleanedText.lastIndexOf('}');
      
      if (jsonStartIndex !== -1 && jsonEndIndex !== -1 && jsonEndIndex > jsonStartIndex) {
        cleanedText = cleanedText.substring(jsonStartIndex, jsonEndIndex + 1);
        console.log("JSONオブジェクトのみを抽出しました");
      }
      
      console.log("クリーニング後のテキスト:", cleanedText.substring(0, 100) + "...");
      
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
      
      if (!Array.isArray(menuData.menu) || menuData.menu.length === 0) {
        throw new Error("menuフィールドが不足しているか空の配列です");
      }
      
      if (typeof menuData.totalTime !== 'number') {
        console.warn("totalTimeが数値ではないためデフォルト値を設定します");
        // 実際の計算値で後で上書きされるため、ここでは仮の値を設定
        menuData.totalTime = 0;
      }
      
      // 各セクションの検証
      for (const section of menuData.menu) {
        if (!Array.isArray(section.items)) {
          section.items = [];
          console.warn(`セクション「${section.name}」のitemsが配列ではないため、空の配列に設定しました`);
        }
      }
      
      // 各項目の所要時間を計算して更新
      let calculatedTotal = 0;
      for (const section of menuData.menu) {
        let sectionTotal = 0;
        for (const item of section.items) {
          // 距離とサークルタイムから所要時間を計算
          if (item.distance && item.circle && item.sets) {
            const distance = parseInt(item.distance.replace(/[^0-9]/g, ""));
            item.time = calculateItemTime(distance, item.circle, item.sets);
            sectionTotal += item.time ?? 0; // item.timeがundefinedの場合0を加算
          }
        }
        section.totalTime = sectionTotal;
        calculatedTotal += sectionTotal;
      }
      
      // 時間の整合性チェック
      menuData.totalTime = calculatedTotal;
      
      // 時間超過の場合、高度な自動調整機能
      if (calculatedTotal > duration) {
        console.warn(`生成されたメニューが時間超過（${calculatedTotal}分 > ${duration}分）。自動調整を試みます。`);
        
        // セクションの重要度を定義（高い数字ほど優先的に削減）
        const sectionPriorities: {[key: string]: number} = {
          "W-up": 2,    // ウォームアップは比較的重要だが、多少削減可能
          "Kick": 3,    // 技術練習は重要だが調整可能
          "Pull": 3,    // 技術練習は重要だが調整可能
          "Main": 4,    // メインセットは最も削減対象になりやすい
          "Drill": 3,   // 技術練習は重要だが調整可能
          "Down": 1     // クールダウンは短くなりすぎないよう保護
        };
        
        // 各セクションをカテゴリ分け
        const categorizedSections: {[priority: number]: MenuSection[]} = {};
        for (const section of menuData.menu) {
          const priority = sectionPriorities[section.name] || 2; // デフォルト優先度は2
          if (!categorizedSections[priority]) {
            categorizedSections[priority] = [];
          }
          categorizedSections[priority].push(section);
        }
        
        // 繰り返し調整を行う関数
        const adjustMenuTime = (targetDuration: number): number => {
          // 目標時間より1分短い値を目標とし、余裕を持たせる
          const safetyTargetDuration = targetDuration - 1;
          
          // 現在の合計時間を計算
          let currentTotal = 0;
          for (const section of menuData.menu) {
            currentTotal += section.totalTime || 0;
          }
          
          if (currentTotal <= safetyTargetDuration) {
            return currentTotal; // すでに目標時間内ならそのまま終了
          }
          
          // 優先度の高い順（数字が大きい順）に調整
          const priorities = Object.keys(categorizedSections)
            .map(Number)
            .sort((a, b) => b - a); // 降順ソート
          
          for (const priority of priorities) {
            const sectionsToAdjust = categorizedSections[priority];
            
            // この優先度のセクションの合計時間を計算
            let priorityTotalTime = 0;
            for (const section of sectionsToAdjust) {
              priorityTotalTime += section.totalTime || 0;
            }
            
            // 必要な削減量を計算
            const excessTime = currentTotal - safetyTargetDuration;
            const reductionFactor = Math.max(0.5, (priorityTotalTime - excessTime) / priorityTotalTime);
            
            // 各セクションの項目を調整
            let adjustedPriorityTotal = 0;
            for (const section of sectionsToAdjust) {
              let adjustedSectionTotal = 0;
              
              // 各項目を調整
              for (const item of section.items) {
                if (item.time) {
                  const originalTime = item.time;
                  // 重要度によって異なる最小値を設定（重要なセクションは短くなりすぎないように）
                  const minTime = 5 - priority; // 優先度4→最小1分、優先度1→最小4分
                  item.time = Math.max(minTime, Math.floor(item.time * reductionFactor));
                  
                  if (originalTime !== item.time) {
                    console.log(`優先調整: ${section.name} - ${item.description} (${originalTime}分 → ${item.time}分)`);
                  }
                  
                  adjustedSectionTotal += item.time;
                }
              }
              
              // セクション合計を更新
              section.totalTime = adjustedSectionTotal;
              adjustedPriorityTotal += adjustedSectionTotal;
            }
            
            // 全体の合計を再計算
            currentTotal = 0;
            for (const section of menuData.menu) {
              currentTotal += section.totalTime || 0;
            }
            
            if (currentTotal <= safetyTargetDuration) {
              break; // 目標達成したらループを抜ける
            }
          }
          
          return currentTotal;
        };
        
        // 最大5回まで繰り返し調整を試みる
        let adjustedDuration = calculatedTotal;
        let adjustmentAttempts = 0;
        const maxAttempts = 5;
        
        while (adjustedDuration > duration && adjustmentAttempts < maxAttempts) {
          adjustmentAttempts++;
          adjustedDuration = adjustMenuTime(duration);
          console.log(`調整試行 ${adjustmentAttempts}: ${adjustedDuration}分`);
        }
        
        // 最終的に調整がうまくいかなかった場合は、強制的に時間を削減
        if (adjustedDuration > duration) {
          console.warn(`通常の調整で目標達成できず。強制調整を適用します。`);
          
          // 残りの超過時間
          let remainingExcess = adjustedDuration - duration + 1; // 1分の余裕
          
          // メイン → ドリル/キック/プル → ウォームアップ → クールダウンの順で1分ずつ削減
          const reductionOrder = ["Main", "Drill", "Kick", "Pull", "W-up", "Down"];
          
          while (remainingExcess > 0) {
            let reducedInThisPass = false;
            
            for (const sectionName of reductionOrder) {
              if (remainingExcess <= 0) break;
              
              // 該当するセクションを探す
              const section = menuData.menu.find(s => s.name === sectionName);
              if (!section || !section.items.length) continue;
              
              // 最も時間の長い項目を見つける
              section.items.sort((a, b) => (b.time || 0) - (a.time || 0));
              
              // 最も長い項目を1分削減（最低1分は保証）
              const item = section.items[0];
              if (item.time && item.time > 1) {
                const originalTime = item.time;
                item.time -= 1;
                remainingExcess -= 1;
                reducedInThisPass = true;
                console.log(`強制削減: ${section.name} - ${item.description} (${originalTime}分 → ${item.time}分)`);
                
                // セクション合計を更新
                section.totalTime = (section.totalTime || 0) - 1;
              }
            }
            
            // もう削減できない場合はループを抜ける
            if (!reducedInThisPass) {
              console.warn(`これ以上削減できません。最終結果: ${adjustedDuration - remainingExcess}分`);
              break;
            }
          }
          
          // 最終的な時間を再計算
          let finalTotal = 0;
          for (const section of menuData.menu) {
            let sectionTotal = 0;
            for (const item of section.items) {
              sectionTotal += item.time || 0;
            }
            section.totalTime = sectionTotal;
            finalTotal += sectionTotal;
          }
          
          menuData.totalTime = finalTotal;
          console.log(`強制調整完了: ${adjustedDuration}分 → ${finalTotal}分`);
          
          // 最終チェック
          if (finalTotal > duration) {
            throw new Error(`調整不可: 全ての調整を試みましたが、時間制限内に収めることができませんでした（${finalTotal}分 > ${duration}分）`);
          }
        } else {
          // 通常の調整が成功
          menuData.totalTime = adjustedDuration;
          console.log(`メニュー調整完了: ${calculatedTotal}分 → ${adjustedDuration}分`);
        }
      }
    } catch (error: unknown) {
      const validationError = error as Error;
      console.error("メニューデータ検証エラー:", validationError);
      return NextResponse.json(
        { error: `メニューデータの検証に失敗しました: ${validationError.message}` },
        { status: 400 }
      );
    }

    // メニューIDの生成と保存
    const menuId = `menu-${Date.now()}`;
    
    // メニューをRedisとBlobに保存
    try {
      console.log(`[Generate] ℹ️ メニューIDの生成: ${menuId}`);
      await saveMenu(menuId, {
        ...menuData,
        loadLevels: loadLevelsArray, // 変換済みの配列を使用
        duration,
        notes,
        createdAt: new Date().toISOString()
      });
      console.log(`[Generate] ✅ メニューの保存成功: ${menuId}`);
    } catch (error) {
      console.error("メニュー保存エラー:", error);
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
      aiModel,
      loadLevels: loadLevelsArray,
      duration,
      notes,
      menu: menuData.menu,
      totalTime: menuData.totalTime,
      intensity: responseIntensity,
      targetSkills: responseTargetSkills,
      remainingTime: duration - menuData.totalTime,
    });
  } catch (error: unknown) {
    console.error("メニュー生成エラー:", error);
    
    const apiError = error as APIError;
    
    // エラーの種類に応じた適切なレスポンス
    if (apiError.response?.status === 429 || apiError.status === 429) {
      return NextResponse.json(
        { error: "AIサービスのレート制限に達しました。しばらく待ってから再試行してください。" },
        { status: 429 }
      );
    } else if (apiError.response?.status === 401 || apiError.status === 401) {
      return NextResponse.json(
        { error: "AIサービスの認証に失敗しました。システム管理者に連絡してください。" },
        { status: 401 }
      );
    } else if (apiError.message?.includes("超過")) {
      return NextResponse.json(
        { error: apiError.message },
        { status: 400 }
      );
    }
    
    // その他のエラー
    console.error("詳細なエラー情報:", apiError);
    return NextResponse.json(
      { 
        error: "メニュー生成中にエラーが発生しました。再度お試しください。",
        details: process.env.NODE_ENV === "development" ? apiError.message : undefined
      },
      { status: 500 }
    );
  }
}
