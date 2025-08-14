# AIモデルの使い分けとAPIキー手順

このドキュメントでは、利用可能なAIモデルの特性と使い分け、ならびにAPIキー取得の実務手順をまとめます。アプリ内ではメニュー生成時に任意のモデルを選択でき、APIキーはフォームから入力します（環境変数ではありません）。

## モデルの選択指針

### OpenAI GPT-4o
- 特徴: 高品質で汎用的、指示解釈が安定
- 用途: 複雑/専門性の高いメニュー生成が必要な場合
- 料金目安: $0.005/1K tokens
- 推奨度: 高品質を必要とするケース

### Anthropic Claude 3.5 Sonnet
- 特徴: 安全性・一貫性に強み、日常利用に好適
- 用途: バランス重視の通常運用
- 料金目安: $3/1M tokens
- 推奨度: デイリーユースの本命候補

### Google Gemini 2.0 Flash
- 特徴: 高速・軽量、マルチモーダル対応
- 用途: 初回利用や学習目的、コスト重視
- 料金目安: $0.075/1M tokens
- 推奨度: はじめての利用/スピード重視

使い分けの目安:
- 初回・学習: Gemini 2.0 Flash
- ふだん使い: Claude 3.5 Sonnet
- 高品質重視: GPT-4o

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

