import { NextResponse } from "next/server"
import { uploadFileToBlob } from "@/lib/blob-storage"
import { parsePdf } from "@/lib/pdf-parser"
import { parse as csvParse } from 'csv-parse';
import { saveMenu } from "@/lib/kv-storage";

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req) {
  try {
    const formData = await req.formData()
    const file = formData.get("file")
    const description = formData.get("description")

    if (!file) {
      return new NextResponse(
        JSON.stringify({ error: "ファイルが見つかりません" }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // ファイルタイプの検証
    const validTypes = ["application/pdf", "text/csv"]
    if (!validTypes.includes(file.type)) {
      return new NextResponse(
        JSON.stringify({ error: "PDFまたはCSV形式のファイルのみアップロード可能です" }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // ファイルサイズの検証（5MB以下）
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return new NextResponse(
        JSON.stringify({ error: "ファイルサイズは5MB以下にしてください" }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // ファイルをBlobにアップロード
    const filename = `menus/${Date.now()}-${file.name}`
    const fileUrl = await uploadFileToBlob(file, filename)

    // ファイルの処理
    const fileBuffer = await file.arrayBuffer();
    const fileBytes = new Uint8Array(fileBuffer);
    let parsedContent = "";

    // PDFの場合
    if (file.type === "application/pdf") {
      try {
        // カスタムPDFパーサーを使用してテキスト抽出
        parsedContent = await parsePdf(fileBytes);
      } catch (error) {
        console.error("PDFパースエラー:", error);
        return new NextResponse(
          JSON.stringify({ error: "PDFファイルの解析中にエラーが発生しました。ファイルが破損していないか確認してください。" }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }

    // CSVの場合
    if (file.type === "text/csv") {
      try {
        // CSVパーサーを使用してデータ抽出
        const csvData = await new Promise((resolve, reject) => {
          csvParse(fileBytes.toString(), {
            columns: true,
            skip_empty_lines: true,
            delimiter: ',', // カンマ区切りを明示的に指定
          }, (err, records) => {
            if (err) {
              reject(new Error(`CSVパースエラー: ${err.message}`));
            } else if (!Array.isArray(records) || records.length === 0) {
              reject(new Error('CSVファイルにデータが含まれていません'));
            } else {
              resolve(records);
            }
          });
        });
        parsedContent = JSON.stringify(csvData);
      } catch (error) {
        console.error("CSVパースエラー:", error);
        return new NextResponse(
          JSON.stringify({ error: `CSVファイルの解析中にエラーが発生しました。ファイルの形式が正しいか確認してください。${error instanceof Error ? ` (${error.message})` : ''}` }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
      }
    }

    const menuId = `file-${Date.now()}`;

    // メニューデータを保存
    await saveMenu(menuId, {
      title: file.name,
      notes: description,
      fileType: file.type === "application/pdf" ? "pdf" : "csv",
      fileSize: `${(file.size / 1024).toFixed(1)} KB`,
      fileUrl: fileUrl,
      content: parsedContent,
    });

    // 成功レスポンスを返す
    return new NextResponse(
      JSON.stringify({
        success: true,
        menuId: menuId,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  } catch (error) {
    console.error("ファイルアップロードエラー:", error);
    return new NextResponse(
      JSON.stringify({ error: "ファイルアップロード中にエラーが発生しました" }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

export async function OPTIONS(req) {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
