"use client";

import { useState, useCallback } from "react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import fontkit from '@pdf-lib/fontkit';

import { stringify } from "csv-stringify";
import { calculateTotalDistance } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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

// メニューデータの型定義
interface MenuData {
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

export default function TrainingMenuResult({ menuData }: { menuData: MenuData }) {
  const [isDownloading, setIsDownloading] = useState(false);
  const { toast } = useToast();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  const getLoadLevelLabel = (level: string) => {
    switch (level) {
      case "A":
        return "高負荷";
      case "B":
        return "中負荷";
      case "C":
        return "低負荷";
      default:
        return level;
    }
  };

  const getLoadLevelColor = (level: string) => {
    switch (level) {
      case "A":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800/30";
      case "B":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800/30";
      case "C":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800/30";
      default:
        return "";
    }
  };

  const handleDownload = useCallback(async (format: "pdf" | "csv") => {
    setIsDownloading(true);

    try {
      if (format === "pdf") {
        // PDFドキュメントを作成
        const pdfDoc = await PDFDocument.create();
        
        // フォントの読み込み
        const fontUrl = 'https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-jp@5.0.16/files/noto-sans-jp-japanese-400-normal.woff';
        const fontResponse = await fetch(fontUrl);
        const fontBytes = await fontResponse.arrayBuffer();
        
        // フォントを登録
        await pdfDoc.registerFontkit(fontkit);
        const customFont = await pdfDoc.embedFont(fontBytes);
        
        // ページを追加
        let page = pdfDoc.addPage([595.28, 841.89]); // A4サイズ
        const { width, height } = page.getSize();
        
        // フォントサイズの設定
        const fontSize = {
          title: 16,
          normal: 12,
          small: 10
        };

        // 現在のY位置（上から下に進む）
        let yPos = height - 50;
        
        // タイトルを描画
        page.drawText(menuData.title, {
          x: 50,
          y: yPos,
          font: customFont,
          size: fontSize.title,
          color: rgb(0, 0, 0)
        });
        
        yPos -= 30;
        
        // 基本情報を描画
        page.drawText(`作成日時: ${formatDate(menuData.createdAt)}`, {
          x: 50,
          y: yPos,
          font: customFont,
          size: fontSize.normal,
          color: rgb(0, 0, 0)
        });
        
        yPos -= 20;
        
        page.drawText(`負荷レベル: ${menuData.loadLevels.map(l => `${l}(${getLoadLevelLabel(l)})`).join(', ')}`, {
          x: 50,
          y: yPos,
          font: customFont,
          size: fontSize.normal,
          color: rgb(0, 0, 0)
        });
        
        yPos -= 20;
        
        page.drawText(`予定時間: ${menuData.duration}分 / 実際の時間: ${menuData.totalTime}分`, {
          x: 50,
          y: yPos,
          font: customFont,
          size: fontSize.normal,
          color: rgb(0, 0, 0)
        });
        
        if (menuData.notes) {
          yPos -= 20;
          page.drawText('備考:', {
            x: 50,
            y: yPos,
            font: customFont,
            size: fontSize.normal,
            color: rgb(0, 0, 0)
          });
          
          yPos -= 15;
          page.drawText(menuData.notes, {
            x: 50,
            y: yPos,
            font: customFont,
            size: fontSize.small,
            color: rgb(0, 0, 0)
          });
        }
        
        yPos -= 30;
        
        // メニューセクションを描画
        for (const section of menuData.menu) {
          // セクションヘッダー
          page.drawText(`${section.name} (${section.totalTime}分)`, {
            x: 50,
            y: yPos,
            font: customFont,
            size: fontSize.normal,
            color: rgb(0, 0, 0)
          });
          
          yPos -= 20;
          
          // テーブルヘッダー
          const headers = ["内容", "距離", "本数", "合計距離", "サイクル", "休憩", "所要時間"];
          const columnWidths = [150, 60, 50, 70, 60, 50, 60];
          let xPos = 50;
          
          // ヘッダー背景
          page.drawRectangle({
            x: xPos,
            y: yPos - 15,
            width: columnWidths.reduce((a, b) => a + b, 0),
            height: 20,
            color: rgb(0.9, 0.9, 0.9)
          });
          
          // ヘッダーテキスト
          headers.forEach((header, i) => {
            page.drawText(header, {
              x: xPos + 5,
              y: yPos,
              font: customFont,
              size: fontSize.small,
              color: rgb(0, 0, 0)
            });
            xPos += columnWidths[i];
          });
          
          yPos -= 25;
          
          // アイテムの描画
          for (const item of section.items) {
            if (yPos < 50) {
              // 新しいページを追加
              page = pdfDoc.addPage([595.28, 841.89]);
              yPos = height - 50;
            }
            
            xPos = 50;
            
            // セルの内容を描画
            const cells = [
              item.description,
              item.distance,
              `${item.sets}本`,
              `${calculateTotalDistance(item.distance, item.sets)}m`,
              item.circle,
              typeof item.rest === 'number' && item.rest > 0 ? `${item.rest}分` : '-',
              `${item.time}分`
            ];
            
            cells.forEach((cell, i) => {
              page.drawText(cell, {
                x: xPos + 5,
                y: yPos,
                font: customFont,
                size: fontSize.small,
                color: rgb(0, 0, 0)
              });
              xPos += columnWidths[i];
            });
            
            yPos -= 20;
          }
          
          yPos -= 10;
        }
        
        // PDFをバイナリデータとして取得
        const pdfBytes = await pdfDoc.save();
        
        // Blobを作成してダウンロード
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `swimming-menu-${menuData.id}.pdf`;
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(a);
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
    <Card className="water-card shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <CardTitle className="text-2xl gradient-text">{menuData.title}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {formatDate(menuData.createdAt)} 作成 • {menuData.aiModel} 使用
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {menuData.loadLevels.map((level) => (
              <Badge key={level} variant="outline" className={getLoadLevelColor(level)}>
                {level}（{getLoadLevelLabel(level)}）
              </Badge>
            ))}
            <Badge className="bg-primary/10 text-primary border-primary/20 dark:bg-primary/20 dark:text-primary-foreground dark:border-primary/30">
              {menuData.duration}分メニュー
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {menuData.notes && (
          <div className="mb-6 p-4 bg-gradient-to-r from-primary/5 to-secondary/5 dark:from-primary/10 dark:to-secondary/10 rounded-md border border-primary/10">
            <p className="text-sm font-medium">備考・特記事項:</p>
            <p className="text-sm mt-1">{menuData.notes}</p>
          </div>
        )}

        <div className="space-y-6">
          {menuData.menu.map((section, index) => (
            <div key={index} className="rounded-lg border border-primary/10 overflow-hidden">
              <div className="bg-gradient-to-r from-primary/10 to-transparent dark:from-primary/20 p-3 flex justify-between items-center">
                <h3 className="text-lg font-semibold">{section.name}</h3>
                <span className="text-sm font-medium bg-white/70 dark:bg-gray-800/70 px-2 py-1 rounded-full">
                  合計: {section.totalTime}分
                </span>
              </div>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="w-[40%]">内容</TableHead>
                    <TableHead className="w-[15%]">距離</TableHead>
                    <TableHead className="w-[10%]">本数</TableHead>
                    <TableHead className="w-[15%]">サイクル</TableHead>
                    <TableHead className="text-right w-[20%]">所要時間</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {section.items.map((item, itemIndex) => (
                    <TableRow key={itemIndex} className="hover:bg-primary/5">
                      <TableCell className="font-medium">
                        {item.description}
                        {item.equipment && (
                          <Badge variant="outline" className="ml-2 bg-blue-50 text-blue-800 border-blue-200">
                            {item.equipment}
                          </Badge>
                        )}
                        {item.notes && (
                          <p className="text-sm text-muted-foreground mt-1">{item.notes}</p>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-sm">
                          {item.distance}
                          <span className="text-muted-foreground"> × </span>
                          {item.sets}本
                        </div>
                        <div className="text-xs text-muted-foreground">
                          計: {calculateTotalDistance(item.distance, item.sets)}m
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono">{item.sets}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-sm">{item.circle}</div>
                        {typeof item.rest === 'number' && item.rest > 0 && (
                          <div className="text-xs text-muted-foreground">
                            休憩: {item.rest}分
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-mono font-medium">{item.time}分</div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 border border-primary/20 rounded-md bg-gradient-to-r from-primary/5 to-secondary/5 dark:from-primary/10 dark:to-secondary/10">
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium text-lg">合計練習時間: {menuData.totalTime}分</p>
              <p className="text-sm text-muted-foreground">
                指定時間（{menuData.duration}分）との差: {menuData.cooldown}分
              </p>
            </div>
            <div>
              <Badge
                variant="outline"
                className={`text-sm px-3 py-1 ${
                  menuData.cooldown > 0
                    ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200 dark:border-green-800/30"
                    : "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border-amber-200 dark:border-amber-800/30"
                }`}
              >
                {menuData.cooldown > 0 ? `残り${menuData.cooldown}分（クールダウン等に活用）` : "時間ぴったり"}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col sm:flex-row gap-4 pt-6">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="w-full sm:w-auto border-primary/20 hover:border-primary/40 hover:bg-primary/5"
            >
              <Download className="mr-2 h-4 w-4" />
              ダウンロード
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => handleDownload("pdf")}>
              <FileText className="mr-2 h-4 w-4" />
              PDF形式
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleDownload("csv")}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              CSV形式
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button
          variant="outline"
          className="w-full sm:w-auto border-primary/20 hover:border-primary/40 hover:bg-primary/5"
          onClick={handleShare}
        >
          <Share2 className="mr-2 h-4 w-4" />
          共有
        </Button>
        <Button
          className="w-full sm:w-auto bg-gradient-to-r from-primary to-secondary hover:shadow-lg hover:shadow-primary/20 transition-all duration-300"
          onClick={() => (window.location.href = "/create")}
        >
          <Sparkles className="mr-2 h-4 w-4" />
          新しいメニューを作成
        </Button>
      </CardFooter>
    </Card>
  );
}
