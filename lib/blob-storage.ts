// lib/blob-storage.ts
import { put, del } from '@vercel/blob';

/**
 * エラーハンドリングを共通化
 */
async function handleBlobError<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn();
  } catch (error) {
    console.error('Blob storage error:', error);
    return null;
  }
}

/**
 * ファイルを Vercel Blob にアップロードする
 * @param file アップロードするファイル
 * @param filename ファイル名
 * @returns アップロードされたファイルの URL
 */
export async function uploadFileToBlob(file: File, filename: string): Promise<string> {
  const result = await handleBlobError(() =>
    put(filename, file, { access: 'public' })
  );
  return result ? result.url : "";
}

/**
 * Vercel Blob からファイルを取得する
 * @param url ファイルの URL
 * @returns 取得したファイル
 */
export async function getFileFromBlob(url: string): Promise<File | null> {
  return handleBlobError(async () => {
    const response = await fetch(url);
    const blob = await response.blob();
    const filename = url.substring(url.lastIndexOf('/') + 1);
    return new File([blob], filename, { type: blob.type });
  });
}

/**
 * Vercel Blob からファイルを削除する
 * @param url 削除するファイルの URL
 */
export async function deleteFileFromBlob(url: string): Promise<void> {
  await handleBlobError(() => del(url));
}

/**
 * Vercel Blob から JSON データを取得する
 * @param url JSON データの URL
 * @returns 取得した JSON データ
 */
export async function getJsonFromBlob<T>(url: string): Promise<T | null> {
  console.log(`[Blob] 🔍 Fetching JSON from: ${url}`);
  return handleBlobError(async () => {
    try {
      console.log(`[Blob] 🔄 Sending HTTP request to fetch data`);
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      console.log(`[Blob] 📡 Response status: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        console.error(`[Blob] 🚨 Failed to fetch JSON. Status: ${response.status}, URL: ${url}`);
        // レスポンス本文をログに記録（デバッグ用）
        try {
          const errorText = await response.text();
          console.error(`[Blob] 🚨 Error response body: ${errorText.substring(0, 200)}${errorText.length > 200 ? '...' : ''}`);
        } catch (textError) {
          console.error(`[Blob] 🚨 Could not read error response body`);
        }
        return null;
      }
      
      console.log(`[Blob] ✅ Received OK response, parsing JSON`);
      const jsonData = await response.json() as T;
      console.log(`[Blob] ✅ Successfully parsed JSON data`);
      return jsonData;
    } catch (fetchError: any) {
      console.error(`[Blob] 🚨 Fetch or parse error: ${fetchError.message}`, fetchError);
      return null;
    }
  });
}

/**
 * JSON データを Vercel Blob に保存する
 * @param data 保存する JSON データ
 * @param filename ファイル名
 * @returns 保存されたファイルの URL
 */
export async function saveJsonToBlob(data: any, filename: string): Promise<string> {
  const result = await handleBlobError(() =>
    put(filename, JSON.stringify(data), {
      access: 'public',
      contentType: 'application/json',
    })
  );
  return result ? result.url : "";
}
