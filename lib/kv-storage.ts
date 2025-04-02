import { kv } from '@vercel/kv';
import { saveJsonToBlob, getJsonFromBlob } from './blob-storage';

// メニューメタデータの型定義
interface MenuMetadata {
  loadLevels: string;
  duration: string;
  notes: string;
  createdAt: string;
  totalTime: string;
  intensity: string;
  targetSkills: string;
}

// メニュー履歴項目の型定義
interface MenuHistoryItem extends MenuMetadata {
  id: string;
}

// インデックスファイルの型定義
interface IndexData {
  menus: {
    id: string;
    metadata: MenuMetadata;
    menuDataUrl: string;
  }[];
}

const INDEX_FILE_NAME = 'menus/index.json';

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
 * インデックスファイルの取得処理を共通化
 */
async function getIndexData(): Promise<IndexData> {
  const indexFileUrl = await kv.get<string>('menu:indexUrl');
  if (!indexFileUrl) {
    return { menus: [] };
  }

  const indexData = await handleBlobError(() => getJsonFromBlob(indexFileUrl)) as IndexData | null;
  return indexData || { menus: [] };
}

/**
 * メニューデータをVercel Blobに保存する
 */
export async function saveMenu(menuId: string, menuData: any) {
  // メニューデータをBlobに保存
  const menuDataUrl = await saveJsonToBlob(menuData, `menus/${menuId}.json`);

  // インデックスファイルを取得
  const indexData = await getIndexData();

  // メタデータを生成
  const metadata: MenuMetadata = {
    loadLevels: Array.isArray(menuData.loadLevels) ? menuData.loadLevels.join(",") : "",
    duration: menuData.duration?.toString() || "",
    notes: menuData.notes || "",
    createdAt: new Date().toISOString(),
    totalTime: menuData.totalTime?.toString() || "",
    intensity: menuData.intensity || "",
    targetSkills: Array.isArray(menuData.targetSkills) ? menuData.targetSkills.join(",") : ""
  };

  // インデックスファイルにメニューを追加
  indexData.menus.push({
    id: menuId,
    metadata: metadata,
    menuDataUrl: menuDataUrl
  });

  // インデックスファイルをBlobに保存
  const indexFileUrl = await saveJsonToBlob(indexData, INDEX_FILE_NAME);

  // KVにインデックスファイルのURLを保存
  await kv.set('menu:indexUrl', indexFileUrl);
}

/**
 * 指定されたIDのメニューデータを取得する
 */
export async function getMenu(menuId: string) {
  try {
    // インデックスファイルからメニューデータのURLを取得
    const indexData = await getIndexData();
    const menuEntry = indexData.menus.find(menu => menu.id === menuId);

    // メニューが見つからない場合
    if (!menuEntry || !menuEntry.menuDataUrl) {
      console.warn(`[KV] Menu ID ${menuId} not found in index`);
      return null;
    }

    console.log(`[KV] Found menu ${menuId}, URL: ${menuEntry.menuDataUrl}`);

    // Blobからメニューデータを取得
    const menuData = await handleBlobError(() => getJsonFromBlob(menuEntry.menuDataUrl));
    if (!menuData) {
      console.error(`[KV] Menu data not found in Blob storage: ${menuEntry.menuDataUrl}`);
      return null;
    }
    return menuData;
  } catch (error: any) {
    console.error(`[KV] Error fetching menu ${menuId}:`, {
      error: error.message,
      stack: error.stack,
      name: error.name
    });
    return null;
  }
}

/**
 * すべてのメニュー履歴を取得する
 */
export async function getMenuHistory() {
  // インデックスファイルを取得
  const indexData = await getIndexData();

  const menus: MenuHistoryItem[] = indexData.menus.map((menu) => ({
    id: menu.id,
    ...menu.metadata
  }));

  // 作成日時の降順でソート（新しい順）
  return menus.sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

/**
 * 類似メニューを検索する（簡易実装）
 */
export async function searchSimilarMenus(query: string, duration: number) {
  // インデックスファイルを取得
  const indexData = await getIndexData();

  const results: any[] = [];

  for (const menu of indexData.menus) {
    const metadata = menu.metadata;
    if (metadata) {
      // 時間範囲で絞り込み
      const menuDuration = parseInt(metadata.duration);
      if (menuDuration >= duration * 0.8 && menuDuration <= duration * 1.2) {
        const menuData = await handleBlobError(() => getJsonFromBlob(menu.menuDataUrl));
        if (menuData) {
          results.push(menuData);
        }
      }
    }
  }

  return results;
}
