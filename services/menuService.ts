import { PROMPT_TEMPLATES, convertLoadLevels } from "@/lib/ai-config";
import { getSelectedAIModel } from "@/lib/ai-clients";
import { cleanAIResponse, validateMenuData, calculateMenuTimes } from "@/lib/ai-response-processor";
import { getEmbedding } from "@/lib/embedding";
import { saveMenu } from "@/lib/neon-db";
import type { GeneratedMenuData } from "@/types/menu";
import { getRelevantMenusText } from "./ragService";

type GenerateParams = {
  aiModel: string;
  apiKey: string;
  loadLevelsArray: string[];
  duration: number;
  notes?: unknown;
  useRAG?: boolean;
  openaiApiKey?: string;
};

export async function generateMenu({
  aiModel,
  apiKey,
  loadLevelsArray,
  duration,
  notes,
  useRAG,
  openaiApiKey,
}: GenerateParams): Promise<{ menuId: string; menu: GeneratedMenuData; saved: boolean }> {
  // Prompts
  const systemPrompt = PROMPT_TEMPLATES.system(duration);
  const loadLevelStr = convertLoadLevels(loadLevelsArray);

  let relevantMenus = "";
  if (useRAG && openaiApiKey) {
    relevantMenus = await getRelevantMenusText(loadLevelsArray, duration, notes, openaiApiKey);
  }

  const userPrompt = PROMPT_TEMPLATES.user(loadLevelStr, duration, notes ? String(notes) : undefined, relevantMenus || undefined);

  // AI call
  const selectedModel = getSelectedAIModel(aiModel);
  const raw = await selectedModel.generate(userPrompt, systemPrompt, apiKey);

  // Sanitize and parse
  const cleanedText = cleanAIResponse(raw);
  let menuData = JSON.parse(cleanedText) as GeneratedMenuData;

  // Defaults and validation
  if (!menuData.title) {
    menuData.title = `${loadLevelStr}の${duration}分トレーニングメニュー`;
  }
  if (!validateMenuData(menuData)) {
    throw new Error("AIモデルの応答が有効なメニューデータ形式ではありません");
  }

  // Time calculation and checks
  menuData = calculateMenuTimes(menuData);
  if (menuData.totalTime > duration) {
    console.warn(`生成されたメニューの合計時間(${menuData.totalTime}分)が指定時間(${duration}分)を超過しています`);
    const adjusted = adjustToDuration(menuData, duration);
    menuData = calculateMenuTimes(adjusted);
  }

  // Persist
  const menuId = `menu_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  let saved = false;

  try {
    const menuText = `${menuData.title} ${menuData.menu.map(section => section.items.map(item => item.description).join(' ')).join(' ')}`;

    let embeddingApiKey: string | undefined;
    if (useRAG && openaiApiKey) embeddingApiKey = openaiApiKey;
    else if (aiModel === "openai") embeddingApiKey = apiKey;

    let embedding: number[] | undefined;
    if (embeddingApiKey) {
      try {
        embedding = await getEmbedding(menuText, embeddingApiKey);
      } catch (e) {
        console.warn("Embedding生成に失敗しましたが保存は継続します", e);
      }
    }

    const metadata = {
      title: menuData.title,
      description: `AI生成メニュー: ${loadLevelStr} ${duration}分`,
      loadLevels: loadLevelsArray.join(','),
      duration: String(duration),
      notes: notes ? String(notes) : "",
      totalTime: String(menuData.totalTime),
      intensity: menuData.intensity || "",
      targetSkills: menuData.targetSkills || [],
      aiModel,
      createdAt: new Date().toISOString(),
    } as const;

    const saveData = {
      ...menuData,
      menuId,
      createdAt: new Date().toISOString(),
      loadLevels: loadLevelsArray,
      duration,
      notes: notes ? String(notes) : "",
      aiModel,
    } as any;

    await saveMenu(menuId, saveData, embedding, metadata);
    saved = true;
  } catch (e) {
    console.warn("メニュー保存時に問題が発生しましたが、生成は成功しています", e);
  }

  return { menuId, menu: menuData, saved };
}

// 時間超過の自動調整
export function adjustToDuration(menuData: GeneratedMenuData, duration: number): GeneratedMenuData {
  // 深い変更を避けるため、必要最小限の調整戦略:
  // 1) セクション優先度に従い sets を減らす（>1 のとき）
  // 2) まだ超過なら末尾アイテムを削除（各セクションで1つは残す）
  // 3) まだ超過なら非必須セクションを削除（Down → Drill → Kick → Pull → W-up）
  // 4) それでも超過なら Main の sets をできる範囲で減らす

  const priorityNames = ["Down", "Drill", "Kick", "Pull", "W-up", "Warm", "Warm-up", "Main"]; // 名称ゆらぎを少し吸収
  const sectionPriority = (name: string): number => {
    const idx = priorityNames.findIndex((n) => name.includes(n));
    return idx === -1 ? priorityNames.length - 1 : idx; // 未知は最後（Main寄り）
  };

  // 作業用コピー
  let working: GeneratedMenuData = JSON.parse(JSON.stringify(menuData));

  const recompute = () => {
    working = calculateMenuTimes(working);
    return working.totalTime;
  };

  // 安全弁: 無限ループ防止
  let guard = 0;
  const maxIterations = 200;

  const sortSectionsByTrimOrder = () =>
    working.menu
      .map((s, i) => ({ s, i, p: sectionPriority(s.name) }))
      .sort((a, b) => a.p - b.p)
      .map((x) => x.i);

  // 目標時間以下になるまで調整
  while (recompute() > duration && guard++ < maxIterations) {
    let changed = false;

    // 1) sets を減らす（優先度順、末尾アイテムから）
    for (const si of sortSectionsByTrimOrder()) {
      const section = working.menu[si];
      for (let ii = section.items.length - 1; ii >= 0; ii--) {
        const item = section.items[ii] as any;
        if (typeof item.sets === "number" && item.sets > 1) {
          item.sets = Math.max(1, item.sets - 1);
          changed = true;
          break;
        }
      }
      if (changed) break;
    }
    if (changed && recompute() <= duration) break;

    // 2) 末尾アイテムを削除（各セクション1つは残す）
    if (!changed) {
      for (const si of sortSectionsByTrimOrder()) {
        const section = working.menu[si];
        if (section.items.length > 1) {
          section.items.pop();
          changed = true;
          break;
        }
      }
      if (changed && recompute() <= duration) break;
    }

    // 3) 非必須セクションを削除（Main を除外）
    if (!changed) {
      for (const si of sortSectionsByTrimOrder()) {
        const section = working.menu[si];
        const name = section.name || "";
        if (!name.includes("Main") && working.menu.length > 1) {
          working.menu.splice(si, 1);
          changed = true;
          break;
        }
      }
      if (changed && recompute() <= duration) break;
    }

    // 4) 最後の手段: Main セクションの sets をさらに減らす
    if (!changed) {
      const mainIndex = working.menu.findIndex((s) => (s.name || "").includes("Main"));
      if (mainIndex !== -1) {
        const section = working.menu[mainIndex];
        for (let ii = section.items.length - 1; ii >= 0; ii--) {
          const item = section.items[ii] as any;
          if (typeof item.sets === "number" && item.sets > 1) {
            item.sets = Math.max(1, item.sets - 1);
            changed = true;
            break;
          }
        }
      }
      if (changed && recompute() <= duration) break;
    }

    // もう何も変えられない場合は終了
    if (!changed) break;
  }

  return working;
}

