import { getEmbedding } from "@/lib/embedding";
import { searchSimilarMenus } from "@/lib/neon-db";

export async function getRelevantMenusText(
  loadLevelsArray: string[],
  duration: number,
  notes: unknown,
  openaiApiKey: string
): Promise<string> {
  try {
    const queryText = loadLevelsArray.join(" ") + " " + duration + "分";
    const notesText = notes ? " " + String(notes) : "";

    const queryEmbedding = await getEmbedding(queryText + notesText, openaiApiKey);
    const results = await searchSimilarMenus(queryEmbedding, 5, duration);

    if (!results || results.length === 0) return "";

    return results
      .map((scoredMenu: { id: string; metadata: any; similarity: number }) => {
        try {
          const metadata = scoredMenu.metadata;
          if (!metadata) return "";
          const title = metadata.title || "Untitled";
          const desc = metadata.description || "";
          const time = metadata.totalTime || metadata.duration || "";
          const sim = scoredMenu.similarity?.toFixed?.(2) ?? "";
          return `タイトル: ${title} / 概要: ${desc} / 合計時間: ${time} / 類似度: ${sim}`;
        } catch {
          return "";
        }
      })
      .filter(Boolean)
      .join("\n");
  } catch (e) {
    console.warn("RAG 検索で問題が発生しました。メニュー生成は継続します。", e);
    return "";
  }
}

