import { NextResponse } from "next/server";
import { getMenuHistory } from "@/lib/kv-storage";

export async function GET() {
  try {
    const menuHistory = await getMenuHistory();

    const formattedMenuHistory = menuHistory.map((menu) => ({
      id: menu.id,
      title: menu.title,
      description: menu.description,
      fileType: menu.fileType,
      fileSize: menu.fileSize,
      uploadedAt: menu.uploadedAt,
      fileUrl: menu.fileUrl,
    }));

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
