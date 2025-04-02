# 水泳部練習メニュー作成アプリ

## 概要

水泳部員向けの練習メニューを、AIを活用して効率的に作成するWebアプリケーションです。 OpenAI, Gemini, ClaudeのAIモデルを使用し、負荷レベルや時間、特記事項に基づいて最適なメニューを生成します。
過去のメニューをアップロードしてAIの学習データとして活用することも可能です。

## 特徴

*   **AIによるメニュー自動生成**: OpenAI, Gemini, ClaudeのAIモデルから選択し、負荷レベルや時間、特記事項に基づいて練習メニューを自動生成します。
*   **過去メニューの活用**: 過去の練習メニューをCSVやPDF形式でアップロードし、AIがメニュー生成時の参考データとして活用します。
*   **メニュー履歴**: 過去に生成したメニューの履歴を確認し、再利用や参考にすることができます。
*   **柔軟な出力形式**: 生成したメニューはJSON形式で表示されます。

## 技術スタック

*   Next.js
*   React
*   TypeScript
*   Tailwind CSS
*   Radix UI
*   OpenAI API
*   Google Gemini API
*   Anthropic Claude API
*   Vercel KV (データストレージ)
*   jsPDF
*   csv-stringify

## 環境変数の設定

以下の環境変数を`.env.local`ファイルに設定してください。

```
# AI API設定
OPENAI_API_KEY=YOUR_OPENAI_API_KEY
GOOGLE_API_KEY=YOUR_GOOGLE_API_KEY (Gemini API を使用する場合)
ANTHROPIC_API_KEY=YOUR_ANTHROPIC_API_KEY (Claude API を使用する場合)

# Vercel KV設定 (Vercelにデプロイする場合は自動で設定されます)
KV_URL=YOUR_KV_URL
KV_REST_API_URL=YOUR_KV_REST_API_URL
KV_REST_API_TOKEN=YOUR_KV_REST_API_TOKEN
KV_REST_API_READ_ONLY_TOKEN=YOUR_KV_REST_API_READ_ONLY_TOKEN
```

各APIキーは、それぞれの公式サイトで取得してください。

## 開発者

長屋篤典

## セットアップ

1.  **環境構築:**
    *   Node.js (v20.x 以上)
    *   pnpm (推奨) または npm
2.  **依存関係のインストール:**

    ```bash
    pnpm install
    ```
    または
    ```bash
    npm install
    ```
3.  **環境変数の設定:**
    *   `.env.local` ファイルを作成し、以下の環境変数を設定します。

        ```
        OPENAI_API_KEY=YOUR_OPENAI_API_KEY
        GOOGLE_API_KEY=YOUR_GOOGLE_API_KEY (Gemini API を使用する場合)
        ANTHROPIC_API_KEY=YOUR_ANTHROPIC_API_KEY (Claude API を使用する場合)
        ```
        各APIキーは、それぞれの公式サイトで取得してください。

4.  **ローカル開発時のデータストレージ:**
    *   ローカル開発時は、Vercel KVの代わりにChromaDBを使用することもできます。
    *   その場合は、ChromaDBをローカルにインストールし、起動してください。

## 開発サーバーの起動

```bash
pnpm dev
```
または
```bash
npm run dev
```

## デプロイ

### Vercelへのデプロイ

1. [Vercel](https://vercel.com)にアカウントを作成し、ログインします。
2. GitHubリポジトリと連携し、このプロジェクトをインポートします。
3. 環境変数を設定します：
   - `OPENAI_API_KEY`
   - `GOOGLE_API_KEY` (Gemini APIを使用する場合)
   - `ANTHROPIC_API_KEY` (Claude APIを使用する場合)
4. Vercel KVをセットアップします：
   - Vercelダッシュボードで「Storage」タブを選択
   - 「KV」を選択し、新しいKVデータベースを作成
   - プロジェクトにKVデータベースを接続すると、必要な環境変数が自動的に設定されます
5. デプロイを実行します。

### その他のプラットフォームへのデプロイ

他のプラットフォームにデプロイする場合は、Vercel KVの代わりに別のデータストレージソリューションを使用する必要があります。`app/api/chromadb-alternative.md`ファイルに記載されている代替案を参照してください。

## 今後の展望

*   メニューのカスタマイズ機能
*   練習メニューの共有機能
*   UI/UX の改善
*   多言語対応

## 開発者

長屋篤典

## ライセンス

MIT
