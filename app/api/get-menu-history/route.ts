import { NextResponse } from "next/server";
import { getMenuHistory } from "@/lib/kv-storage";

export async function GET() {
  try {
    const menuHistory = await getMenuHistory();
    
    // メニュー履歴が配列でない場合はエラー
    if (!Array.isArray(menuHistory)) {
      console.error("Invalid menu history format:", menuHistory);
      return NextResponse.json(
        { error: "メニュー履歴の形式が不正です" },
        { status: 500 }
      );
    }

    // 各メニューアイテムの必須フィールドを検証
    const validatedHistory = menuHistory.filter(item => {
      const isValid = item && 
        typeof item === 'object' &&
        typeof item.id === 'string' &&
        typeof item.title === 'string' &&
        Array.isArray(item.loadLevels);
      
      if (!isValid) {
        console.warn("Invalid menu history item:", item);
      }
      
      return isValid;
    });

    return NextResponse.json({ 
      menuHistory: validatedHistory,
      count: validatedHistory.length
    });
  } catch (error: any) {
    console.error("メニュー履歴取得エラー:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return NextResponse.json(
      { 
        error: error.message || "メニュー履歴の取得に失敗しました",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}
