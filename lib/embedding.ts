import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * テキストをベクトル化する
 */
export async function getEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });

    return response.data[0].embedding;
  } catch (error) {
    console.error('[Embedding] Error generating embedding:', error);
    throw error;
  }
}

/**
 * 2つのベクトル間のコサイン類似度を計算する
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  const dotProduct = vecA.reduce((acc, val, i) => acc + val * vecB[i], 0);
  const normA = Math.sqrt(vecA.reduce((acc, val) => acc + val * val, 0));
  const normB = Math.sqrt(vecB.reduce((acc, val) => acc + val * val, 0));
  return dotProduct / (normA * normB);
}

/**
 * メニューデータからベクトル化用のテキストを生成する
 */
export function generateMenuText(menuData: any): string {
  const parts = [
    menuData.title || '',
    menuData.notes || '',
    ...(menuData.targetSkills || []),
    menuData.intensity || '',
  ];

  // メニューの各セクションの情報を追加
  if (menuData.menu && Array.isArray(menuData.menu)) {
    menuData.menu.forEach((section: any) => {
      parts.push(section.name || '');
      
      if (section.items && Array.isArray(section.items)) {
        section.items.forEach((item: any) => {
          parts.push(item.description || '');
          if (item.equipment) parts.push(item.equipment);
          if (item.notes) parts.push(item.notes);
        });
      }
    });
  }

  return parts.filter(Boolean).join(' ');
}
