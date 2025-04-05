import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";
import { getEmbedding, cosineSimilarity } from "@/lib/embedding";

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

    // KVストアから全てのメニューを取得
    const allMenus = await kv.hgetall("menus");
    if (!allMenus) {
      return NextResponse.json({ menus: [] });
    }

    // 類似度計算とソート
    const menuEntries = Object.entries(allMenus);
    const similarMenus = await Promise.all(
      menuEntries.map(async ([id, menu]: [string, any]) => {
        const menuEmbedding = menu.embedding;
        if (!menuEmbedding) return null;

        // コサイン類似度を計算
        const similarity = cosineSimilarity(queryEmbedding, menuEmbedding);

        return {
          menuId: id,
          menuData: menu,
          similarityScore: similarity,
        };
      })
    );

    // nullを除外し、類似度でソート
    const validMenus = similarMenus
      .filter((menu) => menu !== null)
      .sort((a, b) => b!.similarityScore - a!.similarityScore)
      .slice(0, 5); // 上位5件を返す

    return NextResponse.json({ menus: validMenus });
  } catch (error) {
    console.error("類似メニュー検索エラー:", error);
    return NextResponse.json(
      { error: "類似メニューの検索中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
