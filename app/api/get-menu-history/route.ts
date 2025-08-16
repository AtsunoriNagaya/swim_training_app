import { NextResponse } from "next/server";
import { getMenuHistory } from "@/lib/neon-db";

export async function GET() {
  try {
    console.log("[API] メニュー履歴取得開始");
    const menuHistory = await getMenuHistory();
    console.log("[API] 取得したメニュー数:", menuHistory.length);

    const formattedMenuHistory = menuHistory.map((menu) => ({
      id: menu.id,
      title: menu.title,
      description: menu.description,
      createdAt: menu.createdAt,
      // AI生成メニューにはfileTypeなどのフィールドはない
    }));

    console.log("[API] フォーマット済みメニュー履歴:", formattedMenuHistory);

    return NextResponse.json({
      menuHistory: formattedMenuHistory,
      count: formattedMenuHistory.length,
    });
  } catch (error: any) {
    console.error("メニュー履歴取得エラー:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });

    return NextResponse.json(
      {
        error: error.message || "メニュー履歴の取得に失敗しました",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
