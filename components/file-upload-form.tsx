"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2, Upload, FileUp } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ACCEPTED_FILE_TYPES = ["application/pdf", "text/csv"]

const formSchema = z.object({
  file: z
    .instanceof(FileList)
    .refine((files) => files.length > 0, "ファイルを選択してください")
    .refine((files) => files[0]?.size <= MAX_FILE_SIZE, "ファイルサイズは5MB以下にしてください")
    .refine(
      (files) => ACCEPTED_FILE_TYPES.includes(files[0]?.type),
      "PDFまたはCSV形式のファイルのみアップロード可能です",
    ),
  description: z.string().optional(),
})

export default function FileUploadForm() {
  const [isUploading, setIsUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const router = useRouter()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      description: "",
    },
  })

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsUploading(true)

    try {
      const file = values.file[0];
      
      // ファイル内容をテキストとして読み込む
      let fileContent = "";
      if (file.type === "text/csv") {
        fileContent = await file.text(); // シンプルにテキストとして読み込む
      } else if (file.type === "application/pdf") {
        // PDFの場合は表示のみとし、内容は保存しない
        fileContent = "PDF file - content not stored locally";
      }
      
      // メニューデータの作成
      const menuId = `local-${Date.now()}`;
      const menuData = {
        id: menuId,
        title: file.name,
        description: values.description || "",
        fileType: file.type,
        fileSize: `${(file.size / 1024).toFixed(1)} KB`,
        createdAt: new Date().toISOString(),
        content: fileContent.substring(0, 50000), // 容量制限のため先頭部分のみ保存
      };
      
      // ローカルストレージに保存
      const existingMenus = JSON.parse(localStorage.getItem('swim-training-menus') || '[]');
      existingMenus.unshift(menuData); // 新しいメニューを先頭に追加
      localStorage.setItem('swim-training-menus', JSON.stringify(existingMenus.slice(0, 20))); // 最新20件のみ保持

      // フォームをリセット
      form.reset()

      // 履歴ページに遷移
      router.push('/history')
    } catch (error) {
      console.error("エラー:", error)
      // エラー処理
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      form.setValue("file", e.dataTransfer.files)
    }
  }

  return (
    <Card className="water-card shadow-lg">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-accent"></div>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="file"
              render={({ field: { onChange, value, ...rest } }) => (
                <FormItem>
                  <FormLabel className="text-base">ファイル選択</FormLabel>
                  <FormControl>
                    <div
                      className={`grid w-full items-center gap-1.5 ${dragActive ? "ring-2 ring-primary" : ""}`}
                      onDragEnter={handleDrag}
                      onDragLeave={handleDrag}
                      onDragOver={handleDrag}
                      onDrop={handleDrop}
                    >
                      <div className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg border-primary/30 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer">
                        <div className="flex flex-col items-center justify-center pt-5 pb-6">
                          <FileUp className="w-8 h-8 mb-3 text-primary" />
                          <p className="mb-2 text-sm text-center">
                            <span className="font-semibold">クリックしてファイルを選択</span> または ドラッグ＆ドロップ
                          </p>
                          <p className="text-xs text-muted-foreground">PDFまたはCSV形式のファイル（最大5MB）</p>
                        </div>
                        <Input
                          type="file"
                          accept=".pdf,.csv"
                          onChange={(e) => onChange(e.target.files)}
                          className="hidden"
                          id="file-upload"
                          {...rest}
                        />
                      </div>
                      <label htmlFor="file-upload" className="sr-only">
                        ファイルを選択
                      </label>
                    </div>
                  </FormControl>
                  <FormDescription>PDFまたはCSV形式のファイルをアップロードしてください（最大5MB）</FormDescription>
                  <FormMessage />
                  {form.watch("file") && form.watch("file").length > 0 && (
                    <div className="mt-2 p-2 bg-primary/10 rounded-md text-sm">
                      選択されたファイル: {form.watch("file")[0].name} ({(form.watch("file")[0].size / 1024).toFixed(1)}{" "}
                      KB)
                    </div>
                  )}
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">ファイルの説明（任意）</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="例: 2023年夏季練習メニュー、高校総体前強化メニューなど"
                      className="resize-y border-primary/20 focus:ring-primary/30"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>ファイルの内容や特徴を簡単に説明してください</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/20 transition-all duration-300"
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  アップロード中...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  ファイルをアップロード
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
