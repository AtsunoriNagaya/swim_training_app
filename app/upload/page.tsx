import type { Metadata } from "next"
import FileUploadForm from "@/components/file-upload-form"
import UploadedFilesList from "@/components/uploaded-files-list"

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: "過去メニュー管理 - 水泳部練習メニュー作成アプリ",
  description: "過去の練習メニューをアップロードして管理します",
}

export default function UploadPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="flex flex-col items-center justify-center text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-4">過去メニュー管理</h1>
        <p className="text-lg text-muted-foreground max-w-3xl">
          過去の練習メニューをCSVやPDFでアップロードし、メニュー生成時の参考データとして活用できます。
          アップロードされたデータはRAG（Retrieval-Augmented Generation）技術により、
          新しいメニュー生成時に関連性の高い情報として参照されます。
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        <div>
          <h2 className="text-xl font-semibold mb-4">ファイルアップロード</h2>
          <FileUploadForm />
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-4">アップロード済みファイル</h2>
          <UploadedFilesList />
        </div>
      </div>
    </div>
  )
}
