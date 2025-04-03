import { Redis } from '@upstash/redis';
import { saveJsonToBlob, getJsonFromBlob } from './blob-storage';

// Upstash Redis クライアントの初期化
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// メニューメタデータの型定義
interface MenuMetadata {
  loadLevels: string;
  duration: string;
  notes: string;
  createdAt: string;
  totalTime: string;
  intensity: string;
  targetSkills: string[];
  title: string;
  aiModel: string;
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
  try {
    console.log("[KV] 🔍 Getting index URL from Redis store");
    const indexFileUrl = await redis.get<string>('menu:indexUrl');
    
    if (!indexFileUrl) {
      console.warn("[KV] ⚠️ Index file URL not found in KV store");
      return { menus: [] };
    }
    
    console.log("[KV] ✅ Retrieved index URL from KV:", indexFileUrl?.substring(0, 50) + "...");

    console.log("[KV] 🔍 Fetching index data from Blob storage");
    const indexData = await handleBlobError(() => getJsonFromBlob(indexFileUrl)) as IndexData | null;
    
    if (!indexData) {
      console.warn("[KV] ⚠️ Failed to retrieve index data from Blob");
      return { menus: [] };
    }
    
    const menuCount = indexData.menus?.length || 0;
    console.log(`[KV] ✅ Retrieved index data from Blob with ${menuCount} menus`);
    
    return indexData || { menus: [] };
  } catch (error: any) {
    console.error("[KV] Error fetching index data:", {
      error: error.message,
      stack: error.stack,
      name: error.name
    });
    return { menus: [] };
  }
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
    loadLevels: menuData.loadLevels ? menuData.loadLevels.join(',') : "",
    duration: menuData.duration ? menuData.duration.toString() : "0",
    notes: menuData.notes || "",
    createdAt: new Date().toISOString(),
    totalTime: menuData.totalTime ? menuData.totalTime.toString() : "0",
    intensity: menuData.intensity || "",
    targetSkills: menuData.targetSkills || [],
    title: menuData.title || "Untitled",
    aiModel: menuData.aiModel || "Unknown",
  };

  // インデックスファイルにメニューを追加
  indexData.menus.push({
    id: menuId,
    metadata: metadata,
    menuDataUrl: menuDataUrl
  });

  // インデックスファイルをBlobに保存
  const indexFileUrl = await saveJsonToBlob(indexData, INDEX_FILE_NAME);

  // RedisにインデックスファイルのURLを保存
  await redis.set('menu:indexUrl', indexFileUrl);
}

/**
 * 指定されたIDのメニューデータを取得する
 */
export async function getMenu(menuId: string) {
  try {
    console.log(`[KV] 🔍 Searching for menu with ID: ${menuId}`);
    
    // インデックスファイルからメニューデータのURLを取得
    const indexData = await getIndexData();
    
    if (!indexData.menus || indexData.menus.length === 0) {
      console.warn(`[KV] ⚠️ Index contains no menus, cannot find menu ID: ${menuId}`);
      return null;
    }
    
    const menuEntry = indexData.menus.find(menu => menu.id === menuId);

    // メニューが見つからない場合
    if (!menuEntry) {
      console.warn(`[KV] ⚠️ Menu ID ${menuId} not found in index`);
      return null;
    }
    
    if (!menuEntry.menuDataUrl) {
      console.warn(`[KV] ⚠️ Menu entry found but menuDataUrl is missing for ID: ${menuId}`);
      return null;
    }

    console.log(`[KV] ✅ Found menu ${menuId} in index, menuDataUrl: ${menuEntry.menuDataUrl.substring(0, 50)}...`);

    // Blobからメニューデータを取得
    console.log(`[KV] 🔍 Fetching menu data from Blob storage`);
    const menuData = await handleBlobError(() => getJsonFromBlob(menuEntry.menuDataUrl));
    
    if (!menuData) {
      console.error(`[KV] 🚨 Menu data not found in Blob storage: ${menuEntry.menuDataUrl}`);
      return null;
    }
    
    console.log(`[KV] ✅ Successfully retrieved menu data from Blob storage for ID: ${menuId}`);
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
    ...menu.metadata,
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
