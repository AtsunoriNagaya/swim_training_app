"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";

export interface Menu {
  id: string;
  title: string;
  description: string;
  fileType?: string;
  fileSize?: string;
  createdAt: string;
  content?: string;
}

interface MenuHistoryCardProps {
  menu: Menu;
  deleting: boolean;
  onDeleteClick: (menu: Menu) => void;
}

export default function MenuHistoryCard({ menu, deleting, onDeleteClick }: MenuHistoryCardProps) {
  const isGeneratedMenu = !menu.fileType;
  const href = isGeneratedMenu ? `/result?id=${menu.id}` : `/upload-result?id=${menu.id}`;

  return (
    <Card className="relative overflow-hidden transition-shadow hover:shadow-md focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-3">
          {/* ページの h1 直下に来るため h2(見出し階層のスキップを避ける) */}
          <h2 className="text-lg font-medium">
            {/* リンクの after 疑似要素でカード全体をクリック領域にする(stretched link) */}
            <Link
              href={href}
              className="after:absolute after:inset-0 hover:underline focus-visible:outline-none"
            >
              {menu.title}
            </Link>
          </h2>
          <div className="flex shrink-0 items-center gap-2">
            <Badge
              variant="outline"
              className={
                isGeneratedMenu
                  ? "border-primary/30 bg-primary/10 text-primary"
                  : "border-accent/30 bg-accent/10 text-accent"
              }
            >
              {isGeneratedMenu ? "AI生成" : "アップロード"}
            </Badge>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDeleteClick(menu)}
              disabled={deleting}
              aria-label={`「${menu.title}」を削除`}
              className="relative z-10 h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
        <div className="mt-2 space-y-0.5 text-sm text-muted-foreground">
          <p>作成日: {new Date(menu.createdAt).toLocaleString("ja-JP")}</p>
          {menu.fileType && <p>ファイル形式: {menu.fileType === "application/pdf" ? "PDF" : "CSV"}</p>}
          {menu.fileSize && <p>ファイルサイズ: {menu.fileSize}</p>}
          {menu.description && <p>説明: {menu.description}</p>}
        </div>
        {menu.content && menu.fileType === "text/csv" && (
          <div className="mt-4 max-h-40 overflow-auto rounded-lg bg-muted p-4 text-sm">
            <pre className="whitespace-pre-wrap">{menu.content}</pre>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
