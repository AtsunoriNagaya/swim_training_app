"use client";

import { useState, useCallback } from "react";
import Link from "next/link";

import { stringify } from "csv-stringify";
import { calculateTotalDistance } from "@/lib/utils";
import { toMarkdownTable } from "@/lib/markdown/mdTable";
import { openPrintPopup } from "@/lib/markdown/printPopup";
import { formatDate, getLoadLevelLabel } from "@/lib/menu-labels";
import { Button } from "@/components/ui/button";
import {
  Download,
  FileText,
  FileSpreadsheet,
  Share2,
  Sparkles,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";

// 生成メニューの表示・出力で共有する型
export interface MenuData {
  id: string;
  title: string;
  createdAt: string;
  aiModel: string;
  loadLevels: string[];
  duration: number;
  notes?: string;
  menu: Array<{
    name: string;
    items: Array<{
      description: string;
      distance: string;
      sets: number;
      circle: string;
      rest: string | number;
      equipment?: string;
      notes?: string;
      time?: number;
    }>;
    totalTime: number;
  }>;
  totalTime: number;
  cooldown: number;
}

export default function MenuExportActions({ menuData }: { menuData: MenuData }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  const buildMarkdown = () => {
    const lines: string[] = [];
    lines.push(`# ${menuData.title}`);
    lines.push("");
    lines.push(`作成日時: ${formatDate(menuData.createdAt)}`);
    lines.push(`負荷レベル: ${menuData.loadLevels.map(l => `${l}(${getLoadLevelLabel(l)})`).join(', ')}`);
    lines.push(`予定時間: ${menuData.duration}分 / 実際の時間: ${menuData.totalTime}分`);
    if (menuData.notes) {
      lines.push("");
      lines.push(`備考: ${menuData.notes}`);
    }

    for (const section of menuData.menu) {
      lines.push("");
      lines.push(`## ${section.name}（${section.totalTime}分）`);
      const headers = ["内容", "距離", "本数", "合計距離", "サイクル", "休憩", "所要時間"];
      const rows = section.items.map((item) => [
        item.description,
        item.distance,
        `${item.sets}`,
        `${calculateTotalDistance(item.distance, item.sets)}m`,
        item.circle,
        typeof item.rest === 'number' && item.rest > 0 ? `${item.rest}分` : '-',
        `${item.time}分`
      ]);
      const align: ("left"|"center"|"right")[] = ["left","right","right","right","left","right","right"];
      lines.push(toMarkdownTable(headers, rows, align));
      // セクション合計
      lines.push("");
      lines.push(`_${section.name}合計: 所要時間 ${section.totalTime}分_`);
    }
    lines.push("");
    lines.push(`### 総合計: ${menuData.totalTime}分`);
    lines.push(`指定時間との差: ${menuData.cooldown}分`);
    return lines.join("\n");
  };

  const handleDownload = useCallback(async (format: "pdf" | "csv") => {
    setIsDownloading(true);

    try {
      if (format === "pdf") {
        const md = buildMarkdown();
        openPrintPopup(md, { title: menuData.title });
      } else if (format === "csv") {
        const csvData = [
          ["水泳練習メニュー"],
          [menuData.title],
          ["作成日時", formatDate(menuData.createdAt)],
          ["負荷レベル", menuData.loadLevels.map(l => `${l}(${getLoadLevelLabel(l)})`).join(', ')],
          ["予定時間", `${menuData.duration}分`],
          ["実際の時間", `${menuData.totalTime}分`],
          ["備考", menuData.notes || ""],
          [""],
          // ヘッダー行
          ["セクション", "内容", "距離", "本数", "合計距離", "サイクル", "休憩", "所要時間", "使用器具", "備考"]
        ];

        // メニューデータ
        menuData.menu.forEach(section => {
          section.items.forEach(item => {
            csvData.push([
              section.name,
              item.description,
              item.distance,
              item.sets.toString(),
              calculateTotalDistance(item.distance, item.sets).toString() + "m",
              item.circle,
              typeof item.rest === 'number' && item.rest > 0 ? `${item.rest}分` : '-',
              `${item.time}分`,
              item.equipment || '',
              item.notes || ''
            ]);
          });
          // セクション合計
          csvData.push(["", `${section.name}合計`, "", "", "", "", "", `${section.totalTime}分`, "", ""]);
          // 空行
          csvData.push([]);
        });

        // 総合計
        csvData.push(
          ["総合計", "", "", "", "", "", "", `${menuData.totalTime}分`, "", ""],
          ["指定時間との差", "", "", "", "", "", "", `${menuData.cooldown}分`, "", ""]
        );

        stringify(csvData, (err, output) => {
          if (err) throw err;
          // UTF-8 BOMを付与
          const BOM = new Uint8Array([0xEF, 0xBB, 0xBF]);
          const blob = new Blob([BOM, output], { type: 'text/csv;charset=utf-8' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `swimming-menu-${menuData.id}.csv`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
        });
      }
      toast({
        title: "ダウンロードを開始しました",
        description: `${menuData.title}を${format.toUpperCase()}形式でダウンロードしています。`,
      });
    } catch (error: any) {
      console.error("Download error:", error);
      toast({
        title: "ダウンロードに失敗しました",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDownloading(false);
    }
  }, [menuData, toast]);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: menuData.title,
          text: "水泳練習メニューを共有します",
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "URLをコピーしました",
          description: "クリップボードにURLをコピーしました",
        });
      }
    } catch (error: any) {
      console.error("Share error:", error);
      toast({
        title: "共有に失敗しました",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="w-full sm:w-auto" disabled={isDownloading}>
            <Download className="mr-2 h-4 w-4" aria-hidden="true" />
            ダウンロード
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => handleDownload("pdf")}>
            <FileText className="mr-2 h-4 w-4" aria-hidden="true" />
            PDF形式
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleDownload("csv")}>
            <FileSpreadsheet className="mr-2 h-4 w-4" aria-hidden="true" />
            CSV形式
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button variant="outline" className="w-full sm:w-auto" onClick={handleShare}>
        <Share2 className="mr-2 h-4 w-4" aria-hidden="true" />
        共有
      </Button>
      <Button asChild className="w-full sm:w-auto">
        <Link href="/create">
          <Sparkles className="mr-2 h-4 w-4" aria-hidden="true" />
          新しいメニューを作成
        </Link>
      </Button>
    </>
  );
}
