import { NextResponse } from "next/server";
import { ChromaClient, OpenAIEmbeddingFunction } from "chromadb";

export async function GET() {
  try {
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      throw new Error("OPENAI_API_KEYが設定されていません");
    }

    const chromaClient = new ChromaClient();
    const embedder = new OpenAIEmbeddingFunction({
      openai_api_key: openaiApiKey,
    });

    const collection = await chromaClient.getCollection({
      name: "swim_menus",
      embeddingFunction: embedder,
    });

    const results = await collection.get({
      include: ["documents", "metadatas"] as any,
    });

    const menuHistory = results.documents?.map((doc, index) => {
      try {
        const metadata = results.metadatas?.[index] || {};
        const parsed = JSON.parse(doc || "{}");
        return {
          id: results.ids[index],
          ...parsed,
          ...metadata,
        };
      } catch (e) {
        console.error("JSONパースエラー:", e);
        return null;
      }
    }).filter(Boolean);

    return NextResponse.json({ menuHistory });
  } catch (error: any) {
    console.error("メニュー履歴取得エラー:", error);
    return NextResponse.json(
      { error: error.message || "メニュー履歴の取得に失敗しました" },
      { status: 500 }
    );
  }
}
