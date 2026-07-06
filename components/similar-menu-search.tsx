"use client"

import { useEffect, useState } from "react"
import { useFormContext, useWatch } from "react-hook-form"
import { Loader2, Search } from "lucide-react"

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/hooks/use-toast"

// 親フォーム(menu-creation-form)の値のうち、類似メニュー検索が参照するフィールド。
// 型を親から import すると循環参照になるため、必要な部分だけをここで定義する
type SimilarMenuSearchValues = {
  useRAG: boolean
  openaiApiKey?: string
  duration: number
  notes?: string
}

interface SimilarMenu {
  menuData: {
    title?: string
    totalTime: number
  }
  similarityScore: number
}

export default function SimilarMenuSearch() {
  const { control } = useFormContext<SimilarMenuSearchValues>()
  const { toast } = useToast()
  const [similarMenus, setSimilarMenus] = useState<SimilarMenu[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const useRAG = useWatch({ control, name: "useRAG" })
  const notes = useWatch({ control, name: "notes" })
  const duration = useWatch({ control, name: "duration" })
  const openaiApiKey = useWatch({ control, name: "openaiApiKey" })

  useEffect(() => {
    if (!useRAG) {
      setSimilarMenus([])
      return
    }
    if (!notes || !duration || !openaiApiKey) return

    // 入力が落ち着いてから検索する（デバウンス）
    const timeoutId = setTimeout(async () => {
      setIsSearching(true)
      try {
        const response = await fetch("/api/search-similar-menus", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: notes,
            duration: duration,
            openaiApiKey: openaiApiKey,
          }),
        })

        if (!response.ok) {
          throw new Error("類似メニューの検索に失敗しました")
        }

        const data = await response.json()
        setSimilarMenus(data.menus || [])
      } catch (error) {
        console.error("類似メニュー検索エラー:", error)
        toast({
          title: "検索エラー",
          description: "類似メニューの検索中にエラーが発生しました",
          variant: "destructive",
        })
      } finally {
        setIsSearching(false)
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [useRAG, notes, duration, openaiApiKey, toast])

  return (
    <>
      <FormField
        control={control}
        name="useRAG"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">類似メニュー検索</FormLabel>
              <FormDescription>
                過去のメニューから類似のものを検索して参考にします
              </FormDescription>
            </div>
            <FormControl>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormControl>
          </FormItem>
        )}
      />

      {useRAG && (
        <FormField
          control={control}
          name="openaiApiKey"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-base">OpenAI APIキー（類似メニュー検索用）</FormLabel>
              <FormControl>
                <Input type="password" placeholder="sk-..." {...field} />
              </FormControl>
              <FormDescription>類似メニューの検索にはOpenAI APIキーが必要です</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      {isSearching ? (
        <div className="flex items-center justify-center py-4" role="status">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
          <span>類似メニューを検索中...</span>
        </div>
      ) : similarMenus.length > 0 ? (
        <div className="space-y-4">
          <h3 className="flex items-center text-base font-medium">
            <Search className="mr-2 h-4 w-4" aria-hidden="true" />
            類似のメニュー
          </h3>
          <div className="space-y-2">
            {similarMenus.map((menu, index) => (
              <div key={index} className="rounded-lg border bg-muted/30 p-4">
                <h4 className="font-medium">{menu.menuData.title || "無題のメニュー"}</h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  時間: {menu.menuData.totalTime}分 / 類似度: {Math.round(menu.similarityScore * 100)}%
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </>
  )
}
