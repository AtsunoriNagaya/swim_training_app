import { NextResponse } from "next/server"
import { uploadFileToBlob } from "@/lib/blob-storage"
import { parsePdf } from "@/lib/pdf-parser"
import { parse as csvParse } from 'csv-parse';
import { saveMenu } from "@/lib/kv-storage";

// App Routerでのファイルサイズ制限の設定方法
export const maxDuration = 60; // 最大実行時間（秒）

// App Routerでのルート設定
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const description = formData.get("description") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "ファイルが見つかりません" },
        { status: 400 }
      );
    }

    // ファイルタイプの検証
    const validTypes = ["application/pdf", "text/csv"];
    if (!validTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "PDFまたはCSV形式のファイルのみアップロード可能です" },
        { status: 400 }
      );
    }

    // ファイルサイズの検証（5MB以下）
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "ファイルサイズは5MB以下にしてください" },
        { status: 400 }
      );
    }

    // ファイルをBlobにアップロード
    const filename = `menus/${Date.now()}-${file.name}`;
    const fileUrl = await uploadFileToBlob(file, filename);

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
        return NextResponse.json(
          { error: "PDFファイルの解析中にエラーが発生しました。ファイルが破損していないか確認してください。" },
          { status: 400 }
        );
      }
    }

    // CSVの場合
    if (file.type === "text/csv") {
      try {
        // CSVパーサーを使用してデータ抽出
        const text = new TextDecoder().decode(fileBytes);
        const csvData = await new Promise((resolve, reject) => {
          csvParse(text, {
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
        return NextResponse.json(
          { error: `CSVファイルの解析中にエラーが発生しました。ファイルの形式が正しいか確認してください。${error instanceof Error ? ` (${error.message})` : ''}` },
          { status: 400 }
        );
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
    return NextResponse.json(
      {
        success: true,
        menuId: menuId,
      },
      {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      }
    );
  } catch (error) {
    console.error("ファイルアップロードエラー:", error);
    return NextResponse.json(
      { error: "ファイルアップロード中にエラーが発生しました" },
      { status: 500 }
    );
  }
}

// OPTIONSメソッドを明示的に追加
export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  );
}
