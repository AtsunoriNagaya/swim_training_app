import type { Metadata } from "next"
import UploadResultContent from "@/components/upload-result-content"

export const metadata: Metadata = {
  title: "アップロードファイル詳細 - 水泳部練習メニュー作成アプリ",
  description: "アップロードされたファイルの詳細表示",
}

export const dynamic = 'force-static'

export default function UploadResultPage() {
  return <UploadResultContent />;
}
