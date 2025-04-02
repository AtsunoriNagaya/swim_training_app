import type { Metadata } from "next"
import ResultContent from "@/components/result-content"

export const metadata: Metadata = {
  title: "生成結果 - 水泳部練習メニュー作成アプリ",
  description: "AIによって生成された水泳部の練習メニュー",
}

export default function ResultPage({ searchParams }: { searchParams: { id?: string } }) {
  return <ResultContent searchParams={searchParams} />;
}
