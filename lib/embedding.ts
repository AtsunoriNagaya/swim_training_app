import OpenAI from "openai";

export async function getEmbedding(text: string, apiKey: string): Promise<number[]> {
  const openai = new OpenAI({
    apiKey: apiKey,
  });

  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: text,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error("Embedding生成エラー:", error);
    throw new Error("テキストのEmbedding生成に失敗しました");
  }
}

// コサイン類似度を計算する関数
export function cosineSimilarity(vec1: number[], vec2: number[]): number {
  const dotProduct = vec1.reduce((acc, val, i) => acc + val * vec2[i], 0);
  const norm1 = Math.sqrt(vec1.reduce((acc, val) => acc + val * val, 0));
  const norm2 = Math.sqrt(vec2.reduce((acc, val) => acc + val * val, 0));
  return dotProduct / (norm1 * norm2);
}

// メニューテキストを生成する関数
export function generateMenuText(menu: any): string {
  const parts = [];
  
  if (menu.title) {
    parts.push(menu.title);
  }
  
  if (menu.description) {
    parts.push(menu.description);
  }
  
  if (menu.notes) {
    parts.push(menu.notes);
  }

  if (menu.loadLevels && Array.isArray(menu.loadLevels)) {
    parts.push(`負荷レベル: ${menu.loadLevels.join(', ')}`);
  }

  if (menu.duration) {
    parts.push(`時間: ${menu.duration}分`);
  }

  return parts.join(' ');
}
