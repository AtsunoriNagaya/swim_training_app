import type { Metadata } from "next/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Info, Sparkles, FileText, History, Printer } from "lucide-react";

export const metadata: Metadata = {
  title: "アプリについて",
  description: "水泳部練習メニュー作成アプリの概要と主な特徴を紹介します",
};

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-3 gradient-text">水泳部練習メニュー作成アプリ</h1>
        <p className="text-muted-foreground">AIを活用して効率的に練習メニューを作成・保存・再利用</p>
      </div>

      {/* 概要（利用者向け） */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Info className="h-6 w-6 text-primary" />
          概要
        </h2>
        <Card className="card-hover border-primary/20">
          <CardHeader>
            <CardDescription>
              本アプリは、水泳部員向けの練習メニューを AI で自動生成する Web アプリです。OpenAI（GPT-4o）、Google（Gemini 2.0 Flash）、Anthropic（Claude 3.5 Sonnet）に対応し、負荷レベル・時間・特記事項から最適なメニューを提案します。生成したメニューは保存・履歴参照ができ、過去の内容も参考にできます。
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">GPT-4o</Badge>
              <Badge variant="secondary" className="bg-secondary/10 text-secondary border-secondary/20">Claude 3.5 Sonnet</Badge>
              <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20">Gemini 2.0 Flash</Badge>
              <Badge variant="outline">RAG 参照</Badge>
            </div>
          </CardContent>
        </Card>
      </section>

      <Separator className="my-8 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20" />

      {/* 主な特徴（利用者向け） */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          主な特徴
        </h2>
        <div className="space-y-4">
          <Card className="card-hover border-primary/20">
            <CardHeader>
              <CardTitle>AI によるメニュー自動生成</CardTitle>
              <CardDescription>3 つの AI から選んで、条件に応じた最適なメニューを生成</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>OpenAI / Google / Anthropic の API キーをアプリ内で入力して利用</li>
                <li>負荷レベル・時間・特記事項を元に構成を自動設計</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="card-hover border-secondary/20">
            <CardHeader>
              <CardTitle>過去メニューの参考（RAG）</CardTitle>
              <CardDescription>過去のメニューから類似内容を探して、生成時の参考に活用</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>類似度スコアと上位の候補を表示</li>
                <li>トグルで機能のオン/オフ切替が可能</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="card-hover border-accent/20">
            <CardHeader>
              <CardTitle>自動時間調整・履歴・ダウンロード</CardTitle>
              <CardDescription>日々の運用で使いやすい機能を搭載</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                <li>指定時間を超過した場合、内容を自動調整</li>
                <li>生成履歴を保存・再利用</li>
                <li>PDF / CSV 形式で保存可能</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator className="my-8 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20" />

      {/* 出力とサポート */}
      <section className="mb-6">
        <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
          <Printer className="h-6 w-6 text-primary" />
          出力とサポート
        </h2>
        <Card className="card-hover border-primary/20">
          <CardContent className="pt-6">
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>PDF 保存: 結果画面の「ダウンロード → PDF形式」で印刷ダイアログから保存</li>
              <li>CSV 保存: 結果を表形式でエクスポート可能</li>
              <li>詳しい使い方は <a href="/help" className="text-primary underline">ヘルプページ</a> をご覧ください</li>
            </ul>
          </CardContent>
        </Card>
      </section>

      <div className="mt-8 text-xs text-muted-foreground flex items-center gap-2">
        <History className="h-4 w-4" />
        <span>このページは利用者向けに README の内容を要約しています。</span>
      </div>
    </div>
  );
}
