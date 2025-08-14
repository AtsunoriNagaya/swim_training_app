"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { Loader2, Sparkles, Search } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useToast } from "@/hooks/use-toast"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"

const formSchema = z.object({
  useRAG: z.boolean(),
  aiModel: z.string(),
  apiKey: z.string().min(1, "APIキーを入力してください"),
  openaiApiKey: z.string().optional(),
  loadLevels: z.array(z.string()).min(1, "少なくとも1つの負荷レベルを選択してください"),
  duration: z.coerce.number().min(15).max(240),
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

export default function MenuCreationForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [similarMenus, setSimilarMenus] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const router = useRouter()
  const [isRAGEnabled, setIsRAGEnabled] = useState(false)

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

  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'useRAG') {
        setIsRAGEnabled(value.useRAG || false);
        if (!value.useRAG) {
          setSimilarMenus([]);
        }
      }
    });
    return () => subscription.unsubscribe();
  }, [form.watch]);

  const searchSimilarMenus = async (notes: string, duration: number, openaiApiKey: string) => {
    if (!notes || !duration || !openaiApiKey) return;
    
    setIsSearching(true);
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
      });

      if (!response.ok) {
        throw new Error("類似メニューの検索に失敗しました");
      }

      const data = await response.json();
      setSimilarMenus(data.menus || []);
    } catch (error) {
      console.error("類似メニュー検索エラー:", error);
      toast({
        title: "検索エラー",
        description: "類似メニューの検索中にエラーが発生しました",
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  useEffect(() => {
    const notes = form.watch("notes");
    const duration = form.watch("duration");
    const openaiApiKey = form.watch("openaiApiKey");
    const isRAGEnabled = form.watch("useRAG");
    
    const timeoutId = setTimeout(() => {
      if (notes && duration && openaiApiKey && isRAGEnabled) {
        searchSimilarMenus(notes, duration, openaiApiKey);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [form.watch("notes"), form.watch("duration"), form.watch("openaiApiKey"), form.watch("useRAG")]);

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

      console.log("フォーム送信値:", data)

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
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
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
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            {isRAGEnabled && (
              <FormField
                control={form.control}
                name="openaiApiKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base">OpenAI APIキー（類似メニュー検索用）</FormLabel>
                    <FormControl>
                      <Input
                        type="password"
                        placeholder="sk-..."
                        className="border-primary/20 focus:ring-primary/30"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      類似メニューの検索にはOpenAI APIキーが必要です
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="aiModel"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-base">AIモデル選択</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="border-primary/20 focus:ring-primary/30">
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
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm underline"
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
                  <FormLabel className="text-base">APIキー</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder={getApiKeyPlaceholder(form.watch("aiModel"))}
                      className="border-primary/20 focus:ring-primary/30"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="flex items-center gap-2">
                    {getApiKeyFormDescription(form.watch("aiModel"))}
                    <a 
                      href="/help" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm underline"
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
                    <FormLabel className="text-base">負荷レベル</FormLabel>
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
                                  className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
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
                  <FormLabel className="text-base">練習時間（分）</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="90"
                      className="border-primary/20 focus:ring-primary/30"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>練習の総時間を分単位で入力してください（例: 90分）</FormDescription>
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
                      className="resize-y border-primary/20 focus:ring-primary/30"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>メニュー作成に関する要望や特記事項があれば入力してください</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {isSearching ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                <span>類似メニューを検索中...</span>
              </div>
            ) : similarMenus.length > 0 ? (
              <div className="space-y-4">
                <h3 className="text-base font-medium flex items-center">
                  <Search className="h-4 w-4 mr-2" />
                  類似のメニュー
                </h3>
                <div className="space-y-2">
                  {similarMenus.map((menu, index) => (
                    <div key={index} className="p-4 rounded-lg border border-primary/20 bg-background/50">
                      <h4 className="font-medium">{menu.menuData.title || "無題のメニュー"}</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        時間: {menu.menuData.totalTime}分 / 
                        類似度: {Math.round(menu.similarityScore * 100)}%
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/20 transition-all duration-300"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  メニュー生成中...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  メニューを生成する
                </>
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}
