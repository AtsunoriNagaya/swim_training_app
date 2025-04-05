"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface Menu {
  id: string;
  title: string;
  description: string;
  fileType: string;
  fileSize: string;
  createdAt: string;
  content: string;
}

export default function HistoryPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ローカルストレージからメニューデータを取得
    const storedMenus = JSON.parse(localStorage.getItem('swim-training-menus') || '[]');
    setMenus(storedMenus);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="container px-4 py-8 mx-auto">
        <h1 className="mb-6 text-2xl font-bold">過去のメニュー</h1>
        <p>読み込み中...</p>
      </div>
    );
  }

  if (menus.length === 0) {
    return (
      <div className="container px-4 py-8 mx-auto">
        <h1 className="mb-6 text-2xl font-bold">過去のメニュー</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-500">過去のメニューはありません</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container px-4 py-8 mx-auto">
      <h1 className="mb-6 text-2xl font-bold">過去のメニュー</h1>
      <div className="space-y-4">
        {menus.map((menu) => (
          <Card key={menu.id} className="overflow-hidden">
            <CardContent className="p-6">
              <h3 className="text-lg font-medium">{menu.title}</h3>
              <div className="mt-2 text-sm text-gray-500">
                <p>作成日: {new Date(menu.createdAt).toLocaleString('ja-JP')}</p>
                <p>ファイル形式: {menu.fileType === 'application/pdf' ? 'PDF' : 'CSV'}</p>
                <p>ファイルサイズ: {menu.fileSize}</p>
                {menu.description && <p>説明: {menu.description}</p>}
              </div>
              {menu.content && menu.fileType === 'text/csv' && (
                <div className="p-4 mt-4 overflow-auto text-sm bg-gray-50 rounded-lg max-h-40">
                  <pre className="whitespace-pre-wrap">{menu.content}</pre>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
