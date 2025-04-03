import { NextResponse } from "next/server";
import { getMenu } from "@/lib/kv-storage";
import { kv } from '@vercel/kv';
import { getJsonFromBlob } from '@/lib/blob-storage';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const menuId = searchParams.get("id");

    // リクエストパラメータの検証
    if (!menuId) {
      console.warn("API call without menu ID");
      return NextResponse.json({ error: "Menu ID is required" }, { status: 400 });
    }

    console.log(`[API] Fetching menu: ${menuId}`);
    
    // インデックスからメニューのメタデータを取得
    try {
      const indexData = await kv.get<string>('menu:indexUrl');
      if (indexData) {
        const indexJson = await getJsonFromBlob(indexData) as any;
        if (indexJson && indexJson.menus) {
          const menuEntry = indexJson.menus.find((menu: any) => menu.id === menuId);
          
          if (menuEntry) {
            console.log(`[API] Found menu metadata in index: ${menuId}`);
            
            // フルデータの取得を試みる
            const menuData = await getMenu(menuId);
            
            if (menuData) {
              console.log(`[API] Successfully retrieved full menu data: ${menuId}`);
              return NextResponse.json(menuData);
            } else {
              // Blobからのデータ取得に失敗した場合でも、メタデータだけ返す
              console.warn(`[API] Failed to get full menu data, returning metadata only: ${menuId}`);
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
    const menuData = await getMenu(menuId);
    
    if (!menuData) {
      console.warn(`[API] Menu not found: ${menuId}`);
      return NextResponse.json({
        error: "Menu not found",
        menuId: menuId
      }, { status: 404 });
    }

    console.log(`Successfully retrieved menu: ${menuId}`);
    return NextResponse.json(menuData);
  } catch (error: any) {
    // 詳細なエラーログ
    console.error("Error fetching menu:", {
      error: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return NextResponse.json({
      error: "Failed to fetch menu data",
      details: process.env.NODE_ENV === "development" ? error.message : undefined
    }, { status: 500 });
  }
}
