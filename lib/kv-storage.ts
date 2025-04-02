import { kv } from '@vercel/kv';

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

/**
 * メニューデータをVercel KVに保存する
 */
export async function saveMenu(menuId: string, menuData: any) {
  // メニューデータを保存
  await kv.set(`menu:${menuId}`, JSON.stringify(menuData));
  
  // メタデータを別のキーに保存
  await kv.set(`menu:${menuId}:metadata`, {
    loadLevels: Array.isArray(menuData.loadLevels) ? menuData.loadLevels.join(",") : "",
    duration: menuData.duration?.toString() || "",
    notes: menuData.notes || "",
    createdAt: new Date().toISOString(),
    totalTime: menuData.totalTime?.toString() || "",
    intensity: menuData.intensity || "",
    targetSkills: Array.isArray(menuData.targetSkills) ? menuData.targetSkills.join(",") : ""
  });
  
  // メニューIDのリストを更新
  const menuIds = await kv.get<string[]>('menu:ids') || [];
  menuIds.push(menuId);
  await kv.set('menu:ids', menuIds);
}

/**
 * 指定されたIDのメニューデータを取得する
 */
export async function getMenu(menuId: string) {
  const menuData = await kv.get(`menu:${menuId}`);
  if (!menuData) return null;
  
  try {
    return typeof menuData === 'string' ? JSON.parse(menuData) : menuData;
  } catch (error) {
    console.error('メニューデータのパースエラー:', error);
    return null;
  }
}

/**
 * すべてのメニュー履歴を取得する
 */
export async function getMenuHistory() {
  const menuIds = await kv.get<string[]>('menu:ids') || [];
  const menus: MenuHistoryItem[] = [];
  
  for (const id of menuIds) {
    const metadata = await kv.get<MenuMetadata>(`menu:${id}:metadata`);
    if (metadata) {
      menus.push({
        id,
        ...metadata
      });
    }
  }
  
  // 作成日時の降順でソート（新しい順）
  return menus.sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

/**
 * 類似メニューを検索する（簡易実装）
 */
export async function searchSimilarMenus(query: string, duration: number) {
  const menuIds = await kv.get<string[]>('menu:ids') || [];
  const results = [];
  
  for (const id of menuIds) {
    const metadata = await kv.get<MenuMetadata>(`menu:${id}:metadata`);
    if (metadata) {
      // 時間範囲で絞り込み
      const menuDuration = parseInt(metadata.duration);
      if (menuDuration >= duration * 0.8 && menuDuration <= duration * 1.2) {
        const menuData = await getMenu(id);
        if (menuData) {
          results.push(menuData);
        }
      }
    }
  }
  
  return results;
}
