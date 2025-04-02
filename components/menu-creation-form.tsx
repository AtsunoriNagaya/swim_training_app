"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
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

const formSchema = z.object({
  aiModel: z.string({
    required_error: "AIモデルを選択してください",
  }),
  loadLevels: z.array(z.string()).min(1, {
    message: "少なくとも1つの負荷レベルを選択してください",
  }),
  duration: z.coerce
    .number()
    .min(15, {
      message: "練習時間は最低15分以上で指定してください",
    })
    .max(240, {
      message: "練習時間は最大240分（4時間）までで指定してください",
    }),
  notes: z.string().optional(),
})

const loadLevelOptions = [
  { id: "A", label: "A（高負荷）" },
  { id: "B", label: "B（中負荷）" },
  { id: "C", label: "C（低負荷）" },
]

export default function MenuCreationForm() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      loadLevels: [],
      duration: 90,
      notes: "",
    },
  })

  const { toast } = useToast()

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true)

    try {
      // ここでAPIリクエストを行い、メニューを生成する
      console.log("フォーム送信値:", values)

      // 実際のAPIリクエスト（実装時にコメントアウトを解除）
      const response = await fetch("/api/generate-menu", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error("メニュー生成に失敗しました");
      }

      const data = await response.json();
      router.push(`/result?id=${data.menuId}`);

      // 開発用のモックデータ
      // setTimeout(() => {
      //   router.push(`/result?id=mock-menu-id-123`)
      //   setIsLoading(false)
      // }, 2000)
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
                      <SelectItem value="openai">OpenAI (GPT-4)</SelectItem>
                      <SelectItem value="google">Google (Gemini)</SelectItem>
                      <SelectItem value="anthropic">Anthropic (Claude)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>メニュー生成に使用するAIモデルを選択してください</FormDescription>
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
