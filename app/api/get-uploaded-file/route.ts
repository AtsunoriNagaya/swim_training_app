import { NextRequest, NextResponse } from "next/server";
import { getUploadedFile } from "@/lib/neon-db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const menuId = searchParams.get("id");

    if (!menuId) {
      return NextResponse.json({ 
        success: false,
        error: "Menu ID is required" 
      }, { status: 400 });
    }

    const menu = await getUploadedFile(menuId);
    
    if (!menu) {
      return NextResponse.json({
        success: false,
        error: "メニューが見つかりません"
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      menu: menu
    });
  } catch (error: any) {
    console.error("アップロードファイル取得エラー:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });

    return NextResponse.json(
      {
        success: false,
        error: error.message || "アップロードファイルの取得に失敗しました",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
