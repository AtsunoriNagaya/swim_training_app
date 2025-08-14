# 水泳部練習メニュー作成アプリ

AIを使って、水泳部の練習メニューを手早く作れるWebアプリです。負荷レベル・所要時間・特記事項を入力すると、最適なメニューを自動生成し、履歴として保存できます。過去メニューを参照するRAGや、指定時間に収める自動調整にも対応しています。

詳細な手順や技術ノートは `memory_bank/` 以下に集約しました。READMEは「まず触る人」が迷わない要点だけを簡潔にまとめています。

## できること

- AIでメニュー自動生成: OpenAI / Anthropic / Google から選択
- RAGで過去メニュー参照: 類似度を%表示して参考提示
- 指定時間に自動調整: 超過した内容を段階的に縮減
- 履歴管理: 生成済みメニューを保存・再利用
- 出力: PDF（印刷）/ CSV での保存（日本語対応）
  - PDFはポップアップ印刷が既定。/printページ方式も提供

## クイックスタート

前提:
- Node.js（v18+）
- pnpm または npm

セットアップ:
```bash
pnpm install
# または
npm install
```

開発サーバー:
```bash
pnpm dev
# または
npm run dev
```

データベース初期化やAPIキーの詳細は下記「ドキュメント」を参照してください。

## ドキュメント

- アーキテクチャ概要: `memory_bank/ARCHITECTURE.md`
- リファクタリング方針と結果: `memory_bank/REFACTORING.md`, `memory_bank/REFACTORING_RESULT.md`, `memory_bank/MIGRATION_REPORT.md`
- AIモデルの使い分け・APIキー手順: `memory_bank/AI_GUIDE.md`
- データベースとデプロイ設定（Neon/Vercel など）: `memory_bank/DEPLOYMENT.md`
- Markdown印刷（PDF保存）の詳細: `memory_bank/PRINTING.md`
- テスト計画: `memory_bank/test-plan.md`

## 技術スタック（概要）

- Next.js 15 / React 19 / TypeScript 5
- Tailwind CSS / Radix UI
- DB: Neon Database（PostgreSQL + pgvector）
- Embeddings: OpenAI（text-embedding-3-small）

## テスト

Jest による単体・結合テストを用意しています。
```bash
pnpm test
# または
npm test
```
E2E は `memory_bank/test-plan.md` を参照してください。

## コントリビューション

Pull Request を歓迎します。Issue での提案・不具合報告もお待ちしています。

## ライセンス

MIT License（詳細は LICENSE を参照）
