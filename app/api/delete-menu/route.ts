import { NextResponse } from "next/server";
import { deleteMenu } from "@/lib/neon-db";

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const menuId = searchParams.get("id");

    if (!menuId) {
      console.warn("[API] メニューID未指定");
      return NextResponse.json({ 
        success: false,
        error: "Menu ID is required" 
      }, { status: 400 });
    }

    console.log(`[API] メニュー削除開始: ${menuId}`);
    const result = await deleteMenu(menuId);
    
    if (result.success) {
      console.log(`[API] メニュー ${menuId} を削除しました`);
      return NextResponse.json({
        success: true,
        message: `メニュー ${menuId} を削除しました`
      });
    } else {
      return NextResponse.json({
        success: false,
        error: "メニューの削除に失敗しました"
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error("メニュー削除エラー:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });

    return NextResponse.json(
      {
        success: false,
        error: error.message || "メニューの削除に失敗しました",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
