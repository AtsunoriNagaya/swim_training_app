import { NextResponse } from "next/server";
import { getMenu } from "@/lib/kv-storage";
import { Redis } from '@upstash/redis';
import { getJsonFromBlob } from '@/lib/blob-storage';

// Redis クライアントの初期化 (Vercel KV または Upstash Redis を想定)
let redis: Redis;
try {
  // Vercel KV またはカスタム名の環境変数を優先
  const redisUrl = process.env.KV_REST_API_URL || process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!redisUrl || !redisToken) {
    throw new Error("Missing Redis environment variables (KV_REST_API_URL/REDIS_URL/UPSTASH_REDIS_REST_URL and KV_REST_API_TOKEN/UPSTASH_REDIS_REST_TOKEN)");
  }

  redis = new Redis({
    url: redisUrl,
    token: redisToken,
  });
  console.log(`[API] ✅ Redis クライアント初期化成功 (URL: ${redisUrl.substring(0, 20)}...)`);
} catch (error) {
  console.error("[API] 🚨 Redis 初期化エラー:", error);
  // フォールバック: インメモリのスタブを使用
  redis = {
    get: async () => null,
    set: async () => "OK",
  } as unknown as Redis;
}

export async function GET(request: Request) {
  try {
    // デバッグ情報の強化: リクエスト情報を詳細に記録
    console.log(`[API] Request URL: ${request.url}`);
    const { searchParams } = new URL(request.url);
    const menuId = searchParams.get("id");

    // リクエストパラメータの検証
    if (!menuId) {
      console.warn("[API] 🚨 API call without menu ID");
      return NextResponse.json({ error: "Menu ID is required" }, { status: 400 });
    }

    console.log(`[API] 🔍 Fetching menu with ID: ${menuId}`);
    
    // getMenu関数を使用してメニューデータを取得 (kv-storage.tsでロジックを統一)
    console.log(`[API] 🔄 Calling getMenu function from kv-storage`);
    const menuData = await getMenu(menuId);
    
    if (!menuData) {
      console.warn(`[API] 🚨 Menu not found for ID: ${menuId} after checking kv-storage`);
      return NextResponse.json({
        error: "Menu not found",
        menuId: menuId
      }, { status: 404 });
    }

    console.log(`[API] ✅ Successfully retrieved menu for ID: ${menuId}`);
    return NextResponse.json(menuData);
  } catch (error: any) {
    // 詳細なエラーログ
    console.error("[API] 🚨 Error fetching menu:", {
      error: error.message,
      stack: error.stack,
      name: error.name,
      // 環境変数の状態を確認（RedisとBlobのトークンが設定されているか、値は表示しない）
      env: {
        hasUpstashRedisUrl: !!process.env.UPSTASH_REDIS_REST_URL,
        hasUpstashRedisToken: !!process.env.UPSTASH_REDIS_REST_TOKEN,
        hasBlobToken: !!process.env.BLOB_READ_WRITE_TOKEN
      }
    });
    
    return NextResponse.json({
      error: "Failed to fetch menu data",
      details: process.env.NODE_ENV === "development" ? error.message : undefined
    }, { status: 500 });
  }
}
