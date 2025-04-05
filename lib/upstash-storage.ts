import { Redis } from "@upstash/redis";

const redisUrl = (process.env.UPSTASH_REDIS_URL || process.env.REDIS_URL)?.replace("rediss://", "https://");
const redisToken = process.env.UPSTASH_REDIS_TOKEN || process.env.KV_REST_API_TOKEN;

if (!redisUrl || !redisToken) {
  throw new Error("Missing Upstash Redis configuration in environment variables");
}

const redis = new Redis({
  url: redisUrl,
  token: redisToken,
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
  const data = { embedding, ...metadata };
  const value = JSON.stringify(data); // 文字列化
  await redis.set(key, value as string);
}

/**
 * 指定したメニューIDの埋め込み情報を取得します。
 * @param menuId メニューのID
 */
export async function getMenuEmbedding(menuId: string): Promise<any> {
  const key = `menu:${menuId}`;
  const result = await redis.get(key) as string | null;
  return result ? JSON.parse(result) : null;
}
