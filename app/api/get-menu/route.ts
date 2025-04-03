import { NextResponse } from "next/server";
import { getMenu } from "@/lib/kv-storage";
import { Redis } from '@upstash/redis';
import { getJsonFromBlob } from '@/lib/blob-storage';

// Upstash Redis クライアントの初期化（エラーハンドリング付き）
let redis: Redis;
try {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL || '',
    token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
  });
  console.log("[API] ✅ Redisクライアント初期化成功");
} catch (error) {
  console.error("[API] 🚨 Redis初期化エラー:", error);
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
    
    // 直接Blobストレージからメニューデータを取得を試みる
    // パスが予測可能な場合は直接アクセスを試みる
    console.log(`[API] 🔄 Attempting direct Blob access for menu: ${menuId}`);
    try {
      const directUrl = `https://jf4nttkr91b0.blob.vercel-storage.com/menus/${menuId}.json`;
      console.log(`[API] 🔍 Trying direct URL: ${directUrl}`);
      const directMenuData = await getJsonFromBlob(directUrl);
      
      if (directMenuData) {
        console.log(`[API] ✅ Successfully retrieved menu data directly from Blob for ID: ${menuId}`);
        return NextResponse.json(directMenuData);
      } else {
        console.log(`[API] ℹ️ Direct Blob access failed, falling back to index lookup`);
      }
    } catch (directError) {
      console.error(`[API] Direct Blob access error:`, directError);
    }
    
    // インデックスからメニューのメタデータを取得
    try {
      console.log(`[API] 🔄 Attempting to get index URL from Redis`);
      const indexData = await redis.get<string>('menu:indexUrl');
      
      if (!indexData) {
        console.warn(`[API] ⚠️ No index URL found in KV store`);
      } else {
        console.log(`[API] ✅ Found index URL in KV: ${indexData?.substring(0, 50)}...`);
        
        const indexJson = await getJsonFromBlob(indexData) as any;
        console.log(`[API] 🔄 Attempting to parse index JSON from Blob`);
        
        if (!indexJson) {
          console.warn(`[API] ⚠️ Failed to get or parse index JSON from Blob`);
        } else if (!indexJson.menus) {
          console.warn(`[API] ⚠️ Index JSON does not contain menus array`);
        } else {
          console.log(`[API] ✅ Successfully parsed index JSON with ${indexJson.menus.length} menus`);
          
          // メニューIDの検索時に部分一致も考慮
          const menuEntry = indexJson.menus.find((menu: any) => menu.id === menuId || menu.id.includes(menuId) || menuId.includes(menu.id));
          
          if (menuEntry) {
            console.log(`[API] ✅ Found menu metadata in index for ID: ${menuEntry.id}`);
            
            // フルデータの取得を試みる
            console.log(`[API] 🔄 Attempting to get full menu data from KV/Blob`);
            const menuData = await getMenu(menuEntry.id);
            
            if (menuData) {
              console.log(`[API] ✅ Successfully retrieved full menu data for ID: ${menuEntry.id}`);
              return NextResponse.json(menuData);
            } else if (menuEntry.menuDataUrl) {
              // メニューデータのURLが直接利用可能な場合
              console.log(`[API] 🔄 Trying direct access to menuDataUrl: ${menuEntry.menuDataUrl}`);
              const directData = await getJsonFromBlob(menuEntry.menuDataUrl);
              
              if (directData) {
                console.log(`[API] ✅ Successfully retrieved menu data from direct URL`);
                return NextResponse.json(directData);
              } else {
                // Blobからのデータ取得に失敗した場合でも、メタデータだけ返す
                console.warn(`[API] ⚠️ Failed to get full menu data, returning metadata only for ID: ${menuEntry.id}`);
                return NextResponse.json({
                  id: menuEntry.id,
                  metadata: menuEntry.metadata,
                  _partial: true
                });
              }
            } else {
              // Blobからのデータ取得に失敗した場合でも、メタデータだけ返す
              console.warn(`[API] ⚠️ Failed to get full menu data, returning metadata only for ID: ${menuEntry.id}`);
              return NextResponse.json({
                id: menuEntry.id,
                metadata: menuEntry.metadata,
                _partial: true
              });
            }
          }
        }
      }
    } catch (error) {
      console.error(`[API] Error accessing index data:`, error);
    }
    
    // 最後の手段：別の保存形式を試みる (index-{hash}.json形式)
    try {
      console.log(`[API] 🔄 Trying alternative index format`);
      const alternativeIndexUrl = `https://jf4nttkr91b0.blob.vercel-storage.com/index-GbD0hEYwy4WxrAiqKXA60RUjTk4JM6.json`;
      
      console.log(`[API] 🔍 Trying alternative index URL: ${alternativeIndexUrl}`);
      const altIndexJson = await getJsonFromBlob(alternativeIndexUrl) as any;
      
      if (altIndexJson && altIndexJson.menus) {
        console.log(`[API] ✅ Successfully parsed alternative index JSON with ${altIndexJson.menus.length} menus`);
        
        // メニューIDの検索時に部分一致も考慮
        const menuEntry = altIndexJson.menus.find((menu: any) => menu.id === menuId || menu.id.includes(menuId) || menuId.includes(menu.id));
        
        if (menuEntry) {
          console.log(`[API] ✅ Found menu in alternative index for ID: ${menuEntry.id}`);
          
          if (menuEntry.menuDataUrl) {
            const menuData = await getJsonFromBlob(menuEntry.menuDataUrl);
            if (menuData) {
              console.log(`[API] ✅ Retrieved menu data from alternative index URL`);
              return NextResponse.json(menuData);
            }
          }
          
          // メタデータだけでも返す
          return NextResponse.json({
            id: menuEntry.id,
            metadata: menuEntry.metadata,
            _partial: true,
            _source: "alternative_index"
          });
        }
      }
    } catch (altError) {
      console.error(`[API] Alternative index access error:`, altError);
    }
    
    // インデックスからも見つからない場合は最後の手段としてgetMenu()を呼ぶ
    console.log(`[API] 🔄 All index lookups failed, trying direct getMenu() as final fallback`);
    const menuData = await getMenu(menuId);
    
    if (!menuData) {
      console.warn(`[API] 🚨 Menu not found for ID: ${menuId}`);
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
