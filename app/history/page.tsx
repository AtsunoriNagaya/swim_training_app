import type { Metadata } from "next"
import MenuHistoryList from "@/components/menu-history-list"

export const metadata: Metadata = {
  title: "メニュー履歴 - 水泳部練習メニュー作成アプリ",
  description: "過去に生成した練習メニューの履歴を確認します",
}

export default function HistoryPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col items-center justify-center text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-4">メニュー履歴</h1>
        <p className="text-lg text-muted-foreground max-w-3xl">
          過去に生成したメニューの履歴を確認し、再利用や参考にすることができます。
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <MenuHistoryList />
      </div>
    </div>
  )
}

