import { NextResponse } from "next/server";
import { getMenu } from "@/lib/kv-storage";

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
