"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, Trash2, Waves } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import MenuHistoryCard, { type Menu } from "@/components/menu-history-card";

type DeleteTarget =
  | { kind: "menu"; id: string; title: string }
  | { kind: "test-menus"; count: number };

export default function HistoryPage() {
  const [menus, setMenus] = useState<Menu[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const { toast } = useToast();

  const fetchMenuHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/get-menu-history");

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const dbMenus: Menu[] = data.menuHistory || [];

      // 作成日時でソート（新しい順）
      dbMenus.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      setMenus(dbMenus);
    } catch (error) {
      console.error("メニュー履歴の取得に失敗しました:", error);
      setError(error instanceof Error ? error.message : "メニュー履歴の取得に失敗しました");
      setMenus([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMenuHistory();
  }, [fetchMenuHistory]);

  // 個別メニュー削除（確認ダイアログの「削除する」から呼ばれる）
  const deleteMenu = async (id: string, title: string) => {
    try {
      setDeleting(id);
      const response = await fetch(`/api/delete-menu?id=${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        setMenus((prevMenus) => prevMenus.filter((menu) => menu.id !== id));
        toast({
          title: "メニューを削除しました",
          description: `「${title}」を削除しました。`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "削除に失敗しました",
          description: data.error,
        });
      }
    } catch (error) {
      console.error("メニュー削除エラー:", error);
      toast({
        variant: "destructive",
        title: "削除に失敗しました",
        description: "時間をおいて再度お試しください。",
      });
    } finally {
      setDeleting(null);
    }
  };

  // テストデータ一括削除
  const deleteTestMenus = async () => {
    try {
      setDeleting("test-menus");
      const response = await fetch("/api/delete-test-menus", {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "テストデータを削除しました",
          description: `${data.deletedCount} 件のテストデータを削除しました。`,
        });
        await fetchMenuHistory();
      } else {
        toast({
          variant: "destructive",
          title: "削除に失敗しました",
          description: data.error,
        });
      }
    } catch (error) {
      console.error("テストデータ削除エラー:", error);
      toast({
        variant: "destructive",
        title: "削除に失敗しました",
        description: "時間をおいて再度お試しください。",
      });
    } finally {
      setDeleting(null);
    }
  };

  const handleConfirmDelete = () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    if (target.kind === "menu") {
      void deleteMenu(target.id, target.title);
    } else {
      void deleteTestMenus();
    }
  };

  // テストデータの数をカウント
  const testMenuCount = menus.filter((menu) => menu.id.startsWith("mock-")).length;

  return (
    <div className="container mx-auto px-4 py-8 md:py-12">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold tracking-tight">過去のメニュー</h1>
        {!loading && !error && testMenuCount > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setDeleteTarget({ kind: "test-menus", count: testMenuCount })}
            disabled={deleting === "test-menus"}
            className="flex items-center gap-2"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            {deleting === "test-menus" ? "削除中..." : `テストデータを削除 (${testMenuCount}件)`}
          </Button>
        )}
      </div>

      {loading ? (
        <div role="status" aria-busy="true" className="space-y-4">
          <span className="sr-only">読み込み中...</span>
          {[0, 1, 2].map((i) => (
            <Card key={i}>
              <CardContent className="space-y-3 p-6">
                <div className="flex items-start justify-between gap-3">
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-6 w-20" />
                </div>
                <Skeleton className="h-4 w-48" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>エラー: メニュー履歴を取得できませんでした</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button variant="outline" onClick={() => void fetchMenuHistory()}>
            再試行
          </Button>
        </div>
      ) : menus.length === 0 ? (
        <div role="status" className="rounded-lg border border-dashed px-6 py-12 text-center">
          <Waves className="mx-auto h-12 w-12 text-muted-foreground" aria-hidden="true" />
          <p className="mt-4 text-lg font-medium">過去のメニューはありません</p>
          <p className="mt-1 text-sm text-muted-foreground">
            メニューを作成すると、ここに履歴が表示されます。
          </p>
          <Button asChild className="mt-6">
            <Link href="/create">メニューを作成する</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {menus.map((menu) => (
            <MenuHistoryCard
              key={menu.id}
              menu={menu}
              deleting={deleting === menu.id}
              onDeleteClick={(m) => setDeleteTarget({ kind: "menu", id: m.id, title: m.title })}
            />
          ))}
        </div>
      )}

      <AlertDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteTarget?.kind === "test-menus"
                ? "テストデータをすべて削除しますか？"
                : "メニューを削除しますか？"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.kind === "test-menus"
                ? `mock- で始まる ${deleteTarget.count} 件のテストデータを削除します。この操作は取り消せません。`
                : deleteTarget
                  ? `「${deleteTarget.title}」を削除します。この操作は取り消せません。`
                  : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>キャンセル</AlertDialogCancel>
            <AlertDialogAction
              className={buttonVariants({ variant: "destructive" })}
              onClick={handleConfirmDelete}
            >
              削除する
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
