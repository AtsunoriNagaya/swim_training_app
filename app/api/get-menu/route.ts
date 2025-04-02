import { NextResponse } from "next/server";
import { ChromaClient, OpenAIEmbeddingFunction } from "chromadb";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const menuId = searchParams.get("id");

    if (!menuId) {
      return NextResponse.json({ error: "Menu ID is required" }, { status: 400 });
    }

    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      throw new Error("OPENAI_API_KEY is not set");
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
      ids: [menuId],
      include: ["documents", "metadatas"] as any,
    });

    if (!results || !results.documents || results.documents.length === 0) {
      return NextResponse.json({ error: "Menu not found" }, { status: 404 });
    }

    const menuData = JSON.parse(results.documents[0] || "{}");
    return NextResponse.json(menuData);
  } catch (error: any) {
    console.error("Error fetching menu:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
