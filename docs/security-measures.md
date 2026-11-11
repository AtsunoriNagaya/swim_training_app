# 依存パッケージのセキュリティ対策

このリポジトリで行っている、依存パッケージ（npm と GitHub Actions）に関するセキュリティ対策をまとめます。中心にあるのは、公開直後の悪意あるバージョンを取り込まないための対策です。npm では、乗っ取られたアカウントから悪意あるバージョンが公開され、数時間から数日で取り下げられる事例が続いています（ゼロデイ型のサプライチェーン攻撃）。

## 1. 公開直後のバージョンを取り込まない

二段構えにしています。

| 仕組み | 設定場所 | 内容 |
|---|---|---|
| Dependabot の cooldown | `.github/dependabot.yml` | npm は公開から 7 日（メジャー更新は 14 日）たつまで更新 PR を作らない。GitHub Actions は 7 日 |
| pnpm の minimumReleaseAge | `pnpm-workspace.yaml` | 依存を解決するとき（`pnpm add`、`pnpm update`、lockfile の作り直し）に、公開から 3 日（4320 分）未満のバージョンを選ばない。間接的に入る依存にも効く |

pnpm の制限が効くのは依存を解決するときだけです。lockfile がそろっている状態での `pnpm install --frozen-lockfile`（CI や Vercel）では、公開日を改めて確認しません。pnpm 側の日数を Dependabot より短くしているのは、Dependabot が lockfile を更新するときに、この制限に引っかからないようにするためです。

セキュリティ更新は cooldown の対象外なので、修正版が出ればすぐに PR が作られます。修正版が公開から 3 日未満のときに手元で `pnpm add` などを使って取り込む場合は、pnpm の制限で失敗します。その場合は `pnpm-workspace.yaml` の `minimumReleaseAgeExclude` にバージョンを指定して一時的に除外し、3 日たったら削除してください。

## 2. 更新の自動化と、マージ前のチェック

Dependabot は毎週月曜 9:00（日本時間）に更新を確認します。npm の通常の更新は、patch と minor をまとめて 1 本の PR にし、メジャー更新は個別の PR にします。GitHub Actions の更新とセキュリティ更新は、このまとめの対象外で、個別の PR になります。

main にはルールセット「main: 必須チェック」を設定していて、次の 2 つが成功しないとマージできません。管理者だけはルールを迂回できます。

- `typecheck`（`.github/workflows/ci.yml`）：`tsc --noEmit` を実行する。`next.config.mjs` で `typescript.ignoreBuildErrors: true` にしているため、Vercel のビルドだけでは型エラーを検出できない
- `Vercel`：プレビュー環境のビルド

patch と minor の更新は、`.github/workflows/dependabot-auto-merge.yml` が自動マージを予約します。実際にマージされるのは、上の 2 つのチェックが成功したあとです。メジャー更新は自動マージの対象外で、人が確認してからマージします。

自動マージの workflow は、Dependabot の PR に書き込み権限を持たせるため `pull_request_target` で動かしています。この workflow は PR のコードを checkout も実行もしないため、PR 側のコードが書き込み権限付きで動くことはありません。

Jest は以前から失敗しているテストがあるため、自動マージの判定には使っていません。

## 3. GitHub Actions をコミット SHA で固定する

workflow で使う Actions は、タグ（`v7` など）ではなくコミット SHA で指定しています。タグは後から別のコミットに付け替えられるため、Actions のリポジトリが乗っ取られると、悪意あるコードが実行されるおそれがあります。SHA の更新は Dependabot が行います。

## 4. 依存パッケージのビルドスクリプトを実行しない

pnpm 10 以降は、依存パッケージの install 時のスクリプト（postinstall など）を既定で実行しません。`pnpm-workspace.yaml` の `allowBuilds` で、実行が不要なもの（`@parcel/watcher`、`msw`、`protobufjs`）を明示しています。新しく実行を許可する場合は、そのスクリプトの内容を確認してから追加してください。

## 5. 自動で上げないメジャー更新

次のパッケージは、メジャー更新でコードの書き換えが必要になるため、`dependabot.yml` で自動更新の対象外にしています。上げるときは手動で対応してください。

| パッケージ | 理由 |
|---|---|
| tailwindcss | Tailwind 4 は PostCSS 設定と CSS の書き換えが必要 |
| tailwind-merge | 3 系は Tailwind 4 専用 |
| node-fetch | 3 系は ESM 専用で、現在の Jest の設定では読み込めない |
| react-day-picker | `components/ui/calendar.tsx` が 8 系の API を使っている |
| msw | 3 系は ESM 専用で、Jest ではリクエストの差し替えが動かない |
| typescript | 7 系はネイティブ実装への移行版のため、周辺ツールの対応を確認してから上げる |
| recharts | 3 系は `components/ui/chart.tsx` の型が非対応 |

## 6. 推移的依存の脆弱性への対応

直接の依存ではなく、依存先がさらに使っているパッケージに脆弱性がある場合は、まず上流の更新を待ちます。上流が固定バージョンを使っていて更新できない場合は、`pnpm-workspace.yaml` の `overrides` で修正版に置き換えます。現在は次の 1 件です。

- `@vercel/cli-config` が使う `zod` を `^4.6.6` に置き換えている（GHSA-mrhx-c7xc-m3w5）。`@vercel/oidc` が `@vercel/cli-config` 0.3.8 以降を使うようになったら削除する

## 7. リスクを許容するアラート

次の 2 件は、修正の手段がないか、修正すると動かなくなります。影響範囲を確認したうえで、リスクを許容する（アラートを「Tolerable risk」で閉じる）判断にしています。どちらも開発時のテストでしか使わず、本番のアプリには含まれません。

| パッケージ | 脆弱性 | 許容する理由 |
|---|---|---|
| minimatch 9.0.9 / 10.2.6 | パターンの展開によるサービス拒否（GHSA-g3hv-75wg-m249） | Jest のカバレッジ集計（test-exclude、glob）経由でのみ使われる。パターンはリポジトリの設定から渡すものだけで、外部の入力は通らない。修正版の 11 系は API が削除されていて、glob 10 が動かなくなる |
| deepmerge 4.3.1 | プロトタイプ汚染（GHSA-gcqx-w48m-w2h4） | Jest が自分の設定を読み込むときにのみ使われ、外部の入力は通らない。修正版がまだ公開されていない |

上流（Jest、test-exclude）が修正版に対応したら、Dependabot の更新で解消される見込みです。

## 運用上の注意

- lockfile は Vercel と同じ pnpm 10.28.0 で更新してください（例：`npx pnpm@10.28.0 install --lockfile-only`）。pnpm 11 で更新すると、lockfile の書式が変わり差分が大きくなります。
- Jest は `pnpm test` で実行してください。msw 2 の依存の一部が ESM 専用のため、`--experimental-vm-modules` を付けて Jest を起動しています。
- `.github/dependabot.yml` に誤りがあると、Dependabot は更新もコメントへの応答も行わなくなります。変更したときは、PR の「.github/dependabot.yml」チェックが成功していることを確認してください。
