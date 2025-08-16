"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface Menu {
  id: string;
  title: string;
  description: string;
  fileType?: string;
  fileSize?: string;
  createdAt: string;
  content?: string;
}

export default function HistoryPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMenuHistory = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // データベースからメニュー履歴を取得
        const response = await fetch('/api/get-menu-history');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }
        
        // データベースから取得したメニューを設定
        const dbMenus = data.menuHistory || [];
        
        // ローカルストレージからもメニューデータを取得（アップロードされたファイル用）
        const storedMenus = JSON.parse(localStorage.getItem('swim-training-menus') || '[]');
        
        // データベースのメニューとローカルストレージのメニューを統合
        // データベースのメニューを優先し、重複を避ける
        const allMenus = [...dbMenus];
        
        // ローカルストレージのメニューで、データベースにないものを追加
        storedMenus.forEach((localMenu: Menu) => {
          const existsInDb = dbMenus.some((dbMenu: Menu) => dbMenu.id === localMenu.id);
          if (!existsInDb) {
            allMenus.push(localMenu);
          }
        });
        
        // 作成日時でソート（新しい順）
        allMenus.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        setMenus(allMenus);
      } catch (error) {
        console.error('メニュー履歴の取得に失敗しました:', error);
        setError(error instanceof Error ? error.message : 'メニュー履歴の取得に失敗しました');
        
        // エラーが発生した場合はローカルストレージのデータのみを表示
        const storedMenus = JSON.parse(localStorage.getItem('swim-training-menus') || '[]');
        setMenus(storedMenus);
      } finally {
        setLoading(false);
      }
    };

    fetchMenuHistory();
  }, []);

  if (loading) {
    return (
      <div className="container px-4 py-8 mx-auto">
        <h1 className="mb-6 text-2xl font-bold">過去のメニュー</h1>
        <p>読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container px-4 py-8 mx-auto">
        <h1 className="mb-6 text-2xl font-bold">過去のメニュー</h1>
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-red-500">エラー: {error}</p>
            <p className="text-center text-gray-500 mt-2">ローカルストレージのデータのみ表示しています</p>
          </CardContent>
        </Card>
        {menus.length > 0 && (
          <div className="space-y-4 mt-6">
            {menus.map((menu) => (
              <Card key={menu.id} className="overflow-hidden">
                <CardContent className="p-6">
                  <h3 className="text-lg font-medium">{menu.title}</h3>
                  <div className="mt-2 text-sm text-gray-500">
                    <p>作成日: {new Date(menu.createdAt).toLocaleString('ja-JP')}</p>
                    {menu.fileType && <p>ファイル形式: {menu.fileType === 'application/pdf' ? 'PDF' : 'CSV'}</p>}
                    {menu.fileSize && <p>ファイルサイズ: {menu.fileSize}</p>}
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
        )}
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
        {menus.map((menu) => {
          // AI生成メニューかアップロードファイルかを判定
          const isGeneratedMenu = !menu.fileType;
          
          return (
            <Card key={menu.id} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-medium">{menu.title}</h3>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    isGeneratedMenu 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {isGeneratedMenu ? 'AI生成' : 'アップロード'}
                  </span>
                </div>
                <div className="mt-2 text-sm text-gray-500">
                  <p>作成日: {new Date(menu.createdAt).toLocaleString('ja-JP')}</p>
                  {menu.fileType && <p>ファイル形式: {menu.fileType === 'application/pdf' ? 'PDF' : 'CSV'}</p>}
                  {menu.fileSize && <p>ファイルサイズ: {menu.fileSize}</p>}
                  {menu.description && <p>説明: {menu.description}</p>}
                </div>
                {menu.content && menu.fileType === 'text/csv' && (
                  <div className="p-4 mt-4 overflow-auto text-sm bg-gray-50 rounded-lg max-h-40">
                    <pre className="whitespace-pre-wrap">{menu.content}</pre>
                  </div>
                )}
                {isGeneratedMenu && (
                  <div className="mt-4">
                    <a 
                      href={`/result?menuId=${menu.id}`}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
                    >
                      メニューを表示
                    </a>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
