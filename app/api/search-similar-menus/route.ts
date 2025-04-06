import { NextResponse } from "next/server";
import { getEmbedding } from "@/lib/embedding";
import { searchSimilarMenus } from "@/lib/upstash-storage";

export async function POST(request: Request) {
  try {
    const { query, duration, openaiApiKey } = await request.json();

    if (!query || !duration || !openaiApiKey) {
      return NextResponse.json(
        { error: "必要なパラメータが不足しています" },
        { status: 400 }
      );
    }

    // クエリの埋め込みベクトルを生成
    const queryEmbedding = await getEmbedding(query, openaiApiKey);

    // Upstash Vector で類似メニューを検索
    const similarMenus = await searchSimilarMenus(queryEmbedding, 5);

    // レスポンスの形式を整形
    const formattedMenus = similarMenus.map(menu => ({
      menuId: menu.id,
      menuData: menu.metadata,
      similarityScore: menu.score
    }));

    return NextResponse.json({ menus: formattedMenus });
  } catch (error) {
    console.error("類似メニュー検索エラー:", error);
    return NextResponse.json(
      { error: "類似メニューの検索中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
