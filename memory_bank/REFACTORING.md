# リファクタリング計画（Priority A）

本ドキュメントは、優先度Aのリファクタリング項目を記録します。実装はまだ行いません（計画のみ）。

## 目的
- APIルートの薄化、責務分離、型の一元化により保守性・拡張性・テスト容易性を向上。
- セキュリティと可観測性（CORS/ログ）を整理し、本番品質を底上げ。

## 対象範囲
- APIルート（`app/api/*`）、AI連携（`lib/ai-*`）、DB層（`lib/neon-db.ts`）、埋め込み（`lib/embedding.ts`）、共通ユーティリティ/型（`types/*`, `lib/*`）。

## タスク一覧（Priority A）

1) 型の分離/統一
- `GeneratedMenuData` を `app/api/...` から `types/menu.ts` へ移動し、`TrainingMenu`/`MenuItem` 等と整合性を取る。
- `lib/ai-response-processor.ts` からルート定義への依存を解消（循環/密結合の防止）。
- 型の単一出所（SSOT）を確立し、サーバ/クライアントで共有。

2) JSON抽出ロジックの単一化
- `lib/ai-clients.ts` の `extractAndValidateJSON` と `lib/ai-response-processor.ts` の `cleanAIResponse` を統合して `lib/json-sanitizer.ts`（新規）へ集約。
- すべてのAIクライアントと応答処理で同ユーティリティを使用。

3) サービス層の新設
- `services/menuService.ts` を新設（生成→サニタイズ→検証→時間計算→保存→レスポンス整形までのオーケストレーション）。
- `services/ragService.ts` を新設（クエリ埋め込み生成、pgvector検索、プロンプト拡張の責務を集約）。
- APIルートは入出力（HTTP）に特化してサービス層を呼び出す構造へ。

4) DB初期化の副作用除去
- `lib/neon-db.ts` の `export default getPool()` を廃止し、名前付き `getPool` のみをエクスポート。
- インポート時に接続が走らないようにしてテスト/例外制御を容易化。
- pgvectorユーティリティ（ベクトル次元/NaN対策）を専用モジュールへ分離予定（例: `lib/db/pgvector.ts`）。

5) CORS の一元化と縮小
- `next.config.mjs` と `middleware.ts` の二重設定を一本化。
- 許可オリジンは原則同一オリジン、必要時のみ環境変数で限定。
- `OPTIONS` プリフライトの明示対応を追加。

6) 埋め込みモデルの更新
- `lib/embedding.ts` の `text-embedding-ada-002` を `text-embedding-3-small` へ更新（1536次元を継続利用）。
- 例外時のフォールバック/再試行（軽いバックオフ）方針を検討。

7) API/AI まわりの具体的提案（Priority A 適用範囲）
- プロンプト構築のモジュール化: `PROMPT_TEMPLATES` を `lib/prompts/` に分割（`system.ts`/`user.ts`/`rag.ts` など）。AIクライアントからプロンプト差分を切り離し、生成フローの見通しを改善。
- モデル選択の拡張性: `AI_MODEL_CONFIGS` に共通インターフェイスを定義し、`generate()` は「文字列 → サニタイズ → JSON」への統一パイプラインで返却。同形の返却によりモデル追加が差分最小化。
- 時間超過の自動調整ポイントの分離: `menuService.adjustToDuration()` をエクスポート（実装は後続）。APIルートではなくサービス層に拡張ポイントを固定。

## 成果物（完了の定義）
- 型: `types/menu.ts` に `GeneratedMenuData` を含め、呼出側の型依存が統一。
- JSON抽出: `lib/json-sanitizer.ts` を全クライアント/処理が参照。
- サービス層: `app/api/*` がサービス関数を呼ぶだけの構造へ簡素化。
- DB: インポートで接続実行されないことを確認（遅延初期化）。
- CORS: 単一の構成点に集約され、許可範囲が最小化。
- 埋め込み: 新モデルへ移行し、異常時の扱いが明文化。
- API/AI: `lib/prompts/*` へ分割済み、`AI_MODEL_CONFIGS` の共通IF適用、`menuService.adjustToDuration()` の拡張ポイントを用意。

## 影響範囲/リスク
- 既存APIルートのimport経路変更に伴うビルドエラーの可能性。
- 型の厳密化により既存コードのシグネチャ不一致が顕在化。
- JSONサニタイズ仕様統一による微妙な挙動差。テストで吸収。

## ロールバック/移行メモ
- 各タスクは小さなPR/コミット単位で実施し、段階的に切替。
- 既存関数のエイリアス/デプリケーション期間を短期設定。
- 失敗時は該当コミットを単体で戻せる粒度を維持。

## 関連（参考）
- `memory_bank/ARCHITECTURE.md`（全体構成）
- `lib/ai-clients.ts`, `lib/ai-response-processor.ts`, `lib/neon-db.ts`, `lib/embedding.ts`
