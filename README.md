# 水泳部練習メニュー作成アプリ

## 概要

水泳部員向けの練習メニューを、AIを活用して効率的に作成するWebアプリケーションです。OpenAI, Gemini, ClaudeのAIモデルを使用し、負荷レベルや時間、特記事項に基づいて最適なメニューを生成します。生成されたメニューデータは Vercel Blob に保存されます。
過去のメニューをアップロードしてAIの学習データとして活用することも可能です。

## 特徴

*   **AIによるメニュー自動生成**: OpenAI, Gemini, ClaudeのAIモデルから選択し、負荷レベルや時間、特記事項に基づいて練習メニューを自動生成します。
*   **過去メニューの活用**: 過去の練習メニューをCSVやPDF形式でアップロードし、AIがメニュー生成時の参考データとして活用します。
*   **メニュー履歴**: 過去に生成したメニューの履歴を確認し、再利用や参考にすることができます。
*   **柔軟な出力形式**: 生成したメニューをPDFやCSV形式でダウンロードできます。PDFはテーブルレイアウトで見やすく整形されます。

## 技術スタック

*   Next.js (v15.2.4)
*   React (v19.x)
*   TypeScript
*   Tailwind CSS
*   Radix UI
*   OpenAI API
*   Google Gemini API
*   Anthropic Claude API
*   Vercel KV (メニューメタデータ、インデックス情報)
*   Vercel Blob (メニューデータ本体)
*   jsPDF + jspdf-autotable (PDF生成)
*   csv-stringify (CSV生成)

## APIキーの準備

本アプリケーションでは、以下のAIサービスのいずれかのAPIキーが必要です：

- OpenAI API (GPT-4)
- Google API (Gemini)
- Anthropic API (Claude)

APIキーは環境変数ではなく、アプリケーション内のフォームで直接入力する形式となっています。各APIキーは、それぞれの公式サイトで取得してください。

## Vercel KV設定

Vercelにデプロイする場合、以下の環境変数が自動で設定されます：

```
KV_URL=YOUR_KV_URL
KV_REST_API_URL=YOUR_KV_REST_API_URL
KV_REST_API_TOKEN=YOUR_KV_REST_API_TOKEN
KV_REST_API_READ_ONLY_TOKEN=YOUR_KV_REST_API_READ_ONLY_TOKEN
BLOB_READ_WRITE_TOKEN=YOUR_BLOB_READ_WRITE_TOKEN
```

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

## デプロイ

### Vercelへのデプロイ

1. [Vercel](https://vercel.com)にアカウントを作成し、ログインします。
2. GitHubリポジトリと連携し、このプロジェクトをインポートします。
3. Vercel KVとVercel Blobをセットアップします：
   - Vercelダッシュボードで「Storage」タブを選択
   - 「KV」を選択し、新しいKVデータベースを作成
   - 「Blob」を選択し、新しいBlobストレージを作成
   - プロジェクトにKVデータベースとBlobストレージを接続すると、必要な環境変数が自動的に設定されます
4. 以下のビルド設定を確認します：
   - ファイルアップロード機能を使用するページ（`app/upload/page.tsx`）では、`dynamic = 'force-dynamic'` を設定してサーバーサイドレンダリングの問題を回避
   - `jspdf-autotable` パッケージが `dependencies` に正しく含まれていることを確認
5. デプロイを実行します。

### その他のプラットフォームへのデプロイ

他のプラットフォームにデプロイする場合は、Vercel KVとVercel Blobの代わりに別のデータストレージソリューションを使用する必要があります。

## 今後の展望

*   メニューのカスタマイズ機能
*   練習メニューの共有機能
*   UI/UX の改善
*   多言語対応
*   メニュー生成のAIモデル選択機能の拡充
*   PDFテンプレートのカスタマイズ機能

## 開発者

長屋篤典

## ライセンス

MIT
