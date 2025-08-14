# データベース/デプロイ設定（Neon/Vercel など）

このドキュメントは、Neon Database の設定、環境変数、ローカル/本番デプロイの手順をまとめた運用向けガイドです。

## 使用技術（関連）
- DB: Neon Database（PostgreSQL + pgvector）
- ORM/接続: `lib/neon-db.ts` の `getPool()` を使用
- Embeddings: OpenAI `text-embedding-3-small`

## 環境変数

必須:
```
DATABASE_URL="postgresql://username:password@hostname:port/database?sslmode=require"
```

必要に応じて（CORS許可オリジンの追加、カンマ区切り）:
```
CORS_ALLOW_ORIGINS="https://your-frontend.example,https://another.example"
```

オプション（Vercel Blob を使う場合）:
```
BLOB_READ_WRITE_TOKEN=YOUR_BLOB_READ_WRITE_TOKEN
```

## Neon のセットアップ
1. https://neon.tech でアカウント/プロジェクト作成
2. 接続文字列（`DATABASE_URL`）を取得
3. 環境変数に設定
4. 初期化: `/api/init-db` を一度呼び出してテーブルを作成

## ローカル開発
```bash
git clone https://github.com/[your-username]/swim-training-app.git
cd swim-training-app

pnpm install  # または npm install

# .env.local を作成して DATABASE_URL を設定

pnpm init-db  # 初回のみ（DB初期化）
pnpm dev      # または npm run dev
```

## Vercel へのデプロイ
1. https://vercel.com でアカウント作成/ログイン
2. GitHub リポジトリをインポート
3. Neon を準備し、`DATABASE_URL` を Vercel の環境変数に設定
4. ビルド設定の確認
   - `app/upload/page.tsx` を使うページは `dynamic = 'force-dynamic'`
   - `jspdf-autotable` が `dependencies` に含まれていること
5. デプロイを実行
6. デプロイ後に `/api/init-db` を呼び出してDB初期化

## その他のプラットフォーム
- PostgreSQL + pgvector が利用可能であること
- Node.js v18+ の実行環境
- `DATABASE_URL` の設定

