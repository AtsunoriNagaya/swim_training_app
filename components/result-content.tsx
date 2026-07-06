'use client';

import React from "react";
import { useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertCircle, SearchX } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import TrainingMenuResult from "@/components/training-menu-result"

export default function ResultContent() {
  const [menuData, setMenuData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const searchParams = useSearchParams();

  React.useEffect(() => {
    const menuId = searchParams.get('id');
    if (!menuId) {
      setLoading(false);
      setError(new Error("メニューIDが指定されていません"));
      return;
    }

    async function fetchData() {
      try {
        const response = await fetch(`/api/get-menu?id=${menuId}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("API Error Response:", errorData);
          throw new Error(errorData.error || "メニューの取得に失敗しました");
        }

        const data = await response.json();
        setMenuData(data);
        setLoading(false);
      } catch (error: any) {
        console.error("Error fetching menu data:", error);
        setLoading(false);
        setError(error);
      }
    }

    fetchData();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div role="status" aria-busy="true" className="max-w-4xl mx-auto">
          <span className="sr-only">読み込み中...</span>
          <Card>
            <CardHeader className="space-y-3">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent className="space-y-3">
              {[0, 1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" aria-hidden="true" />
            <AlertTitle>メニューの取得に失敗しました</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
          <div className="flex flex-wrap gap-3">
            <Button variant="outline" asChild>
              <Link href="/history">
                <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
                履歴に戻る
              </Link>
            </Button>
            <Button asChild>
              <Link href="/create">新しいメニューを作成</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!menuData) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div
          role="status"
          className="max-w-2xl mx-auto rounded-lg border border-dashed px-6 py-12 text-center"
        >
          <SearchX className="mx-auto h-12 w-12 text-muted-foreground" aria-hidden="true" />
          <p className="mt-4 text-lg font-medium">メニューが見つかりません</p>
          <p className="mt-1 text-sm text-muted-foreground">
            指定されたIDのメニューが見つかりませんでした。削除されたか、URLが正しくない可能性があります。
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Button variant="outline" asChild>
              <Link href="/history">履歴を確認する</Link>
            </Button>
            <Button asChild>
              <Link href="/create">新しいメニューを作成する</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/history" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            履歴に戻る
          </Link>
        </Button>
      </div>

      <div className="flex flex-col items-center justify-center text-center mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-4">生成されたメニュー</h1>
        <p className="text-lg text-muted-foreground max-w-3xl">
          AIによって生成された練習メニューです。 PDFやCSVでダウンロードすることができます。
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <TrainingMenuResult menuData={menuData} />
      </div>
    </div>
  );
}
