"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import * as z from "zod"
import { Loader2, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import SimilarMenuSearch from "@/components/similar-menu-search"

const formSchema = z.object({
  useRAG: z.boolean(),
  aiModel: z.string().min(1, "AIモデルを選択してください"),
  apiKey: z.string().min(1, "APIキーを入力してください"),
  openaiApiKey: z.string().optional(),
  loadLevels: z.array(z.string()).min(1, "少なくとも1つの負荷レベルを選択してください"),
  duration: z.coerce
    .number({ invalid_type_error: "数値で入力してください" })
    .min(15, "15分以上で入力してください")
    .max(240, "240分以内で入力してください"),
  notes: z.string().optional(),
}).required();

type FormData = z.infer<typeof formSchema>;

const loadLevelOptions = [
  { id: "A", label: "A（高負荷）" },
  { id: "B", label: "B（中負荷）" },
  { id: "C", label: "C（低負荷）" },
]

import { AI_MODEL_CONFIGS, type AIModelKey, validateApiKey } from "@/lib/ai-config"

const getApiKeyFormDescription = (aiModel: string) => {
  const config = AI_MODEL_CONFIGS[aiModel as AIModelKey];
  return config?.apiKeyDescription || "";
}

const getApiKeyPlaceholder = (aiModel: string) => {
  const config = AI_MODEL_CONFIGS[aiModel as AIModelKey];
  return config?.apiKeyFormat ? `${config.apiKeyFormat}...` : "APIキーを入力";
}

// 必須項目のラベル横に付けるマーク
function RequiredBadge() {
  return (
    <Badge
      variant="outline"
      className="ml-2 border-destructive/40 px-1.5 py-0 text-[10px] font-normal text-destructive"
    >
      必須
    </Badge>
  )
}

export default function MenuCreationForm() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      useRAG: false,
      aiModel: "",
      apiKey: "",
      openaiApiKey: "",
      loadLevels: [],
      duration: 90,
      notes: "",
    },
  })

  const { toast } = useToast()

  // APIキー欄の placeholder / 説明文を選択中のモデルに追従させる
  const selectedModel = useWatch({ control: form.control, name: "aiModel" })

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)

    try {
      // APIキーの事前検証
      const apiKeyValidation = validateApiKey(data.aiModel, data.apiKey);
      if (!apiKeyValidation.isValid) {
        throw new Error(apiKeyValidation.message || "APIキーの形式が正しくありません");
      }

      // RAG機能が有効な場合のOpenAI APIキー検証
      if (data.useRAG && data.openaiApiKey) {
        const openaiKeyValidation = validateApiKey("openai", data.openaiApiKey);
        if (!openaiKeyValidation.isValid) {
          throw new Error(`類似メニュー検索用のAPIキーエラー: ${openaiKeyValidation.message}`);
        }
      }

      const response = await fetch("/api/generate-menu", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const responseData = await response.json();

      if (!response.ok) {
        const errorMessage = responseData.error || "メニュー生成に失敗しました";
        console.error("API エラー詳細:", responseData);
        throw new Error(errorMessage);
      }

      router.push(`/result?id=${responseData.menuId}`);
    } catch (error: any) {
      console.error("エラー:", error)
      toast({
        title: "メニュー生成エラー",
        description: error.message,
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  return (
    <Card className="water-card shadow-lg">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-secondary to-accent"></div>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            {/* 生成中はフォーム全体を無効化して二重送信・編集を防ぐ */}
            <fieldset disabled={isLoading} className="space-y-8">
              <SimilarMenuSearch />

              <FormField
                control={form.control}
                name="aiModel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">
                      AIモデル選択
                      <RequiredBadge />
                    </FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="使用するAIモデルを選択" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(AI_MODEL_CONFIGS).map(([key, config]) => (
                          <SelectItem key={key} value={key}>
                            {config.displayName} ({config.model})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription className="flex items-center gap-2">
                      メニュー生成に使用するAIモデルを選択してください
                      <a
                        href="/help"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary underline underline-offset-4 hover:text-primary/80"
                      >
                        AIの使い方を見る
                      </a>
                    </FormDescription>

                    {/* 選択されたAIモデルの特徴表示 */}
                    {field.value && AI_MODEL_CONFIGS[field.value as AIModelKey] && (
                      <div className="mt-3 p-3 border rounded-lg bg-muted/50">
                        <div className="text-sm">
                          <div className="font-semibold text-primary mb-1">
                            {AI_MODEL_CONFIGS[field.value as AIModelKey].icon} {AI_MODEL_CONFIGS[field.value as AIModelKey].displayName}
                          </div>
                          <div className="text-muted-foreground">
                            {AI_MODEL_CONFIGS[field.value as AIModelKey].description}
                          </div>
                        </div>
                      </div>
                    )}

                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="apiKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">
                      APIキー
                      <RequiredBadge />
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder={getApiKeyPlaceholder(selectedModel)}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="flex items-center gap-2">
                      {getApiKeyFormDescription(selectedModel)}
                      <a
                        href="/help"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary underline underline-offset-4 hover:text-primary/80"
                      >
                        APIキーの取得方法
                      </a>
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="loadLevels"
                render={() => (
                  <FormItem>
                    <div className="mb-4">
                      <FormLabel className="text-base">
                        負荷レベル
                        <RequiredBadge />
                      </FormLabel>
                      <FormDescription>生成するメニューの負荷レベルを選択してください（複数選択可）</FormDescription>
                    </div>
                    <div className="flex flex-row gap-4">
                      {loadLevelOptions.map((option) => (
                        <FormField
                          key={option.id}
                          control={form.control}
                          name="loadLevels"
                          render={({ field }) => {
                            return (
                              <FormItem key={option.id} className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(option.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, option.id])
                                        : field.onChange(field.value?.filter((value) => value !== option.id))
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="font-normal cursor-pointer">{option.label}</FormLabel>
                              </FormItem>
                            )
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="duration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">
                      練習時間（分）
                      <RequiredBadge />
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={15}
                        max={240}
                        placeholder="90"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>練習の総時間を15〜240分の範囲で入力してください（例: 90分）</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">備考・特記事項</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="例: キック強化、リレー引き継ぎ練習、大会前調整など"
                        className="resize-y"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>メニュー作成に関する要望や特記事項があれば入力してください</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    メニュー生成中...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" aria-hidden="true" />
                    メニューを生成する
                  </>
                )}
              </Button>

              {isLoading && (
                <p className="text-center text-sm text-muted-foreground" role="status">
                  AIがメニューを生成しています。最大1分ほどかかることがあります。
                </p>
              )}
            </fieldset>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
