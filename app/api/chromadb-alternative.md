# ChromaDBの代替案

このアプリケーションはローカル開発環境ではChromaDBを使用していますが、Vercelなどのサーバーレス環境にデプロイする場合は、以下の代替案を検討してください。

## 1. Vercel KV (推奨)

[Vercel KV](https://vercel.com/docs/storage/vercel-kv)はRedisベースのキーバリューストアで、Vercelにデプロイされたアプリケーションと簡単に統合できます。

### セットアップ手順

1. Vercelダッシュボードで新しいKVデータベースを作成
2. 環境変数を設定
3. 以下のようにコードを変更

```typescript
// app/api/kv-storage.ts
import { kv } from '@vercel/kv';

export async function saveMenu(menuId: string, menuData: any) {
  await kv.set(`menu:${menuId}`, JSON.stringify(menuData));
  
  // メタデータを別のキーに保存
  await kv.set(`menu:${menuId}:metadata`, {
    loadLevels: menuData.loadLevels.join(","),
    duration: menuData.duration.toString(),
    notes: menuData.notes || "",
    createdAt: new Date().toISOString(),
    totalTime: menuData.totalTime.toString(),
    intensity: menuData.intensity || "",
    targetSkills: Array.isArray(menuData.targetSkills) ? menuData.targetSkills.join(",") : ""
  });
  
  // メニューIDのリストを更新
  const menuIds = await kv.get<string[]>('menu:ids') || [];
  menuIds.push(menuId);
  await kv.set('menu:ids', menuIds);
}

export async function getMenu(menuId: string) {
  return await kv.get(`menu:${menuId}`);
}

export async function getMenuHistory() {
  const menuIds = await kv.get<string[]>('menu:ids') || [];
  const menus = [];
  
  for (const id of menuIds) {
    const metadata = await kv.get(`menu:${id}:metadata`);
    if (metadata) {
      menus.push({
        id,
        ...metadata
      });
    }
  }
  
  return menus;
}

export async function searchSimilarMenus(query: string, duration: number) {
  // 簡易的な検索実装（本格的な実装ではベクトル検索が必要）
  const menuIds = await kv.get<string[]>('menu:ids') || [];
  const results = [];
  
  for (const id of menuIds) {
    const metadata = await kv.get(`menu:${id}:metadata`);
    if (metadata) {
      // 時間範囲で絞り込み
      const menuDuration = parseInt(metadata.duration);
      if (menuDuration >= duration * 0.8 && menuDuration <= duration * 1.2) {
        results.push(await kv.get(`menu:${id}`));
      }
    }
  }
  
  return results;
}
```

## 2. Pinecone

[Pinecone](https://www.pinecone.io/)はベクトルデータベースで、ベクトル検索に特化しています。

### セットアップ手順

1. Pineconeアカウントを作成
2. 新しいインデックスを作成
3. 環境変数を設定
4. Pinecone SDKを使用してコードを変更

## 3. Supabase Vector

[Supabase Vector](https://supabase.com/vector)はPostgreSQLベースのベクトルデータベースで、pgvectorを使用しています。

### セットアップ手順

1. Supabaseアカウントを作成
2. 新しいプロジェクトを作成
3. ベクトル拡張機能を有効化
4. 環境変数を設定
5. Supabase SDKを使用してコードを変更
