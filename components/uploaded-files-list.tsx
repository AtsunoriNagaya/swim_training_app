"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, FileText, FileSpreadsheet, AlertCircle } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

// モックデータ
const mockFiles = [
  {
    id: "file-1",
    name: "2023年夏季練習メニュー.pdf",
    type: "pdf",
    size: "1.2 MB",
    uploadedAt: "2023-07-15T09:30:00Z",
    description: "夏季合宿用の高強度トレーニングメニュー",
  },
  {
    id: "file-2",
    name: "高校総体前強化メニュー.csv",
    type: "csv",
    size: "245 KB",
    uploadedAt: "2023-05-20T14:45:00Z",
    description: "高校総体前の4週間強化プログラム",
  },
  {
    id: "file-3",
    name: "基礎トレーニングメニュー.pdf",
    type: "pdf",
    size: "890 KB",
    uploadedAt: "2023-04-10T11:15:00Z",
    description: "初心者向け基礎トレーニングメニュー集",
  },
  {
    id: "file-4",
    name: "スプリント強化プログラム.csv",
    type: "csv",
    size: "320 KB",
    uploadedAt: "2023-03-05T16:20:00Z",
    description: "短距離選手向けスプリント強化プログラム",
  },
]

export default function UploadedFilesList() {
  const [files, setFiles] = useState(mockFiles)
  const [isDeleting, setIsDeleting] = useState(false)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date)
  }

  const handleDelete = async (fileId: string) => {
    setIsDeleting(true)

    try {
      // 実際の実装では、APIを呼び出してファイルを削除する
      // const response = await fetch(`/api/delete-file?id=${fileId}`, {
      //   method: "DELETE",
      // });

      // if (!response.ok) {
      //   throw new Error("ファイル削除に失敗しました");
      // }

      // 開発用のモック処理
      await new Promise((resolve) => setTimeout(resolve, 500))
      setFiles(files.filter((file) => file.id !== fileId))
    } catch (error) {
      console.error("削除エラー:", error)
    } finally {
      setIsDeleting(false)
    }
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case "pdf":
        return <FileText className="h-5 w-5 text-red-500" />
      case "csv":
        return <FileSpreadsheet className="h-5 w-5 text-green-500" />
      default:
        return <FileText className="h-5 w-5" />
    }
  }

  return (
    <Card className="water-card shadow-lg">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-accent"></div>
      <CardContent className="pt-6">
        {files.length > 0 ? (
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-start justify-between p-4 border border-primary/20 rounded-md bg-gradient-to-r from-white to-primary/5 dark:from-gray-900 dark:to-primary/10 hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
                      {getFileIcon(file.type)}
                    </div>
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {file.size} • {formatDate(file.uploadedAt)}
                      </p>
                      {file.description && (
                        <p className="text-sm mt-1 bg-white/50 dark:bg-gray-800/50 p-1.5 rounded-md">
                          {file.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive/90 hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>ファイルを削除しますか？</AlertDialogTitle>
                        <AlertDialogDescription>
                          「{file.name}」を削除します。この操作は元に戻せません。
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>キャンセル</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(file.id)}
                          disabled={isDeleting}
                          className="bg-destructive hover:bg-destructive/90"
                        >
                          削除する
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              ))}
            </div>
          </ScrollArea>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-medium">ファイルがありません</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-xs">
              過去の練習メニューをアップロードして、AIによるメニュー生成の精度を向上させましょう
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

