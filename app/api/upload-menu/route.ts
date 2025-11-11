import { NextRequest, NextResponse } from "next/server";
import { saveUploadedFile } from "@/lib/neon-db";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const description = formData.get('description') as string;

    if (!file) {
      return NextResponse.json({ 
        success: false,
        error: "ファイルが選択されていません" 
      }, { status: 400 });
    }

    // ファイルサイズチェック (5MB)
    const MAX_FILE_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        success: false,
        error: "ファイルサイズは5MB以下にしてください" 
      }, { status: 400 });
    }

    // ファイルタイプチェック
    const ACCEPTED_FILE_TYPES = ["application/pdf", "text/csv"];
    if (!ACCEPTED_FILE_TYPES.includes(file.type)) {
      return NextResponse.json({ 
        success: false,
        error: "PDFまたはCSV形式のファイルのみアップロード可能です" 
      }, { status: 400 });
    }

    const menuId = `upload-${Date.now()}`;
    const fileSize = `${(file.size / 1024).toFixed(1)} KB`;
    
    let content: string;

    if (file.type === 'application/pdf') {
      // PDFファイルをBase64エンコードしてデータベースに保存
      try {
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);
        const binaryString = Array.from(uint8Array, byte => String.fromCharCode(byte)).join('');
        content = btoa(binaryString); // Base64エンコード
      } catch (error) {
        console.error('PDF エンコードエラー:', error);
        return NextResponse.json({ 
          success: false,
          error: "PDFファイルの処理に失敗しました" 
        }, { status: 500 });
      }
    } else if (file.type === 'text/csv') {
      // CSVファイルの内容をテキストとして読み込み
      try {
        content = await file.text();
      } catch (error) {
        console.error('CSV 読み込みエラー:', error);
        return NextResponse.json({ 
          success: false,
          error: "CSVファイルの読み込みに失敗しました" 
        }, { status: 500 });
      }
    } else {
      return NextResponse.json({ 
        success: false,
        error: "サポートされていないファイル形式です" 
      }, { status: 400 });
    }

    // データベースに保存
    try {
      await saveUploadedFile(
        menuId,
        file.name,
        description || '',
        file.type,
        fileSize,
        undefined, // fileUrl は使用しない
        content
      );

      return NextResponse.json({
        success: true,
        menuId: menuId,
        message: "ファイルが正常にアップロードされました"
      });
    } catch (error) {
      console.error('データベース保存エラー:', error);
      return NextResponse.json({ 
        success: false,
        error: "データベースへの保存に失敗しました" 
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error("ファイルアップロードエラー:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });

    return NextResponse.json(
      {
        success: false,
        error: error.message || "ファイルのアップロードに失敗しました",
        details: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
