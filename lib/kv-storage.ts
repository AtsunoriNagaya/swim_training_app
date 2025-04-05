import { Redis } from '@upstash/redis';
import { saveJsonToBlob, getJsonFromBlob } from './blob-storage';
import { getEmbedding, cosineSimilarity, generateMenuText } from './embedding';

// Redis クライアントの初期化 (Vercel KV または Upstash Redis を想定)
let redis: Redis;
try {
  // Vercel KV またはカスタム名の環境変数を優先
  const redisUrl = process.env.KV_REST_API_URL || process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!redisUrl || !redisToken) {
    throw new Error("Missing Redis environment variables");
  }

  redis = new Redis({
    url: redisUrl,
    token: redisToken,
  });
  console.log(`[Redis] ✅ Redis クライアント初期化成功`);
} catch (error) {
  console.error("[Redis] 🚨 Redis 初期化エラー:", error);
  // フォールバック: インメモリのスタブを使用
  redis = {
    get: async () => null,
    set: async () => "OK",
  } as unknown as Redis;
}

// メニュー項目の型定義
interface MenuItem {
  description: string;
  distance: string;
  sets: number;
  circle: string;
  rest: string | number;
  equipment?: string;
  notes?: string;
  time?: number;
}

// メニューセクションの型定義
interface MenuSection {
  name: string;
  items: MenuItem[];
  totalTime?: number;
}

// メニューデータの型定義
interface GeneratedMenuData {
  title: string;
  menu: MenuSection[];
  totalTime: number;
  intensity?: string | null;
  targetSkills?: string[] | null;
}

// スコアリングされたメニューの型定義
interface ScoredMenu {
  menuData: GeneratedMenuData;
  similarityScore: number;
}

const INDEX_FILE_NAME = 'menus/index.json';

/**
 * メニューデータをVercel BlobとRedisに保存する
 */
