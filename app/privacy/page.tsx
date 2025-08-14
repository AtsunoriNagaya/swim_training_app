import type { Metadata } from "next/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Shield, Info, Database, FileText, Upload as UploadIcon, Key, Lock, ExternalLink, Cookie } from "lucide-react";

export const metadata: Metadata = {
  title: "プライバシーポリシー",
  description: "本サービスにおける個人情報・データの取扱いについて定めます",
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-3 gradient-text">プライバシーポリシー</h1>
        <p className="text-muted-foreground">最終更新日: 2025-08-15</p>
      </div>

      {/* はじめに */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Info className="h-6 w-6 text-primary" />
          はじめに
        </h2>
        <Card className="card-hover border-primary/20">
          <CardHeader>
            <CardDescription>
              本ポリシーは、本サービス（水泳部練習メニュー作成アプリ）におけるデータの収集・利用・保存・共有に関する基本方針を示します。
            </CardDescription>
          </CardHeader>
        </Card>
      </section>

      <Separator className="my-8 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20" />

      {/* 収集する情報 */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          収集・扱う情報
        </h2>
        <Card className="card-hover border-primary/20">
          <CardContent className="pt-6 text-sm text-muted-foreground">
            <ul className="list-disc list-inside space-y-1">
              <li>利用者が入力する条件等（負荷レベル、時間、特記事項 など）</li>
              <li>AI が生成したメニューおよび履歴・メタデータ</li>
              <li>任意: アップロードしたファイル（CSV/PDF）の情報</li>
              <li>API キー（OpenAI / Google / Anthropic）: メニュー生成・検索のために送信・利用します</li>
              <li>技術情報: エラー内容、処理結果、アクセス日時等の最小限のログ</li>
            </ul>
          </CardContent>
        </Card>
      </section>

      <Separator className="my-8 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20" />

      {/* 利用目的 */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          利用目的
        </h2>
        <Card className="card-hover border-primary/20">
          <CardContent className="pt-6 text-sm text-muted-foreground">
            <ul className="list-disc list-inside space-y-1">
              <li>練習メニューの生成・保存・再利用の提供</li>
              <li>RAG による過去メニュー参照の提供（任意機能）</li>
              <li>サービスの品質改善、不具合対応、セキュリティ確保</li>
              <li>必要に応じた利用者からの問い合わせ対応</li>
            </ul>
          </CardContent>
        </Card>
      </section>

      <Separator className="my-8 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20" />

      {/* 保存場所と期間 */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Database className="h-6 w-6 text-primary" />
          保存場所と期間
        </h2>
        <Card className="card-hover border-primary/20">
          <CardContent className="pt-6 text-sm text-muted-foreground space-y-3">
            <div>
              <h3 className="font-medium text-foreground mb-1">生成メニュー・履歴</h3>
              <p>Neon Database（PostgreSQL + pgvector）に保存されます。保存期間は運用方針に基づき、利用目的の達成に必要な範囲で保持します。RAG を OFF にしても保存は行われ、生成時の参照のみ停止されます。</p>
            </div>
            <div>
              <h3 className="font-medium text-foreground mb-1">アップロードファイル</h3>
              <p>現在の実装では、ブラウザのローカルストレージに保存されます（PDF内容はサーバーに保存しません）。端末のストレージを削除すると消去されます。</p>
            </div>
            <div>
              <h3 className="font-medium text-foreground mb-1">API キー</h3>
              <p>メニュー生成や検索の処理に必要な範囲でサーバーへ送信し、処理後はサーバー側で保存しません（データベースへ保存・記録しない実装）。</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <Separator className="my-8 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20" />

      {/* 第三者提供・外部サービス */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <ExternalLink className="h-6 w-6 text-primary" />
          第三者提供・外部サービス
        </h2>
        <Card className="card-hover border-primary/20">
          <CardContent className="pt-6 text-sm text-muted-foreground space-y-2">
            <p>
              本サービスは、機能提供のために以下の外部サービスを利用します。入力内容や生成のための情報が各サービスに送信される場合があります。
            </p>
            <ul className="list-disc list-inside space-y-1">
              <li>OpenAI API（メニュー生成、Embeddings）</li>
              <li>Google Generative AI（Gemini）</li>
              <li>Anthropic Claude</li>
              <li>Neon（データベースのホスティング）</li>
              <li>Vercel Blob（オプションのファイル保存）</li>
            </ul>
            <p>法令に基づく場合を除き、これら以外の第三者に個人情報を提供することはありません。</p>
          </CardContent>
        </Card>
      </section>

      <Separator className="my-8 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20" />

      {/* 安全管理措置 */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Lock className="h-6 w-6 text-primary" />
          安全管理措置
        </h2>
        <Card className="card-hover border-primary/20">
          <CardContent className="pt-6 text-sm text-muted-foreground">
            <ul className="list-disc list-inside space-y-1">
              <li>通信の暗号化（HTTPS）など、合理的な安全対策に努めます。</li>
              <li>API キー等の機微情報は必要な処理に限って使用し、保存を行いません。</li>
              <li>アクセスログ・エラーログは障害対応やセキュリティのため最小限の範囲で取得します。</li>
            </ul>
          </CardContent>
        </Card>
      </section>

      <Separator className="my-8 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20" />

      {/* クッキー等の利用 */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Cookie className="h-6 w-6 text-primary" />
          クッキー等の利用
        </h2>
        <Card className="card-hover border-primary/20">
          <CardContent className="pt-6 text-sm text-muted-foreground">
            <p>
              現時点で、解析目的のトラッキング用クッキーは使用していません。将来的に利用する場合は、本ポリシーを更新し明示します。
            </p>
          </CardContent>
        </Card>
      </section>

      <Separator className="my-8 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20" />

      {/* 利用者の権利 */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          利用者の権利
        </h2>
        <Card className="card-hover border-primary/20">
          <CardContent className="pt-6 text-sm text-muted-foreground">
            <ul className="list-disc list-inside space-y-1">
              <li>保有するデータの確認・修正・削除の依頼が可能です。</li>
              <li>RAG 参照はアプリ内のトグルで ON/OFF できます。OFF 時は生成時に過去データを参照しません。</li>
              <li>権利行使の手続きは、本サービスのヘルプに記載の方法に従ってください。</li>
            </ul>
          </CardContent>
        </Card>
      </section>

      <Separator className="my-8 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20" />

      {/* 規約との関係・改定・連絡先 */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Info className="h-6 w-6 text-primary" />
          規約との関係・改定・連絡先
        </h2>
        <Card className="card-hover border-primary/20">
          <CardContent className="pt-6 text-sm text-muted-foreground space-y-2">
            <p>本ポリシーは <a href="/terms" className="text-primary underline">利用規約</a> と一体として適用されます。</p>
            <p>内容は必要に応じて改定する場合があります。改定後は本ページに掲載した時点で効力を生じます。</p>
            <p>お問い合わせは、アプリ内のヘルプに記載の方法に従ってください。</p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
