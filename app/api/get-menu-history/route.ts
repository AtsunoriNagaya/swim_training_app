import { NextResponse } from "next/server";
import { getMenuHistory } from "@/lib/kv-storage";

export async function GET() {
  try {
    const menuHistory = await getMenuHistory();
    return NextResponse.json({ menuHistory });
  } catch (error: any) {
    console.error("メニュー履歴取得エラー:", error);
    return NextResponse.json(
      { error: error.message || "メニュー履歴の取得に失敗しました" },
      { status: 500 }
    );
  }
}
