# 水泳部練習メニュー作成アプリ

## 概要

水泳部員向けの練習メニューを、AIを活用して効率的に作成するWebアプリケーションです。OpenAI (gpt-4o), Google (gemini-2.0-flash), Anthropic (claude-3.5-sonnet) のAIモデルを使用し、負荷レベルや時間、特記事項に基づいて最適なメニューを生成します。生成されたメニューデータは Vercel KV と Vercel Blob に保存されます。
過去のメニューデータ（時間情報）をAI生成時の参考にしたり、AIが生成したメニューが指定時間を超過した場合に自動調整する機能も備えています。

## 特徴

*   **AIによるメニュー自動生成**: OpenAI (gpt-4o), Google (gemini-2.0-flash), Anthropic (claude-3.5-sonnet) のAIモデルから選択し、負荷レベルや時間、特記事項に基づいて練習メニューを自動生成します。
*   **過去メニューの参照 (RAG)**: 指定された時間に近い過去の練習メニュー情報を検索し、AIがメニュー生成時の参考データとして活用します（簡易的な時間ベースのフィルタリング）。
*   **自動時間調整**: AIが生成したメニューが指定時間を超過した場合、自動的に内容を調整して時間内に収めます。
*   **メニュー履歴**: 過去に生成したメニューの履歴を確認し、再利用や参考にすることができます。
*   **柔軟な出力形式**: 生成したメニューをクライアントサイドでPDFやCSV形式でダウンロードできます。

## 技術スタック

*   Next.js (v15.2.4)
*   React (v19)
*   TypeScript (v5)
*   Tailwind CSS
*   Radix UI
*   AI Models:
    *   OpenAI API (gpt-4o)
    *   Google Gemini API (gemini-2.0-flash)
    *   Anthropic Claude API (claude-3.5-sonnet)
*   Data Storage:
    *   Vercel KV (インデックスURL)
    *   Vercel Blob (メニューデータ本体、インデックスファイル)
*   File Generation (Client-side):
    *   jsPDF + jspdf-autotable (PDF生成)
    *   csv-stringify (CSV生成)

## APIキーの準備

本アプリケーションでは、以下のAIサービスのいずれかのAPIキーが必要です：

- OpenAI API (GPT-4)
- Google API (Gemini)
- Anthropic API (Claude)

APIキーは環境変数ではなく、アプリケーション内のフォームで直接入力する形式となっています。各APIキーは、それぞれの公式サイトで取得してください。

## Vercel KV & Blob 設定

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
    *   Node.js (v22.x 推奨)
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

*   メニューのカスタマイズ機能（手動編集など）
*   より高度なRAG機能（ベクトル検索など）の実装
*   ファイルアップロード機能の改善（多様なフォーマット対応、解析精度向上）
*   UI/UX の改善
*   多言語対応
*   PDFテンプレートのカスタマイズ機能

## 開発者

長屋篤典

## ライセンス

MIT
