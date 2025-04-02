import type { Metadata } from "next"
import ResultContent from "@/components/result-content"

export const metadata: Metadata = {
  title: "生成結果 - 水泳部練習メニュー作成アプリ",
  description: "AIによって生成された水泳部の練習メニュー",
}

export const dynamic = 'force-static'

export default function ResultPage() {
  return <ResultContent />;
}
