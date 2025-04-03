'use client';

import React from "react";
import { useSearchParams } from 'next/navigation';
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
        console.log(`Fetching menu data for ID: ${menuId}`);
        const response = await fetch(`/api/get-menu?id=${menuId}`);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          console.error("API Error Response:", errorData);
          throw new Error(errorData.error || "Failed to fetch menu data");
        }
        
        const data = await response.json();
        console.log("Received menu data:", data);
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
        <div className="flex flex-col items-center justify-center text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-4">読み込み中...</h1>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-4">エラー</h1>
          <p className="text-lg text-muted-foreground max-w-3xl mb-4">
            メニューの取得に失敗しました: {error.message}
          </p>
          <div className="bg-red-50 border border-red-200 rounded-md p-4 text-left w-full max-w-2xl">
            <h3 className="text-lg font-medium text-red-800 mb-2">デバッグ情報</h3>
            <p className="text-sm text-red-700">
              このエラーはVercel KVまたはBlobストレージの設定に問題がある可能性があります。
              以下を確認してください:
            </p>
            <ul className="list-disc list-inside mt-2 text-sm text-red-700 space-y-1">
              <li>Vercel KVが正しく設定されていること</li>
              <li>Vercel Blobが正しく設定されていること</li>
              <li>必要な環境変数が.envファイルに設定されていること</li>
              <li>メニューIDが正しい形式であること（例: menu-12345678）</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (!menuData) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="flex flex-col items-center justify-center text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-4">メニューが見つかりません</h1>
          <p className="text-lg text-muted-foreground max-w-3xl mb-4">
            指定されたIDのメニューが見つかりませんでした。
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 text-left w-full max-w-2xl">
            <h3 className="text-lg font-medium text-yellow-800 mb-2">考えられる原因</h3>
            <ul className="list-disc list-inside mt-2 text-sm text-yellow-700 space-y-1">
              <li>メニューIDが無効または存在しない</li>
              <li>ストレージから正しいインデックスデータを取得できない</li>
              <li>Blobストレージからメニューデータを取得できない</li>
              <li>URLパラメータが正しくない（例: <code>?id=menu-12345678</code>の形式であるべき）</li>
            </ul>
            <div className="mt-4 p-3 bg-white rounded border border-yellow-200">
              <h4 className="text-md font-medium text-yellow-800 mb-2">解決方法</h4>
              <p className="text-sm text-yellow-700 mb-2">
                最近のVercelストレージサービスの変更により、既存のメニューデータにアクセスできなくなった可能性があります。
              </p>
              <a 
                href="/create"
                className="inline-block mt-2 px-4 py-2 bg-blue-600 text-white font-medium text-xs leading-tight rounded shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg transition duration-150 ease-in-out"
              >
                新しいメニューを作成する
              </a>
            </div>
          </div>
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
