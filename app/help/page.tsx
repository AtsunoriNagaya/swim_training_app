import type { Metadata } from "next/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info, Key, Sparkles, Brain, Zap, Shield, FileText, Upload } from "lucide-react";

export const metadata: Metadata = {
  title: "ヘルプ - AIの使い方とAPIキー設定",
  description: "AIの種類と使い分け、APIキーの取得方法について詳しく説明します",
};

export default function HelpPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4 gradient-text">AIヘルプセンター</h1>
        <p className="text-muted-foreground text-lg">
          AIの種類と使い分け、APIキーの設定方法について詳しく説明します
        </p>
      </div>

      {/* メニュー生成の2つの方法セクション */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
          <FileText className="h-6 w-6 text-primary" />
          メニュー生成の2つの方法
        </h2>
        
        <div className="grid gap-6 md:grid-cols-2">
          {/* RAGなしでの生成 */}
          <Card className="card-hover border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                RAGなしでの生成
              </CardTitle>
              <CardDescription>
                基本的なAI知識のみを使用したメニュー生成
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">基本機能</Badge>
                  <span className="text-sm text-muted-foreground">誰でも利用可能</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  AIモデルの基本的な知識のみを使用してトレーニングメニューを生成します。
                  ファイルのアップロードは不要で、すぐに利用できます。
                </p>
                <div className="text-sm text-muted-foreground">
                  <strong>特徴：</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>ファイルアップロード不要</li>
                    <li>基本的なトレーニング知識に基づく</li>
                    <li>素早くメニュー生成</li>
                    <li>初心者にも最適</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* RAGありでの生成 */}
          <Card className="card-hover border-secondary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5 text-secondary" />
                RAGありでの生成
              </CardTitle>
              <CardDescription>
                カスタムファイルを活用した高度なメニュー生成
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-secondary/10 text-secondary border-secondary/20">高度機能</Badge>
                  <span className="text-sm text-muted-foreground">カスタマイズ可能</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  独自のトレーニング資料やPDFファイルをアップロードして、
                  より専門的でカスタマイズされたメニューを生成します。
                </p>
                <div className="text-sm text-muted-foreground">
                  <strong>特徴：</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>カスタムファイルの活用</li>
                    <li>専門的なトレーニング知識</li>
                    <li>より詳細で正確なメニュー</li>
                    <li>上級者向け</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator className="my-8 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20" />

      {/* AIの種類と使い分けセクション */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
          <Sparkles className="h-6 w-6 text-primary" />
          AIの種類と使い分け
        </h2>
        
        <div className="grid gap-6 md:grid-cols-2">
          {/* OpenAI GPT */}
          <Card className="card-hover border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                OpenAI GPT
              </CardTitle>
              <CardDescription>
                最も汎用的で高品質なAIモデル
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">GPT-4o</Badge>
                  <span className="text-sm text-muted-foreground">最新・最高品質</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  複雑な指示や高品質な出力が必要な場合に最適です。
                  トレーニングメニューの生成や詳細な説明に適しています。
                </p>
                <div className="text-sm text-muted-foreground">
                  <strong>RAGなしでの生成：</strong> 基本的なトレーニング知識に基づいた高品質なメニュー
                </div>
                <div className="text-sm text-muted-foreground">
                  <strong>RAGありでの生成：</strong> アップロードされたファイルを深く理解し、専門的なメニューを生成
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Anthropic Claude */}
          <Card className="card-hover border-secondary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-secondary" />
                Anthropic Claude
              </CardTitle>
              <CardDescription>
                安全性と倫理性を重視したAIモデル
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-secondary/10 text-secondary border-secondary/20">Claude 3.5 Sonnet</Badge>
                  <span className="text-sm text-muted-foreground">バランス型・高品質</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  安全性を重視した内容生成や、倫理的な判断が必要な場合に適しています。
                  高品質なトレーニングメニュー生成に最適です。
                </p>
                <div className="text-sm text-muted-foreground">
                  <strong>RAGなしでの生成：</strong> 安全で適切なトレーニングメニューを生成
                </div>
                <div className="text-sm text-muted-foreground">
                  <strong>RAGありでの生成：</strong> ファイル内容を安全に分析し、倫理的なメニューを提案
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Google Gemini */}
          <Card className="card-hover border-accent/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-accent" />
                Google Gemini
              </CardTitle>
              <CardDescription>
                マルチモーダル対応の高性能AI
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="bg-accent/10 text-accent border-accent/20">Gemini 2.0 Flash</Badge>
                  <span className="text-sm text-muted-foreground">高速・軽量版</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  画像やテキストの両方を理解できるAIです。
                  高速で効率的なトレーニングメニューの生成に適しています。
                </p>
                <div className="text-sm text-muted-foreground">
                  <strong>RAGなしでの生成：</strong> 高速で基本的なトレーニングメニューを生成
                </div>
                <div className="text-sm text-muted-foreground">
                  <strong>RAGありでの生成：</strong> 画像付きPDFも含めて多様なファイル形式に対応
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 使い分けガイド */}
          <Card className="md:col-span-2 card-hover border-primary/20 bg-gradient-to-br from-primary/5 via-secondary/5 to-accent/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                使い分けのポイント
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="text-center p-4 border border-accent/20 rounded-lg bg-accent/5">
                  <h4 className="font-semibold mb-2 text-accent">初回利用・学習目的</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Gemini 2.0 Flash
                  </p>
                  <p className="text-xs text-muted-foreground">
                    RAGなしで基本メニューを生成
                  </p>
                </div>
                <div className="text-center p-4 border border-secondary/20 rounded-lg bg-secondary/5">
                  <h4 className="font-semibold mb-2 text-secondary">日常的な利用</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Claude 3.5 Sonnet
                  </p>
                  <p className="text-xs text-muted-foreground">
                    RAGありなし両方に対応
                  </p>
                </div>
                <div className="text-center p-4 border border-primary/20 rounded-lg bg-primary/5">
                  <h4 className="font-semibold mb-2 text-primary">高品質・専門的な内容</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    GPT-4o
                  </p>
                  <p className="text-xs text-muted-foreground">
                    最高品質のメニュー生成
                  </p>
                </div>
              </div>
              <div className="mt-4 p-4 bg-primary/5 rounded-lg">
                <h5 className="font-semibold mb-2 text-primary">RAGなしでの利用について</h5>
                <p className="text-sm text-muted-foreground">
                  どのAIモデルでも、ファイルをアップロードせずに基本的なトレーニングメニューを生成できます。
                  初心者の方や、すぐにメニューが必要な場合におすすめです。
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <Separator className="my-8 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20" />

      {/* APIキーの取得方法セクション */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6 flex items-center gap-2">
          <Key className="h-6 w-6 text-primary" />
          APIキーの取得方法
        </h2>

        <div className="space-y-6">
          {/* OpenAI */}
          <Card className="card-hover border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                OpenAI APIキーの取得
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <h4 className="font-semibold mb-2">手順</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                      <li>OpenAIの公式サイト（<a href="https://platform.openai.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80 underline">platform.openai.com</a>）にアクセス</li>
                      <li>アカウントを作成またはログイン</li>
                      <li>左メニューから「API Keys」を選択</li>
                      <li>「Create new secret key」をクリック</li>
                      <li>APIキーをコピーして安全に保管</li>
                    </ol>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">料金</h4>
                    <p className="text-sm text-muted-foreground">
                      GPT-4o: $0.005/1K tokens<br/>
                      <span className="text-xs">※料金は変更される場合があります</span>
                    </p>
                  </div>
                </div>
                <Alert className="border-primary/20 bg-primary/5">
                  <Info className="h-4 w-4 text-primary" />
                  <AlertDescription>
                    APIキーは絶対に他人と共有しないでください。また、GitHubなどの公開リポジトリにアップロードしないようご注意ください。
                  </AlertDescription>
                </Alert>
              </div>
            </CardContent>
          </Card>

          {/* Anthropic */}
          <Card className="card-hover border-secondary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-secondary" />
                Anthropic Claude APIキーの取得
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <h4 className="font-semibold mb-2">手順</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                      <li>Anthropicの公式サイト（<a href="https://console.anthropic.com" target="_blank" rel="noopener noreferrer" className="text-secondary hover:text-secondary/80 underline">console.anthropic.com</a>）にアクセス</li>
                      <li>アカウントを作成またはログイン</li>
                      <li>「Get API Key」をクリック</li>
                      <li>APIキーをコピーして安全に保管</li>
                    </ol>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">料金</h4>
                    <p className="text-sm text-muted-foreground">
                      Claude 3.5 Sonnet: $3/1M tokens<br/>
                      <span className="text-xs">※料金は変更される場合があります</span>
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Google Gemini */}
          <Card className="card-hover border-accent/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-accent" />
                Google Gemini APIキーの取得
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <h4 className="font-semibold mb-2">手順</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                      <li>Google AI Studio（<a href="https://makersuite.google.com" target="_blank" rel="noopener noreferrer" className="text-accent hover:text-accent/80 underline">makersuite.google.com</a>）にアクセス</li>
                      <li>Googleアカウントでログイン</li>
                      <li>「Get API key」をクリック</li>
                      <li>APIキーをコピーして安全に保管</li>
                    </ol>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">料金</h4>
                    <p className="text-sm text-muted-foreground">
                      Gemini 2.0 Flash: $0.075/1M tokens<br/>
                      <span className="text-xs">※料金は変更される場合があります</span>
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 共通の注意事項 */}
          <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-secondary/5 card-hover">
            <CardHeader>
              <CardTitle className="text-primary">⚠️ 重要な注意事項</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm">APIキーは絶対に他人と共有しないでください</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm">GitHubなどの公開リポジトリにアップロードしないでください</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm">APIキーが漏洩した場合は、すぐに再生成してください</p>
                </div>
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <p className="text-sm">使用量と料金を定期的に確認してください</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 次のステップ */}
      <section className="text-center">
        <Card className="bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 border-primary/20 card-hover">
          <CardContent className="pt-6">
            <h3 className="text-xl font-semibold mb-3 gradient-text">次のステップ</h3>
            <p className="text-muted-foreground mb-4">
              APIキーを取得したら、設定画面で入力してAI機能をお試しください
            </p>
            <div className="flex gap-4 justify-center">
              <a
                href="/create"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary to-secondary text-white rounded-lg hover:shadow-lg hover:shadow-primary/20 transition-all duration-300"
              >
                トレーニングメニュー作成
              </a>
              <a
                href="/upload"
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-secondary to-accent text-white rounded-lg hover:shadow-lg hover:shadow-secondary/20 transition-all duration-300"
              >
                ファイルアップロード
              </a>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
