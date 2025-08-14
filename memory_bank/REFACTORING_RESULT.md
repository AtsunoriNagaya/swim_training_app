# リファクタリング実施結果（Priority A）

本書は `memory_bank/REFACTORING.md` の計画に基づく実装結果と差分サマリです。

## 実施サマリ

- 型の分離/統一: `GeneratedMenuData` を `types/menu.ts` に移設し、呼び出し側の参照を更新。
- JSON抽出の単一化: `lib/json-sanitizer.ts` を新設し、`lib/ai-clients.ts` および `lib/ai-response-processor.ts` から共通利用。
- サービス層の新設:
  - `services/menuService.ts`（生成→サニタイズ→検証→時間計算→保存→レスポンス整形）。
  - `services/ragService.ts`（クエリ埋め込み生成、pgvector検索、プロンプト用整形）。
- APIルートの薄化: `app/api/generate-menu/route.ts` はサービス関数呼び出し中心へ整理。
- DB初期化の副作用除去: `lib/neon-db.ts` のデフォルトエクスポートを廃止し、`getPool()` の名前付きエクスポートに統一。
- CORSの一元化: `next.config.mjs` のCORSヘッダ付与を削除し、`middleware.ts` に集約。`CORS_ALLOW_ORIGINS`（カンマ区切り）でホワイトリスト制御。
- 埋め込みモデル更新: `lib/embedding.ts` を `text-embedding-3-small` に更新。
- 生成メニューの時間自動調整: `services/menuService.adjustToDuration()` を実装し、超過時に自動で時間内へ縮減。

## 変更ファイル一覧（抜粋）

- 追加: `lib/json-sanitizer.ts`, `services/menuService.ts`, `services/ragService.ts`, `lib/prompts/{system.ts,user.ts,index.ts}`
- 更新: `lib/ai-response-processor.ts`, `lib/ai-clients.ts`, `lib/neon-db.ts`, `lib/embedding.ts`, `app/api/generate-menu/route.ts`, `next.config.mjs`, `middleware.ts`, `types/menu.ts`, `lib/ai-config.ts`, `README.md`

## 互換性/影響

- インポートの変更: `lib/neon-db.ts` のデフォルトエクスポートを廃止。`getPool()` を明示呼び出しに統一。
- CORS挙動: 既定は同一オリジンのみ。必要に応じて `CORS_ALLOW_ORIGINS` を設定。
- 生成パイプライン: API ルートからサービス層に移譲。外部APIの入出力フォーマットは維持。

## フォローアップ候補

- `lib/db/pgvector.ts` の分離（ベクトル正規化、NaN対策ユーティリティ）。
- `ai-clients` にて全モデルの出力を共通パイプラインで JSON 返却に統一（更なる薄化）。
- `adjustToDuration()` の戦略拡張（例: 休憩時間の自動再配分、強度に応じた係数調整）。

## 検証メモ

- ローカルでの確認手順:
  1) `pnpm install && pnpm test`（Node環境で）
  2) `pnpm tsc --noEmit` または `pnpm next build` で型/ビルド検証
  3) `/api/generate-menu` に短い `duration` でPOSTし、`menu.totalTime <= duration` を確認
  4) CORS: `CORS_ALLOW_ORIGINS` の設定で外部フロントからの呼び出しを確認

