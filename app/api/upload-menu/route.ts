import { NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import { storeMenuEmbedding } from "../../../lib/upstash-storage";
import { getEmbedding } from "../../../lib/embedding";
import { parsePdf } from "../../../lib/pdf-parser";

/**
 * POSTリクエストでアップロードされたファイルを処理し、
 * CSVの場合は各レコードの埋め込みを、PDFの場合は全体の埋め込みを計算してUpstash for Redisに保存します。
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "ファイルがアップロードされていません" }, { status: 400 });
    }

    // PDFファイルの場合の処理
    if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
      const arrayBuffer = await file.arrayBuffer();
      // parsePDFはArrayBufferまたはBufferを受け取ると仮定
const pdfText = await parsePdf(Buffer.from(arrayBuffer));
      if (!pdfText) {
        return NextResponse.json({ error: "PDFの解析に失敗しました" }, { status: 500 });
      }
      const embedding = await getEmbedding(pdfText, process.env.OPENAI_API_KEY || '');
      // PDFの場合、ファイル名をIDとして利用
      const menuId = file.name;
      await storeMenuEmbedding(menuId, embedding, { uploadedAt: new Date().toISOString(), type: "pdf" });
      return NextResponse.json({ success: true, type: "pdf", id: menuId });
    }

    // CSVファイルの場合の処理（テキスト/その他のファイルもCSVとして処理）
    const text = await file.text();
    const records = parse(text, { columns: true, skip_empty_lines: true });

    let count = 0;
    for (const record of records) {
      // CSVはidとcontentカラムを持つことを前提とする
      const menuId = record.id || `${Date.now()}-${Math.random()}`;
      const content = record.content;
      if (!content) continue;
      const embedding = await getEmbedding(content, process.env.OPENAI_API_KEY || '');
      await storeMenuEmbedding(menuId, embedding, { uploadedAt: new Date().toISOString(), type: "csv" });
      count++;
    }

    return NextResponse.json({ success: true, type: "csv", count });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
