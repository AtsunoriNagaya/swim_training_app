import pdfParse from 'pdf-parse';

// デバッグモードを環境変数で制御
if (process.env.PDF_PARSE_DEBUG === 'false') {
  (global as any).module = { parent: {} };
}

/**
 * PDFファイルをパースしてテキストを抽出するラッパー関数
 * pdf-parseライブラリのデバッグモードを回避し、より安定した処理を提供します
 */
export async function parsePdf(buffer: Buffer | Uint8Array): Promise<string> {
  try {
    // Uint8ArrayをBufferに変換
    const bufferData = Buffer.isBuffer(buffer) ? buffer : Buffer.from(buffer);
    // pdf-parseライブラリを直接使用せず、モジュールとしてインポートして使用
    const data = await pdfParse(bufferData);
    return data.text;
  } catch (error) {
    console.error('PDFパースエラー:', error);
    throw new Error('PDFファイルの解析に失敗しました');
  }
}
