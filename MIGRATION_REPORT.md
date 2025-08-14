# Upstash → Neon Database 移行完了レポート

## 移行概要

**移行日**: 2024年8月14日  
**移行対象**: 水泳部練習メニュー作成アプリ  
**移行前**: Upstash Redis + Upstash Vector + Vercel Blob  
**移行後**: Neon Database (PostgreSQL + pgvector) + Vercel Blob（オプション）

## 移行理由

### 1. Upstash無料プランの制限
- **問題**: 無料プランが2週間で使用不可になる制限
- **影響**: 本格運用での安定性に懸念
- **解決策**: 永続的な無料プランを提供するNeon Databaseへの移行

### 2. コスト効率の向上
- **Upstash**: 無料プラン制限あり、有料プランは高額
- **Neon**: 月500MB + 10GB転送の永続的な無料プラン

### 3. 技術的改善
- **Redis → PostgreSQL**: より柔軟なスキーマ設計
- **Upstash Vector → pgvector**: 標準的なベクトル検索技術
- **統合**: 単一データベースでの全データ管理

## 移行内容

### 1. データベース接続
```typescript
// 移行前: Upstash Redis
import { Redis } from '@upstash/redis';
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// 移行後: Neon PostgreSQL
import { Pool } from 'pg';
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
```

### 2. ベクトル検索
```typescript
// 移行前: Upstash Vector
import { Index } from '@upstash/vector';
const vectorIndex = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN,
});

// 移行後: pgvector
// SQLクエリで直接実行
const query = `
  SELECT id, metadata, 1 - (embedding <=> $1::vector) as similarity
  FROM menus WHERE embedding IS NOT NULL
  ORDER BY embedding <=> $1::vector LIMIT 5
`;
```

### 3. データ保存
```typescript
// 移行前: Redis + Blob
await redis.hset(`menu:${menuId}`, { embedding, text });
await saveJsonToBlob(menuData, `menus/${menuId}.json`);

// 移行後: PostgreSQL
await pool.query(`
  INSERT INTO menus (id, title, description, metadata, embedding)
  VALUES ($1, $2, $3, $4, $5::vector)
`, [menuId, title, description, metadata, embedding]);
```

## 移行後のアーキテクチャ

### データベーススキーマ
```sql
-- メニューメタデータとベクトル
CREATE TABLE menus (
  id VARCHAR(255) PRIMARY KEY,
  title VARCHAR(500),
  description TEXT,
  metadata JSONB,
  embedding vector(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- メニュー完全データ
CREATE TABLE menu_data (
  id VARCHAR(255) PRIMARY KEY,
  menu_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ベクトル検索用インデックス
CREATE INDEX menus_embedding_idx 
ON menus USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

### APIルート更新
- ✅ `GET /api/get-menu` - Neonからメニュー取得
- ✅ `POST /api/search-similar-menus` - pgvector検索
- ✅ `POST /api/upload-menu` - Neonに保存
- ✅ `GET /api/menu-history` - 履歴取得
- ✅ `POST /api/init-db` - データベース初期化

## 移行効果

### 1. 安定性の向上
- **永続的な無料プラン**: 2週間制限なし
- **高可用性**: Neonの99.9%可用性保証
- **自動バックアップ**: 日次自動バックアップ

### 2. パフォーマンスの改善
- **高速検索**: pgvectorの最適化されたインデックス
- **統合クエリ**: 単一データベースでのJOIN操作
- **スケーラビリティ**: サーバーレス自動スケーリング

### 3. 開発効率の向上
- **標準技術**: PostgreSQL + pgvectorの標準的な技術スタック
- **柔軟なスキーマ**: JSONBによる柔軟なデータ構造
- **統合管理**: 単一データベースでの全データ管理

## 移行手順

### 1. 準備段階
- [x] Neonアカウント作成・プロジェクト作成
- [x] 接続文字列の取得
- [x] 環境変数の設定

### 2. 実装段階
- [x] `lib/neon-db.ts`の作成
- [x] APIルートの更新
- [x] テストファイルの修正
- [x] 古いファイルの削除

### 3. テスト段階
- [x] データベース初期化スクリプトの動作確認
- [x] APIルートの動作確認
- [x] ベクトル検索の動作確認

### 4. 完了段階
- [x] 本番環境での動作確認
- [x] ドキュメントの更新
- [x] 移行完了レポートの作成

## 今後の課題と改善点

### 1. 技術的負債の解消
- [ ] レガシーログ（`[KV]`）の完全削除
- [ ] エラーハンドリングの統一化
- [ ] テストカバレッジの向上

### 2. 機能拡張
- [ ] ユーザー認証システム
- [ ] メニュー編集機能
- [ ] 高度な分析機能

### 3. パフォーマンス最適化
- [ ] クエリの最適化
- [ ] インデックスの調整
- [ ] キャッシュ戦略の改善

## 結論

UpstashからNeon Databaseへの移行は、技術的・運用面で大きな改善をもたらしました。永続的な無料プランによる安定性の向上、pgvectorによる高速なベクトル検索、PostgreSQLの柔軟性を活かした設計により、アプリケーションの基盤が大幅に強化されました。

この移行により、今後の機能拡張やユーザー数の増加にも対応できる堅牢なシステムが構築され、長期的な成長が可能になりました。

---

**移行担当**: AI Assistant  
**移行完了日**: 2024年8月14日  
**次回レビュー予定**: 2024年11月
