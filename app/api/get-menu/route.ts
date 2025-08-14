import { NextResponse } from "next/server";
import { getMenu } from "@/lib/neon-db";

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
    
    // Neonデータベースからメニューデータを取得
    console.log(`[API] 🔄 Calling getMenu function from neon-db`);
    const menuData = await getMenu(menuId);
    
    if (!menuData) {
      console.warn(`[API] 🚨 Menu not found for ID: ${menuId} after checking neon-db`);
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
      // 環境変数の状態を確認
      env: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        nodeEnv: process.env.NODE_ENV
      }
    });
    
    return NextResponse.json({
      error: "Failed to fetch menu data",
      details: process.env.NODE_ENV === "development" ? error.message : undefined
    }, { status: 500 });
  }
}
