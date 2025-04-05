import { Redis } from "@upstash/redis";

if (!process.env.UPSTASH_REDIS_URL || !process.env.UPSTASH_REDIS_TOKEN) {
  throw new Error("Missing Upstash Redis configuration in environment variables");
}

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_URL,
  token: process.env.UPSTASH_REDIS_TOKEN,
});

/**
 * 指定したメニューIDで埋め込みデータとメタ情報を保存します。
 * @param menuId メニューのID
 * @param embedding 計算された埋め込み配列
 * @param metadata その他のメタ情報
 */
export async function storeMenuEmbedding(
  menuId: string,
  embedding: number[],
  metadata: Record<string, any> = {}
) {
  const key = `menu:${menuId}`;
  const value = JSON.stringify({ embedding, ...metadata });
  await redis.set(key, value);
}

/**
 * 指定したメニューIDの埋め込み情報を取得します。
 * @param menuId メニューのID
 */
export async function getMenuEmbedding(menuId: string): Promise<any> {
  const key = `menu:${menuId}`;
  const result = await redis.get(key);
  return result ? JSON.parse(result) : null;
}
