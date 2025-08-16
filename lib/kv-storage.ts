import { getEmbedding } from "./embedding";
import {
  saveMenu as neonSaveMenu,
  getMenu as neonGetMenu,
  searchSimilarMenus as neonSearchSimilarMenus,
} from "./neon-db";

// Compatibility wrapper to keep older tests working with the new Neon DB layer

export async function saveMenu(
  menuId: string,
  menuData: any,
  embedding?: number[],
  metadata?: any
) {
  return neonSaveMenu(menuId, menuData, embedding, metadata);
}

export async function getMenu(menuId: string) {
  return neonGetMenu(menuId);
}

// Legacy shape: returns an array of { menuData, similarityScore }
export async function searchSimilarMenus(
  query: string,
  duration: number,
  apiKey?: string
) {
  try {
    if (!apiKey) return [];
    const embedding = await getEmbedding(query, apiKey);
    const results = await neonSearchSimilarMenus(embedding, 5, duration);

    return results.map((r: any) => ({
      menuData: {
        // map common fields from metadata; tests mainly check intensity and totalTime
        title: r?.metadata?.title ?? "Untitled",
        totalTime: Number(r?.metadata?.totalTime ?? r?.metadata?.duration ?? 0),
        intensity: r?.metadata?.intensity ?? "",
        menu: r?.metadata?.menu ?? [],
      },
      similarityScore: r?.similarity ?? 0,
    }));
  } catch (e) {
    // On errors, mirror prior behavior by returning an empty result set
    return [];
  }
}

