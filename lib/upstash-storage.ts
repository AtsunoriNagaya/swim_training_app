import { Redis } from "@upstash/redis";
import { Index } from "@upstash/vector";

const redisUrl = (process.env.UPSTASH_REDIS_URL || process.env.REDIS_URL)?.replace("rediss://", "https://");
const redisToken = process.env.UPSTASH_REDIS_TOKEN || process.env.KV_REST_API_TOKEN;
const vectorUrl = process.env.UPSTASH_VECTOR_URL;
const vectorToken = process.env.UPSTASH_VECTOR_TOKEN;

if (!redisUrl || !redisToken) {
  throw new Error("Missing Upstash Redis configuration in environment variables");
}

if (!vectorUrl || !vectorToken) {
  throw new Error("Missing Upstash Vector configuration in environment variables");
}

const redis = new Redis({
  url: redisUrl,
  token: redisToken,
});

const vectorIndex = new Index({
  url: vectorUrl,
  token: vectorToken,
});

/**
 * メニューの情報をベクトルとメタデータとして保存します。
 * @param menuId メニューのID
 * @param vector 計算された埋め込みベクトル
 * @param metadata メタデータ（タイトル、説明など）
 */
export async function storeMenuVector(
  menuId: string,
  vector: number[],
  metadata: Record<string, any> = {}
) {
  // Vectorインデックスにベクトルを保存
  await vectorIndex.upsert([
    {
      id: menuId,
      vector,
      metadata,
    },
  ]);

  // Redisにメタデータを保存（高速な参照用）
  const key = `menu:${menuId}`;
  await redis.set(key, JSON.stringify(metadata));
}

/**
 * 指定したメニューIDのメタデータを取得します。
 * @param menuId メニューのID
 */
export async function getMenuMetadata(menuId: string): Promise<Record<string, any> | null> {
  const key = `menu:${menuId}`;
  const result = await redis.get(key) as string | null;
  return result ? JSON.parse(result) : null;
}

/**
 * クエリベクトルに最も類似したメニューを検索します。
 * @param queryVector 検索クエリのベクトル
 * @param topK 取得する結果の数
 */
export async function searchSimilarMenus(
  queryVector: number[],
  topK: number = 5
): Promise<Array<{ id: string; score: number; metadata: Record<string, any> }>> {
  const results = await vectorIndex.query({
    vector: queryVector,
    topK,
    includeMetadata: true,
  });

  return results.map(result => ({
    id: String(result.id), // idを確実に文字列に変換
    score: result.score,
    metadata: result.metadata as Record<string, any>,
  }));
}

/**
 * メニューのベクトルを削除します。
 * @param menuId メニューのID
 */
export async function deleteMenuVector(menuId: string): Promise<void> {
  await vectorIndex.delete([menuId]);
  const key = `menu:${menuId}`;
  await redis.del(key);
}
