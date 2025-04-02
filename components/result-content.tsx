'use client';

import React from "react";
import { useSearchParams } from 'next/navigation';
import TrainingMenuResult from "@/components/training-menu-result"

export default function ResultContent() {
  const [menuData, setMenuData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const searchParams = useSearchParams();

  React.useEffect(() => {
    const menuId = searchParams.get('id');
    if (!menuId) {
      setLoading(false);
      setError(true);
      return;
    }

    async function fetchData() {
      try {
        const response = await fetch(`https://swim-traing-app.vercel.app/api/get-menu?id=${menuId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch menu data");
        }
        const data = await response.json();
        setMenuData(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching menu data:", error);
        setLoading(false);
        setError(true);
      }
    }

    fetchData();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-4">読み込み中...</h1>
        </div>
      </div>
    );
  }

  if (error || !menuData) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-4">エラー</h1>
          <p className="text-lg text-muted-foreground max-w-3xl">
            メニューの取得に失敗しました。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
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
