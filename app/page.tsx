import type { Metadata } from "next"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRight, Calendar, FileText, Upload, Cpu, Database, Download } from "lucide-react"

export const metadata: Metadata = {
  title: "水泳部練習メニュー作成アプリ",
  description: "AIを活用して効率的に水泳部の練習メニューを作成するアプリケーション",
}

export default function Home() {
  return (
    <div>
      {/* ヒーローセクション */}
      <section className="relative overflow-hidden py-20 md:py-32">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-white to-secondary/10 dark:from-primary/5 dark:via-background dark:to-secondary/5"></div>
        <div className="absolute inset-0 bg-wave-pattern opacity-20 animate-wave"></div>
        <div className="container relative z-10 mx-auto px-4">
          <div className="flex flex-col items-center justify-center text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              <span className="gradient-text">水泳部練習メニュー作成</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mb-8">
              AIを活用して効率的に水泳部の練習メニューを作成するアプリケーション
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/create">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/20 transition-all duration-300"
                >
                  メニュー作成を始める
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/upload">
                <Button
                  size="lg"
                  variant="outline"
                  className="border-primary hover:border-secondary hover:bg-secondary/5"
                >
                  過去メニューをアップロード
                  <Upload className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>

          <div className="relative mx-auto mt-16 max-w-5xl">
            <div className="absolute -inset-1 rounded-xl bg-gradient-to-r from-primary via-secondary to-accent blur-md opacity-50"></div>
            <div className="relative rounded-xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm shadow-xl overflow-hidden border border-white/50 dark:border-gray-800/50">
              <div className="p-1 bg-gradient-to-r from-primary via-secondary to-accent"></div>
              <div className="p-6 md:p-10">
                <img
                  src="/placeholder.svg?height=600&width=1000"
                  alt="アプリケーションのスクリーンショット"
                  className="rounded-lg shadow-lg w-full"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 機能セクション */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              <span className="gradient-text">主要機能</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              AIと過去のデータを活用して、質の高い練習メニューを短時間で作成
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <Card className="water-card card-hover flex flex-col">
              <CardHeader>
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4 text-white">
                  <FileText className="h-7 w-7" />
                </div>
                <CardTitle className="text-xl">メニュー作成</CardTitle>
                <CardDescription className="text-base">AIを活用して練習メニューを自動生成</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p>負荷レベル、練習時間、特記事項などを入力するだけで、 最適な練習メニューを提案します。</p>
              </CardContent>
              <CardFooter>
                <Link href="/create" className="w-full">
                  <Button className="w-full bg-gradient-to-r from-primary to-secondary hover:shadow-md">
                    メニュー作成へ
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            <Card className="water-card card-hover flex flex-col">
              <CardHeader>
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4 text-white">
                  <Upload className="h-7 w-7" />
                </div>
                <CardTitle className="text-xl">過去メニュー管理</CardTitle>
                <CardDescription className="text-base">過去の練習メニューをアップロードして活用</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p>過去の練習メニューをCSVやPDFでアップロードし、 メニュー生成時の参考データとして活用できます。</p>
              </CardContent>
              <CardFooter>
                <Link href="/upload" className="w-full">
                  <Button className="w-full" variant="outline">
                    アップロードへ
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            <Card className="water-card card-hover flex flex-col">
              <CardHeader>
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4 text-white">
                  <Calendar className="h-7 w-7" />
                </div>
                <CardTitle className="text-xl">メニュー履歴</CardTitle>
                <CardDescription className="text-base">生成したメニューの履歴を確認</CardDescription>
              </CardHeader>
              <CardContent className="flex-grow">
                <p>過去に生成したメニューの履歴を確認し、 再利用や参考にすることができます。</p>
              </CardContent>
              <CardFooter>
                <Link href="/history" className="w-full">
                  <Button className="w-full" variant="outline">
                    履歴を見る
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* 特徴セクション */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-white to-secondary/5 dark:from-primary/10 dark:via-background dark:to-secondary/10">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">
              <span className="gradient-text">アプリの特徴</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              最新のAI技術と使いやすいインターフェースで練習メニュー作成をサポート
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white dark:bg-gray-900 rounded-xl p-8 shadow-lg card-hover border border-primary/10">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-6">
                <Cpu className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-4">AIによる自動生成</h3>
              <p className="text-muted-foreground">
                複数のAIモデルから選択し、質の高い練習メニューを自動生成します。負荷レベルや時間に合わせた最適なメニューを提案します。
              </p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl p-8 shadow-lg card-hover border border-primary/10">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-6">
                <Database className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-4">過去データの活用</h3>
              <p className="text-muted-foreground">
                過去のメニューデータを参照し、より効果的なメニューを提案します。RAG技術により、関連性の高い情報を検索して活用します。
              </p>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-xl p-8 shadow-lg card-hover border border-primary/10">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center mb-6">
                <Download className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-4">柔軟な出力形式</h3>
              <p className="text-muted-foreground">
                生成したメニューをPDFやCSV形式でダウンロードできます。チーム内での共有や印刷に便利で、様々な用途に対応します。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTAセクション */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="relative max-w-4xl mx-auto rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-accent opacity-90"></div>
            <div className="absolute inset-0 bg-wave-pattern opacity-10 animate-wave"></div>
            <div className="relative z-10 p-12 text-white text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">効率的な練習メニュー作成を始めましょう</h2>
              <p className="text-xl mb-8 text-white/90 max-w-2xl mx-auto">
                AIと過去のデータを活用して、質の高い練習メニューを短時間で作成できます。 今すぐ試してみましょう。
              </p>
              <Link href="/create">
                <Button size="lg" className="bg-white text-primary hover:bg-white/90 hover:shadow-lg">
                  無料で始める
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

