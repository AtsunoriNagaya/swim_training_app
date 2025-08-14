import type { Metadata } from "next/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Shield, Gavel, Key, AlertTriangle, FileText, Info } from "lucide-react";

export const metadata: Metadata = {
  title: "利用規約",
  description: "本サービスのご利用にあたっての条件を定める規約です",
};

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-3 gradient-text">利用規約</h1>
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
              本規約は、本サービス（水泳部練習メニュー作成アプリ）のご利用条件を定めるものです。ご利用の前に必ずお読みいただき、同意の上でご利用ください。
            </CardDescription>
          </CardHeader>
        </Card>
      </section>

      <Separator className="my-8 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20" />

      {/* 適用範囲と同意 */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Gavel className="h-6 w-6 text-primary" />
          適用範囲と同意
        </h2>
        <Card className="card-hover border-primary/20">
          <CardContent className="pt-6 text-sm text-muted-foreground">
            <ul className="list-disc list-inside space-y-1">
              <li>本サービスを利用した時点で、本規約に同意したものとみなします。</li>
              <li>未成年の方は、親権者など法定代理人の同意を得てご利用ください。</li>
              <li>本規約は必要に応じて改定される場合があります。改定後の規約は、本ページに掲載した時点で効力を生じます。</li>
            </ul>
          </CardContent>
        </Card>
      </section>

      <Separator className="my-8 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20" />

      {/* サービスの内容 */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          サービスの内容
        </h2>
        <Card className="card-hover border-primary/20">
          <CardContent className="pt-6 text-sm text-muted-foreground">
            <ul className="list-disc list-inside space-y-1">
              <li>AI を活用して、水泳の練習メニューを自動生成・保存・参照できます。</li>
              <li>過去のメニューを参考情報として活用する機能（RAG）を提供します（任意）。</li>
              <li>生成結果は PDF / CSV 形式でダウンロードできます。</li>
            </ul>
          </CardContent>
        </Card>
      </section>

      <Separator className="my-8 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20" />

      {/* アカウント・API キー */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Key className="h-6 w-6 text-primary" />
          アカウント・API キー
        </h2>
        <Card className="card-hover border-primary/20">
          <CardContent className="pt-6 text-sm text-muted-foreground">
            <ul className="list-disc list-inside space-y-1">
              <li>外部 AI サービスの API キーは、利用者の責任で適切に管理してください。</li>
              <li>API キーの不正使用・紛失・漏えい等により生じた損害について、当方は責任を負いません。</li>
              <li>API 利用に伴う各社サービスの料金は、利用者が負担します。</li>
            </ul>
          </CardContent>
        </Card>
      </section>

      <Separator className="my-8 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20" />

      {/* 禁止事項 */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          禁止事項
        </h2>
        <Card className="card-hover border-primary/20">
          <CardContent className="pt-6 text-sm text-muted-foreground">
            <ul className="list-disc list-inside space-y-1">
              <li>法令または公序良俗に反する行為</li>
              <li>第三者の権利・利益を侵害する行為（著作権、プライバシー等）</li>
              <li>不正アクセス、情報の改ざん・破壊、スパム等の迷惑行為</li>
              <li>本サービスの運営を妨げる行為、想定外の過度な負荷を与える行為</li>
              <li>不正な目的での利用、生成結果の不適切な二次利用</li>
            </ul>
          </CardContent>
        </Card>
      </section>

      <Separator className="my-8 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20" />

      {/* 生成コンテンツと責任 */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-primary" />
          生成コンテンツと免責
        </h2>
        <Card className="card-hover border-primary/20">
          <CardContent className="pt-6 text-sm text-muted-foreground">
            <ul className="list-disc list-inside space-y-1">
              <li>AI による出力は常に正確・完全であることを保証しません。必要に応じて内容をご確認ください。</li>
              <li>健康・安全に関わる判断は、適切な指導者・専門家の確認を前提としてください。</li>
              <li>本サービスの利用または利用不能から生じる損害について、当方は一切の責任を負いません（法令で認められる範囲）。</li>
            </ul>
          </CardContent>
        </Card>
      </section>

      <Separator className="my-8 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20" />

      {/* 個人情報の取扱い */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          個人情報の取扱い
        </h2>
        <Card className="card-hover border-primary/20">
          <CardContent className="pt-6 text-sm text-muted-foreground">
            <p>
              個人情報の取扱いについては、<a href="/privacy" className="text-primary underline">プライバシーポリシー</a> に従います。
            </p>
          </CardContent>
        </Card>
      </section>

      <Separator className="my-8 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20" />

      {/* 規約の変更・連絡方法・準拠法 */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Gavel className="h-6 w-6 text-primary" />
          規約の変更・連絡方法・準拠法
        </h2>
        <Card className="card-hover border-primary/20">
          <CardContent className="pt-6 text-sm text-muted-foreground">
            <ul className="list-disc list-inside space-y-1">
              <li>本規約の変更は、本ページでの告知により行います。</li>
              <li>お問い合わせは、アプリ内のヘルプに記載の方法に従ってください。</li>
              <li>本規約は日本法に準拠し、紛争が生じた場合は運営者の所在地を管轄する裁判所を第一審の専属的合意管轄とします。</li>
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
