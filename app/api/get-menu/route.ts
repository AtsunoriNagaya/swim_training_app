import { NextResponse } from "next/server";
import { getMenu } from "@/lib/kv-storage";
import { kv } from '@vercel/kv';
import { getJsonFromBlob } from '@/lib/blob-storage';

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
    
    // インデックスからメニューのメタデータを取得
    try {
      console.log(`[API] 🔄 Attempting to get index URL from KV`);
      const indexData = await kv.get<string>('menu:indexUrl');
      
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
          
          const menuEntry = indexJson.menus.find((menu: any) => menu.id === menuId);
          
          if (menuEntry) {
            console.log(`[API] ✅ Found menu metadata in index for ID: ${menuId}`);
            
            // フルデータの取得を試みる
            console.log(`[API] 🔄 Attempting to get full menu data from KV/Blob`);
            const menuData = await getMenu(menuId);
            
            if (menuData) {
              console.log(`[API] ✅ Successfully retrieved full menu data for ID: ${menuId}`);
              return NextResponse.json(menuData);
            } else {
              // Blobからのデータ取得に失敗した場合でも、メタデータだけ返す
              console.warn(`[API] ⚠️ Failed to get full menu data, returning metadata only for ID: ${menuId}`);
              return NextResponse.json({
                id: menuId,
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
    
    // インデックスからも見つからない場合は最後の手段としてgetMenu()を呼ぶ
    console.log(`[API] 🔄 Index lookup failed, trying direct getMenu() as fallback`);
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
      // 環境変数の状態を確認（KVとBlobのトークンが設定されているか、値は表示しない）
      env: {
        hasKvToken: !!process.env.KV_REST_API_TOKEN,
        hasKvUrl: !!process.env.KV_REST_API_URL,
        hasBlobToken: !!process.env.BLOB_READ_WRITE_TOKEN
      }
    });
    
    return NextResponse.json({
      error: "Failed to fetch menu data",
      details: process.env.NODE_ENV === "development" ? error.message : undefined
    }, { status: 500 });
  }
}
