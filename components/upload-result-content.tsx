'use client';

import React from "react";
import { useSearchParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download } from "lucide-react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface UploadedMenu {
  id: string;
  title: string;
  description: string;
  fileType: string;
  fileSize: string;
  createdAt: string;
  content: string;
}

export default function UploadResultContent() {
  const [menuData, setMenuData] = React.useState<UploadedMenu | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);
  const searchParams = useSearchParams();
  const { toast } = useToast();

  React.useEffect(() => {
    const menuId = searchParams.get('id');
    if (!menuId) {
      setLoading(false);
      setError(new Error("メニューIDが指定されていません"));
      return;
    }

    // データベースからアップロードメニューを取得
    const fetchUploadedMenu = async () => {
      try {
        const response = await fetch(`/api/get-uploaded-file?id=${menuId}`);
        if (!response.ok) {
          throw new Error('メニューの取得に失敗しました');
        }
        
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || 'メニューが見つかりません');
        }
        
        const menu = data.menu;
        setMenuData(menu);
        
        // PDFファイルの場合、Base64からBlobURLを生成
        if (menu.fileType === 'application/pdf' && menu.content) {
          try {
            const binaryString = atob(menu.content);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
              bytes[i] = binaryString.charCodeAt(i);
            }
            const blob = new Blob([bytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            setPdfUrl(url);
          } catch (error) {
            console.error('PDF URL生成エラー:', error);
          }
        }
      } catch (error) {
        console.error('メニュー取得エラー:', error);
        setError(error instanceof Error ? error : new Error('メニューの取得に失敗しました'));
      } finally {
        setLoading(false);
      }
    };

    fetchUploadedMenu();
  }, [searchParams]);

  // クリーンアップ: コンポーネントがアンマウントされる際にURLを解放
  React.useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  const handleDownload = () => {
    if (!menuData) return;

    if (menuData.fileType === 'application/pdf' && pdfUrl) {
      // PDFの場合はBlobストレージから直接ダウンロード
      const a = document.createElement('a');
      a.href = pdfUrl;
      
      // ファイル名から既存の拡張子を削除してから正しい拡張子を追加
      const fileNameWithoutExt = menuData.title.replace(/\.(pdf|csv)$/i, '');
      a.download = `${fileNameWithoutExt}.pdf`;
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else if (menuData.fileType === 'text/csv') {
      // CSVファイルの場合はcontentから生成
      const blob = new Blob([menuData.content], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // ファイル名から既存の拡張子を削除してから正しい拡張子を追加
      const fileNameWithoutExt = menuData.title.replace(/\.(pdf|csv)$/i, '');
      a.download = `${fileNameWithoutExt}.csv`;
      
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      toast({
        variant: "destructive",
        title: "ダウンロードできません",
        description: "ダウンロードできるファイルがありません。",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div role="status" className="flex flex-col items-center justify-center text-center mb-8">
          <h1 className="text-3xl font-bold tracking-tight mb-4">読み込み中...</h1>
        </div>
      </div>
    );
  }

  if (error || !menuData) {
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

        <div className="max-w-2xl mx-auto">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>メニューを表示できません</AlertTitle>
            <AlertDescription>{error?.message || "メニューが見つかりません"}</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    if (menuData.fileType === 'text/csv') {
      // CSVファイルをテーブル形式で表示
      const lines = menuData.content.split('\n').filter(line => line.trim());
      if (lines.length === 0) return <p>ファイルが空です</p>;

      const headers = lines[0].split(',').map(h => h.trim());
      const rows = lines.slice(1).map(line => line.split(',').map(cell => cell.trim()));

      return (
        <div className="w-full">
          <div className="mb-4 text-center">
            <p className="text-sm text-muted-foreground">CSVファイルの内容をテーブル形式で表示しています</p>
          </div>
          <div className="w-full overflow-x-auto bg-card rounded-lg border shadow-sm">
            <table className="w-full border-collapse">
              <caption className="sr-only">アップロードされたCSVファイルの内容</caption>
              <thead>
                <tr className="bg-muted/50 border-b">
                  {headers.map((header, index) => (
                    <th key={index} scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider border-r last:border-r-0">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-muted/50">
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-foreground border-r last:border-r-0">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      );
    } else if (menuData.fileType === 'application/pdf') {
      // PDFファイルをブラウザ内で表示
      if (pdfUrl) {
        return (
          <div className="w-full">
            <div className="mb-4 text-center">
              <p className="text-sm text-muted-foreground">PDFファイルをブラウザ内で表示しています</p>
            </div>
            <div className="w-full h-[600px] border rounded-lg overflow-hidden">
              <iframe
                src={pdfUrl}
                className="w-full h-full"
                title="PDF Viewer"
                style={{ border: 'none' }}
              />
            </div>
          </div>
        );
      } else {
        return (
          <div role="status" className="text-center py-8">
            <p className="text-lg mb-4">PDFファイルの読み込み中...</p>
          </div>
        );
      }
    } else {
      // その他のファイル形式
      return (
        <div className="p-4 bg-muted rounded-lg">
          <pre className="whitespace-pre-wrap text-sm">{menuData.content}</pre>
        </div>
      );
    }
  };

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

      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold mb-2">{menuData.title}</h1>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>アップロード日: {new Date(menuData.createdAt).toLocaleString('ja-JP')}</p>
                  <p>ファイル形式: {menuData.fileType === 'application/pdf' ? 'PDF' : 'CSV'}</p>
                  <p>ファイルサイズ: {menuData.fileSize}</p>
                  {menuData.description && <p>説明: {menuData.description}</p>}
                </div>
              </div>
              <Button onClick={handleDownload} variant="outline" className="flex items-center gap-2">
                <Download className="h-4 w-4" aria-hidden="true" />
                ダウンロード
              </Button>
            </div>
            
            <div className="border-t pt-6">
              {renderContent()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
