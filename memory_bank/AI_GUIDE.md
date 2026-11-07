# AIモデルの使い分けとAPIキー手順

このドキュメントでは、利用可能なAIモデルの特性と使い分け、ならびにAPIキー取得の実務手順をまとめます。アプリ内ではメニュー生成時に任意のモデルを選択でき、APIキーはフォームから入力します（環境変数ではありません）。

## モデルの選択指針

いずれも各社の現行モデルのうち低コストのものを採用しています（2026年11月時点）。モデルを変更するときは `lib/ai-config.ts` の `model`（と表示名）を書き換えるだけで、他のコードは参照のみです。

### OpenAI GPT-6 Luna（`gpt-6-luna`）
- 特徴: 低コスト・高速。gpt-4o の公式後継
- 料金目安: 入力 $0.10 / 出力 $0.50（100万トークンあたり）
- 備考: 推論モデルのため temperature は指定しない

### Anthropic Claude Haiku 5.5（`claude-haiku-5-5`）
- 特徴: 低コスト・高速。安全性と一貫性に強み
- 料金目安: 入力 $0.10 / 出力 $0.50（100万トークンあたり、プロンプト10万トークン以下）
- 備考: adaptive thinking が既定で有効。thinking 分も max_tokens に含まれるため 16000 を指定している

### Google Gemini Flash（`gemini-flash-latest`）
- 特徴: Google 公式の自動追従エイリアス。Flash 系の新版が出ると自動で切り替わる（切り替えの2週間前にメール通知）
- 料金目安: 無料枠あり。有料枠は参照先モデルにより異なる（公式料金ページ参照）
- 備考: モデル廃止のたびに書き換える必要がない

使い分けの目安:
- 初回・学習、無料で試す: Gemini Flash
- ふだん使い: Claude Haiku 5.5
- OpenAI のキーを持っている: GPT-6 Luna

### モデル廃止時の対応
- OpenAI / Anthropic は日付なしのモデル ID を使っているため、同一バージョン内の更新は自動で追従する。メジャーバージョンが廃止されたときだけ `lib/ai-config.ts` の `model` と表示名を更新する。
- 画面に「指定されたモデルが見つかりません」と出たら廃止の合図。各社の非推奨一覧（OpenAI: Deprecations、Anthropic: Model deprecations、Google: Release notes）で後継を確認する。

## RAG（過去メニュー参照）

- Embeddings: OpenAI `text-embedding-3-small`（1536次元）
- 検索: pgvector によるコサイン類似度検索
- 表示: 類似度を%表示し、上位5件を参照
- 設定: 検索用 OpenAI APIキーは生成用とは別欄で入力可

## APIキーについて

アプリ内の入力欄から各サービスのAPIキーを設定します。キーは絶対に共有/公開しないでください。

### OpenAI APIキー取得
1. https://platform.openai.com にアクセス
2. アカウント作成/ログイン
3. 「API Keys」→「Create new secret key」
4. キーを安全に保管

### Anthropic APIキー取得（Claude）
1. https://console.anthropic.com にアクセス
2. アカウント作成/ログイン
3. 「Get API Key」から発行
4. キーを安全に保管

### Google Gemini APIキー取得
1. https://makersuite.google.com にアクセス（Google AI Studio）
2. ログイン後、「Get API key」
3. キーを安全に保管

### 取り扱い上の注意
- 公開リポジトリへコミット禁止
- 漏洩時は速やかに再発行
- 利用量/課金の定期確認を推奨

