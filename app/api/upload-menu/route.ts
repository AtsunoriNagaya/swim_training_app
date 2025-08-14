import { NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import { saveMenu } from "../../../lib/neon-db";
import { getEmbedding } from "../../../lib/embedding";
import { parsePdf } from "../../../lib/pdf-parser";

/**
 * POSTリクエストでアップロードされたファイルを処理し、
 * CSVの場合は各レコードの埋め込みを、PDFの場合は全体の埋め込みを計算してNeonデータベースに保存します。
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
      
      const metadata = {
        uploadedAt: new Date().toISOString(),
        type: "pdf",
        fileName: file.name,
        fileSize: file.size,
        contentPreview: pdfText.substring(0, 200), // プレビュー用に最初の200文字を保存
        title: file.name.replace('.pdf', ''),
        description: pdfText.substring(0, 100)
      };
      
      await saveMenu(menuId, { content: pdfText }, embedding, metadata);
      return NextResponse.json({ success: true, type: "pdf", id: menuId });
    }

    // CSVファイルの場合の処理（テキスト/その他のファイルもCSVとして処理）
    const text = await file.text();
    const records = parse(text, {
      columns: true,
      skip_empty_lines: true,
    });

    if (records.length === 0) {
      return NextResponse.json({ error: "CSVファイルに有効なデータが含まれていません" }, { status: 400 });
    }

    // 各レコードの埋め込みを計算して保存
    const menuId = file.name;
    const metadata = {
      uploadedAt: new Date().toISOString(),
      type: "csv",
      fileName: file.name,
      fileSize: file.size,
      recordCount: records.length,
      title: file.name.replace('.csv', ''),
      description: `CSVファイル: ${records.length}件のレコード`
    };

    // CSVの内容をテキストとして結合してembeddingを生成
    const csvText = records.map((record: any) => 
      Object.values(record).join(' ')
    ).join(' ');
    
    const embedding = await getEmbedding(csvText, process.env.OPENAI_API_KEY || '');
    
    await saveMenu(menuId, { records, content: csvText }, embedding, metadata);
    return NextResponse.json({ success: true, type: "csv", id: menuId, recordCount: records.length });
  } catch (error) {
    console.error("ファイルアップロードエラー:", error);
    return NextResponse.json(
      { error: "ファイルの処理中にエラーが発生しました" },
      { status: 500 }
    );
  }
}
