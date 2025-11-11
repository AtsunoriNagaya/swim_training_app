"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

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
  const [deleting, setDeleting] = useState<string | null>(null);

  // テストデータ一括削除
  const handleDeleteTestMenus = async () => {
    if (!confirm('テストデータ（mock-で始まるID）をすべて削除しますか？この操作は取り消せません。')) {
      return;
    }

    try {
      setDeleting('test-menus');
      const response = await fetch('/api/delete-test-menus', {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        alert(`${data.deletedCount} 件のテストデータを削除しました`);
        // メニューリストを再取得
        window.location.reload();
      } else {
        alert(`削除に失敗しました: ${data.error}`);
      }
    } catch (error) {
      console.error('テストデータ削除エラー:', error);
      alert('削除に失敗しました');
    } finally {
      setDeleting(null);
    }
  };

  // 個別メニュー削除
  const handleDeleteMenu = async (menuId: string, menuTitle: string) => {
    if (!confirm(`「${menuTitle}」を削除しますか？この操作は取り消せません。`)) {
      return;
    }

    try {
      setDeleting(menuId);
      const response = await fetch(`/api/delete-menu?id=${menuId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        // メニューリストから削除
        setMenus(prevMenus => prevMenus.filter(menu => menu.id !== menuId));
        alert('メニューを削除しました');
      } else {
        alert(`削除に失敗しました: ${data.error}`);
      }
    } catch (error) {
      console.error('メニュー削除エラー:', error);
      alert('削除に失敗しました');
    } finally {
      setDeleting(null);
    }
  };

  // メニューカードクリック処理
  const handleMenuClick = (menu: Menu) => {
    const isGeneratedMenu = !menu.fileType;
    if (isGeneratedMenu) {
      // AI生成メニューは結果ページへ
      window.location.href = `/result?id=${menu.id}`;
    } else {
      // アップロードメニューは専用ページへ
      window.location.href = `/upload-result?id=${menu.id}`;
    }
  };

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
        
        // 作成日時でソート（新しい順）
        dbMenus.sort((a: Menu, b: Menu) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        setMenus(dbMenus);
      } catch (error) {
        console.error('メニュー履歴の取得に失敗しました:', error);
        setError(error instanceof Error ? error.message : 'メニュー履歴の取得に失敗しました');
        setMenus([]);
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

  // テストデータの数をカウント
  const testMenuCount = menus.filter(menu => menu.id.startsWith('mock-')).length;

  return (
    <div className="container px-4 py-8 mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">過去のメニュー</h1>
        {testMenuCount > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={handleDeleteTestMenus}
            disabled={deleting === 'test-menus'}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" />
            {deleting === 'test-menus' ? '削除中...' : `テストデータを削除 (${testMenuCount}件)`}
          </Button>
        )}
      </div>
      <div className="space-y-4">
        {menus.map((menu) => {
          // AI生成メニューかアップロードファイルかを判定
          const isGeneratedMenu = !menu.fileType;
          
          return (
            <Card 
              key={menu.id} 
              className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => handleMenuClick(menu)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-medium">{menu.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      isGeneratedMenu 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {isGeneratedMenu ? 'AI生成' : 'アップロード'}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteMenu(menu.id, menu.title);
                      }}
                      disabled={deleting === menu.id}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
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
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