export async function saveMenu(menuId: string, menuData: any, openaiApiKey?: string) {
  // メニューテキストからembeddingを生成
  const menuText = generateMenuText(menuData);
  let embedding: number[] | null = null;
  
  if (openaiApiKey) {
    try {
      embedding = await getEmbedding(menuText, openaiApiKey);
    } catch (error) {
      console.error('[KV] Embedding生成エラー:', error);
      // エラーが発生してもメニューは保存する
    }
  }
  // メニューデータを保存
  const menuDataUrl = await saveJsonToBlob(menuData, `menus/${menuId}.json`);
  console.log(`[KV] Saved menu data to Blob, URL: ${menuDataUrl}`);

  let embeddingUrl = '';
  // embeddingが生成できた場合のみ保存
  if (embedding) {
    embeddingUrl = await saveJsonToBlob({ embedding }, `menus/${menuId}.embedding.json`);
    console.log(`[KV] Saved embedding to Blob, URL: ${embeddingUrl}`);

    // Redisにembeddingを保存（高速検索用）
    await redis.hset(`menu:${menuId}`, {
      embedding: JSON.stringify(embedding),
      text: menuText
    });
  }

  // インデックスファイルを取得
  const indexData = await getIndexData();

  // メタデータを生成
  const metadata = {
    embeddingUrl,
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
 * メニューの類似度を計算する（ベクトル検索を使用）
 */
export async function searchSimilarMenus(query: string, duration: number, openaiApiKey?: string): Promise<ScoredMenu[]> {
  try {
    const indexData = await getIndexData();
    const results: ScoredMenu[] = [];

    // クエリのembeddingを取得（APIキーがある場合のみ）
    if (!openaiApiKey) {
      return [];
    }

    const queryEmbedding = await getEmbedding(query, openaiApiKey);

    // 各メニューについて類似度を計算
    for (const menu of indexData.menus) {
      try {
        const metadata = menu.metadata;
        
        // 時間範囲での絞り込み（現在の±20%）
        const menuDuration = parseInt(metadata.duration);
        if (!(menuDuration >= duration * 0.8 && menuDuration <= duration * 1.2)) {
          continue;
        }

        // Redisからembeddingを取得（高速）
        const storedData = await redis.hgetall<{ embedding: string }>(`menu:${menu.id}`);
        let menuEmbedding: number[];
        
        if (storedData && storedData.embedding) {
          menuEmbedding = JSON.parse(storedData.embedding);
        } else {
          // フォールバック: Blobからembeddingを取得
          const embeddingData = await handleBlobError(() => 
            getJsonFromBlob(metadata.embeddingUrl)
          ) as { embedding: number[] } | null;
          
          if (!embeddingData) {
            console.warn(`[KV] ⚠️ No embedding found for menu ${menu.id}`);
            continue;
          }
          menuEmbedding = embeddingData.embedding;
        }

        // コサイン類似度を計算
        const similarity = cosineSimilarity(queryEmbedding, menuEmbedding);
      
        // メニューデータを取得
        const menuData = await handleBlobError(() => 
          getJsonFromBlob(menu.menuDataUrl)
        ) as GeneratedMenuData | null;

        if (menuData && similarity > 0.7) { // 類似度閾値
          results.push({
            menuData,
            similarityScore: similarity
          });
        }
      } catch (error) {
        console.error(`メニュー検索エラー (ID: ${menu.id}):`, error);
        continue;
      }
    }
    
    // スコアの高い順にソート
    return results
      .sort((a: ScoredMenu, b: ScoredMenu) => b.similarityScore - a.similarityScore)
      .slice(0, 5); // 上位5件のみを返す
  } catch (error) {
    console.error("[KV] メニュー検索エラー:", error);
    return [];
  }
}

/**
 * インデックスファイルの取得処理を共通化
 */
async function getIndexData() {
  try {
    console.log("[KV] 🔍 Getting index URL from Redis store");
    const indexFileUrl = await redis.get<string>('menu:indexUrl');
    
    if (!indexFileUrl) {
      console.warn("[KV] ⚠️ Index file URL not found in KV store");
      return { menus: [] };
    }
    
    console.log("[KV] ✅ Retrieved index URL from KV:", indexFileUrl?.substring(0, 50) + "...");

    console.log("[KV] 🔍 Fetching index data from Blob storage");
    const indexData = await handleBlobError(() => getJsonFromBlob(indexFileUrl)) as { menus: any[] } | null;
    
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
 * 指定されたIDのメニューデータを取得する
 */
export async function getMenu(menuId: string): Promise<GeneratedMenuData | null> {
  try {
    console.log(`[KV] 🔍 Searching for menu with ID: ${menuId}`);
    
    // インデックスファイルからメニューデータのURLを取得
    const indexData = await getIndexData();
    
    if (!indexData.menus || indexData.menus.length === 0) {
      console.warn(`[KV] ⚠️ Index contains no menus, cannot find menu ID: ${menuId}`);
      return null;
    }
    
    // 部分一致や関連IDも探す
    const menuEntry = indexData.menus.find(menu => 
      menu.id === menuId || menu.id.includes(menuId) || menuId.includes(menu.id)
    );

    // メニューが見つからない場合
    if (!menuEntry) {
      console.warn(`[KV] ⚠️ Menu ID ${menuId} not found in index`);
      return null;
    }
    
    if (!menuEntry.menuDataUrl) {
      console.warn(`[KV] ⚠️ Menu entry found but menuDataUrl is missing for ID: ${menuEntry.id}`);
      return null;
    }

    console.log(`[KV] ✅ Found menu ${menuEntry.id} in index, menuDataUrl: ${menuEntry.menuDataUrl}`);

    // Blobからメニューデータを取得
    console.log(`[KV] 🔍 Fetching menu data from Blob storage using indexed URL: ${menuEntry.menuDataUrl}`);
    const menuData = await handleBlobError(() => getJsonFromBlob(menuEntry.menuDataUrl)) as GeneratedMenuData | null;
    
    if (!menuData) {
      console.error(`[KV] 🚨 Menu data not found in Blob storage using URL from index: ${menuEntry.menuDataUrl}`);
      return null;
    }
    
    console.log(`[KV] ✅ Successfully retrieved menu data from Blob storage for ID: ${menuEntry.id}`);
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
export async function getMenuHistory(): Promise<{
  id: string;
  loadLevels: string[];
  duration: number;
  notes: string;
  createdAt: string;
  totalTime: number;
  intensity: string;
  targetSkills: string[];
  title: string;
  aiModel: string;
}[]> {
  try {
    // インデックスファイルを取得
    const indexData = await getIndexData();

    const menus = indexData.menus.map((menu) => {
      // メタデータの型変換を行う
      const metadata = menu.metadata;
      return {
        id: menu.id,
        ...metadata,
        // loadLevelsを文字列から配列に変換
        loadLevels: metadata.loadLevels ? metadata.loadLevels.split(',').filter(Boolean) : [],
        // 数値型の項目を変換
        duration: parseInt(metadata.duration) || 0,
        totalTime: parseInt(metadata.totalTime) || 0,
        // 配列型の項目を確実に配列として扱う
        targetSkills: Array.isArray(metadata.targetSkills) ? metadata.targetSkills : [],
      };
    });

    // 作成日時の降順でソート（新しい順）
    return menus.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  } catch (error) {
    console.error("[KV] メニュー履歴の取得に失敗:", error);
    return [];
  }
}
