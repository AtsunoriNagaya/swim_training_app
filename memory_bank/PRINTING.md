# Markdown→HTML 印刷（PDF保存）

本アプリのPDF出力は「Markdown→HTML→ブラウザ印刷」を使います。実装は2通りあり、現在のUIはポップアップ方式を採用していますが、/print ページ方式も同梱しています。

## 方式A: ポップアップ（現行既定）

- エントリ: `lib/markdown/printPopup.ts` の `openPrintPopup(markdown, { title? })`
- 挙動: `window.open()` したタブに HTML とスタイルを書き込み、`window.print()` を自動実行（約200ms遅延）
- 利点: シンプル・依存が少ない（URL遷移不要）

使用例:
```ts
import { toMarkdownTable } from '@/lib/markdown/mdTable'
import { openPrintPopup } from '@/lib/markdown/printPopup'

const mdTable = toMarkdownTable(
  ['内容', '距離', '本数', '合計距離', 'サイクル', '休憩', '所要時間'],
  [ ['Drill', '50m', 4, '200m', '1:30', '-', '8分'] ],
  ['left','right','right','right','left','right','right']
)

const markdown = `# 練習メニュー\n\n${mdTable}`
openPrintPopup(markdown, { title: '印刷プレビュー' })
```

主なスタイル（printPopup内で内蔵）：
- `@page A4; margin: 16mm`
- 日本語フォント指定（Noto Sans JP 等）
- `table { table-layout: fixed; }` と `word-break/overflow-wrap` で折返し制御

## 方式B: /print ページ

- エントリ: `app/print/PrintClient.tsx`（ページ: `app/print/page.tsx`）
- データ受け渡し: 以下のいずれか
  1) `window.name = 'PRINT_MD:' + base64(markdown)` に設定して `/print` を `window.open()`
  2) `localStorage.setItem(key, base64(markdown))` → `/print#${encodeURIComponent(key)}` を開く（読み後に削除）
  3) `/print?data=${encodeURIComponent(base64(markdown))}` でクエリ渡し
- ページ側は読み取り後、約300msで `window.print()` 実行

補足:
- ページは `@page A4/16mm` や表の固定レイアウト等、ポップアップ方式と同等のスタイルを内蔵
- `window.name` 方式は同タブ継承、`hash+localStorage` は別タブ安全搬送に便利

ヘルパー関数:
- `lib/markdown/openPrintPreview.ts` の `openPrintPreview(markdown, target?)` を使うと、`localStorage#hash` を優先して安全に `/print` を開けます。
```ts
import openPrintPreview from '@/lib/markdown/openPrintPreview'

openPrintPreview(markdown)          // 別タブで /print を開いて印刷
openPrintPreview(markdown, '_self') // 同タブで /print を開いて印刷
```

## Markdownレンダラの仕様

- 実装: `lib/markdown/miniMarkdown.ts`
- 対応: 見出し、段落、太字/斜体、インラインコード、水平線、リンク、GFM風テーブル
- テーブル: `toMarkdownTable` と組み合わせると、空セルは `\u00A0`（NBSP）で保護、列方向の `left/center/right` を整形

## レイアウト調整のポイント
- 表崩れ対策: `table-layout: fixed`、セル内 `word-break: break-word; overflow-wrap: anywhere`
- CJK対策: 日本語フォント指定を優先（Noto Sans JP 等）
- 自動印刷: ロード後に `window.print()` を呼び出し（200〜300ms遅延）

## トラブルシュート
- 何も表示されない/印刷されない: ポップアップブロッカーを解除、別タブでの `window.open` を許可
- 文字がはみ出す: 列数や文言を調整、セル内の改行/半角化、スタイルの余白を微調整
- 余白が合わない: `@page` の `margin` を `printPopup.ts` または `/print` のスタイルで変更
