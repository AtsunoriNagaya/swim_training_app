# 履歴機能 - 詳細設計書

## 概要

履歴機能は、AI生成されたメニューとアップロードされたファイルの両方を統合して表示する機能です。データベース（Neon）とローカルストレージの両方からデータを取得し、ユーザーに統一されたインターフェースを提供します。

## アーキテクチャ

### データフロー

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   履歴ページ     │    │  履歴取得API    │    │  Neonデータベース │
│ (history/page)  │───▶│ (get-menu-     │───▶│    (menus)      │
│                 │    │  history)       │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │
         ▼
┌─────────────────┐
│ ローカルストレージ │
│ (localStorage)  │
└─────────────────┘
```

### データ統合プロセス

1. **データベースからの取得**: `/api/get-menu-history`でAI生成メニューを取得
2. **ローカルストレージからの取得**: `localStorage`からアップロードファイルを取得
3. **重複除去**: 同じIDのメニューがある場合、データベースを優先
4. **ソート**: 作成日時の降順でソート
5. **表示**: 統合されたリストを表示

## 実装詳細

### フロントエンド (`app/history/page.tsx`)

#### 主要な状態管理
```typescript
const [menus, setMenus] = useState<Menu[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
```

#### データ取得ロジック
```typescript
const fetchMenuHistory = async () => {
  try {
    // 1. データベースから取得
    const response = await fetch('/api/get-menu-history');
    const data = await response.json();
    const dbMenus = data.menuHistory || [];
    
    // 2. ローカルストレージから取得
    const storedMenus = JSON.parse(localStorage.getItem('swim-training-menus') || '[]');
    
    // 3. 統合処理
    const allMenus = [...dbMenus];
    storedMenus.forEach((localMenu) => {
      const existsInDb = dbMenus.some((dbMenu) => dbMenu.id === localMenu.id);
      if (!existsInDb) {
        allMenus.push(localMenu);
      }
    });
    
    // 4. ソート
    allMenus.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    setMenus(allMenus);
  } catch (error) {
    // エラーハンドリング
  }
};
```

#### 表示の区別
- **AI生成メニュー**: `fileType`が未定義
- **アップロードファイル**: `fileType`が定義済み

```typescript
const isGeneratedMenu = !menu.fileType;
```

### バックエンド (`app/api/get-menu-history/route.ts`)

#### API仕様
- **エンドポイント**: `GET /api/get-menu-history`
- **レスポンス形式**:
```json
{
  "menuHistory": [
    {
      "id": "menu_1234567890_abc123",
      "title": "高強度の60分トレーニングメニュー",
      "description": "AI生成メニュー: 高強度 60分",
      "createdAt": "2024-08-16T05:00:00.000Z"
    }
  ],
  "count": 1
}
```

#### データベース連携
```typescript
const menuHistory = await getMenuHistory();
const formattedMenuHistory = menuHistory.map((menu) => ({
  id: menu.id,
  title: menu.title,
  description: menu.description,
  createdAt: menu.createdAt,
}));
```

### データベース層 (`lib/neon-db.ts`)

#### `getMenuHistory()` 関数
```sql
SELECT 
  m.id,
  m.title,
  m.description,
  m.created_at
FROM menus m
ORDER BY m.created_at DESC
```

## エラーハンドリング

### 段階的フォールバック
1. **正常時**: データベース + ローカルストレージの統合表示
2. **データベースエラー時**: ローカルストレージのみ表示
3. **完全エラー時**: エラーメッセージ表示

### エラー表示
```typescript
if (error) {
  return (
    <div className="container px-4 py-8 mx-auto">
      <h1 className="mb-6 text-2xl font-bold">過去のメニュー</h1>
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-red-500">エラー: {error}</p>
          <p className="text-center text-gray-500 mt-2">ローカルストレージのデータのみ表示しています</p>
        </CardContent>
      </Card>
      {/* ローカルストレージのデータを表示 */}
    </div>
  );
}
```

## UI/UX設計

### メニュー区別表示
- **AI生成**: 青色のバッジ「AI生成」
- **アップロード**: 緑色のバッジ「アップロード」

```typescript
<span className={`px-2 py-1 text-xs rounded-full ${
  isGeneratedMenu 
    ? 'bg-blue-100 text-blue-800' 
    : 'bg-green-100 text-green-800'
}`}>
  {isGeneratedMenu ? 'AI生成' : 'アップロード'}
</span>
```

### アクション
- **AI生成メニュー**: 「メニューを表示」リンク → `/result?menuId=${menu.id}`
- **アップロードファイル**: ファイル内容のプレビュー表示

## パフォーマンス考慮事項

### 最適化ポイント
1. **データベースクエリ**: インデックスを活用した高速検索
2. **フロントエンド**: 必要最小限のデータのみ取得
3. **キャッシュ**: ローカルストレージによる部分的なキャッシュ

### スケーラビリティ
- **ページネーション**: 将来的にメニュー数が増加した場合の対応
- **フィルタリング**: 日付範囲やメニュータイプでの絞り込み
- **検索機能**: タイトルや説明での検索

## セキュリティ

### データ保護
- **ローカルストレージ**: クライアントサイドのみ、機密情報なし
- **データベース**: SSL接続、パラメータ化クエリ
- **API**: 認証なし（将来的に追加予定）

## 今後の改善計画

### 短期（1-2ヶ月）
- [ ] ページネーション機能
- [ ] 日付範囲フィルタ
- [ ] メニュー削除機能

### 中期（3-6ヶ月）
- [ ] 検索機能
- [ ] メニューのお気に入り機能
- [ ] エクスポート機能（一括CSV/PDF）

### 長期（6ヶ月以上）
- [ ] ユーザー認証との統合
- [ ] メニュー共有機能
- [ ] 使用統計の表示

## トラブルシューティング

### よくある問題

#### 1. 履歴が表示されない
**原因**: データベース接続エラー
**対処**: 
- `DATABASE_URL`環境変数の確認
- Neonデータベースの接続状況確認
- ローカルストレージのデータ確認

#### 2. 重複したメニューが表示される
**原因**: データ統合ロジックの問題
**対処**: 
- ID重複チェックロジックの確認
- データベースとローカルストレージの整合性確認

#### 3. メニュー表示リンクが動作しない
**原因**: メニューIDの不整合
**対処**: 
- `/result`ページでのメニューID処理確認
- データベースの`menu_data`テーブル確認

## 関連ファイル

### フロントエンド
- `app/history/page.tsx` - 履歴表示ページ
- `components/menu-history-list.tsx` - 履歴リストコンポーネント（未使用）

### バックエンド
- `app/api/get-menu-history/route.ts` - 履歴取得API
- `lib/neon-db.ts` - データベース操作

### 型定義
- `types/menu.ts` - メニュー型定義

## 参考資料

- [Neon Database Documentation](https://neon.tech/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [React Hooks](https://react.dev/reference/react)
