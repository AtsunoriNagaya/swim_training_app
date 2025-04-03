import { type NextRequest, NextResponse } from "next/server"
import { uploadFileToBlob } from "@/lib/blob-storage"
import pdf from 'pdf-parse';
import { parse as csvParse } from 'csv-parse';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get("file") as File
    const description = formData.get("description") as string

    if (!file) {
      return NextResponse.json({ error: "ファイルが見つかりません" }, { status: 400 })
    }

    // ファイルタイプの検証
    const validTypes = ["application/pdf", "text/csv"]
    if (!validTypes.includes(file.type)) {
      return NextResponse.json({ error: "PDFまたはCSV形式のファイルのみアップロード可能です" }, { status: 400 })
    }

    // ファイルサイズの検証（5MB以下）
    const maxSize = 5 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json({ error: "ファイルサイズは5MB以下にしてください" }, { status: 400 })
    }

    // ファイルをBlobにアップロード
    const filename = `menus/${Date.now()}-${file.name}`
    const fileUrl = await uploadFileToBlob(file, filename)

    // ファイルの処理
    const fileBuffer = await file.arrayBuffer();
    const fileContent = new Uint8Array(fileBuffer);

    // PDFの場合
    if (file.type === "application/pdf") {
      // PDFパーサーを使用してテキスト抽出
      const pdfData = await pdf(fileContent);
      const pdfText = pdfData.text;
      // ベクトル化してDBに保存
      // await saveToVectorDB(pdfText, description, file.name);
      console.log("PDFテキスト:", pdfText.substring(0, 200) + "...");
    }

    // CSVの場合
    if (file.type === "text/csv") {
      // CSVパーサーを使用してデータ抽出
      const csvData = await new Promise((resolve, reject) => {
        csvParse(fileContent.toString(), {
          columns: true,
          skip_empty_lines: true
        }, (err, records) => {
          if (err) {
            reject(err);
          } else {
            resolve(records);
          }
        });
      });
      // ベクトル化してDBに保存
      // await saveToVectorDB(JSON.stringify(csvData), description, file.name);
      console.log("CSVデータ:", JSON.stringify(csvData).substring(0, 200) + "...");
    }

    // 仮実装：成功レスポンスを返す
    return NextResponse.json({
      success: true,
      fileId: `file-${Date.now()}`,
      fileName: file.name,
      fileType: file.type === "application/pdf" ? "pdf" : "csv",
      fileSize: `${(file.size / 1024).toFixed(1)} KB`,
      description: description,
      uploadedAt: new Date().toISOString(),
      fileUrl: fileUrl, // BlobのURLを追加
    })
  } catch (error) {
    console.error("ファイルアップロードエラー:", error)
    return NextResponse.json({ error: "ファイルアップロード中にエラーが発生しました" }, { status: 500 })
  }
}
