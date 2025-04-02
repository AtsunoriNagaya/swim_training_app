import type { Metadata } from "next"
import MenuCreationForm from "@/components/menu-creation-form"

export const metadata: Metadata = {
  title: "メニュー作成 - 水泳部練習メニュー作成アプリ",
  description: "AIを活用して水泳部の練習メニューを作成します",
}

export default function CreatePage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col items-center justify-center text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-4">練習メニュー作成</h1>
        <p className="text-lg text-muted-foreground max-w-3xl">
          以下のフォームに必要事項を入力して、AIによる練習メニューを生成しましょう。
          過去のメニューデータがアップロードされている場合は、それらを参考にしたメニューが生成されます。
        </p>
      </div>

      <div className="max-w-3xl mx-auto">
        <MenuCreationForm />
      </div>
    </div>
  )
}

