import { NextResponse } from "next/server";
import { deleteTestMenus } from "@/lib/neon-db";

export async function DELETE() {
  try {
    console.log("[API] テストデータ削除開始");
    const deletedCount = await deleteTestMenus();
    
    console.log(`[API] テストデータ ${deletedCount} 件を削除しました`);

    return NextResponse.json({
      success: true,
      deletedCount,
      message: `${deletedCount} 件のテストデータを削除しました`
    });
  } catch (error: any) {
    console.error("テストデータ削除エラー:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });

    return NextResponse.json(
      {
        success: false,
        error: error.message || "テストデータの削除に失敗しました",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
