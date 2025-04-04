"use client";

import { useState, useCallback } from "react";
import { jsPDF } from "jspdf";

// jspdf-autotableの型定義
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

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
        // Dynamic Import で jspdf と jspdf-autotable を読み込む
        const { jsPDF } = await import("jspdf");
        const { default: autoTable } = await import("jspdf-autotable");

        // 日本語対応のPDF設定
        const doc = new jsPDF({
          orientation: "portrait",
          unit: "mm",
          format: "a4",
          putOnlyUsedFonts: true,
          compress: true,
          hotfixes: ["px_scaling"],
          floatPrecision: 16
        });

        // フォントの設定
        const fontStyles = {
          normal: {
            fontSize: 10,
            lineHeight: 1.2
          },
          title: {
            fontSize: 16,
            lineHeight: 1.5
          },
          small: {
            fontSize: 8,
            lineHeight: 1.1
          }
        };

        // テキスト描画の補助関数
        const drawText = (text: string | null | undefined, x: number, y: number, style: keyof typeof fontStyles = 'normal') => {
          const safeText = text || ""; // textがnull/undefinedなら空文字列を使用
          doc.setFont('helvetica', style); // Explicitly set font
          doc.setFontSize(fontStyles[style].fontSize);

          const processedText = processJapaneseText(safeText); // Restore Japanese processing

          let lines: string[] | null = null;
          try {
            lines = doc.splitTextToSize(
              processedText,
              doc.internal.pageSize.width - x * 2
            );
          } catch (splitError) {
            console.error("Error in doc.splitTextToSize:", splitError, "Input text:", processedText);
            return y; // エラー発生時は描画せず、元のy座標を返す
          }

          // linesが有効な文字列配列か確認
          if (Array.isArray(lines) && lines.length > 0 && lines.every(line => typeof line === 'string')) {
            try {
              doc.text(lines, x, y);
              return y + lines.length * fontStyles[style].fontSize * fontStyles[style].lineHeight;
            } catch (textError) {
              console.error("Error in doc.text:", textError, "Input lines:", lines);
              return y; // エラー発生時は元のy座標を返す
            }
          } else {
            // linesが無効な場合はログを出力（デバッグ用）
            console.warn("doc.splitTextToSize returned invalid lines:", lines, "Input text:", processedText);
            return y; // テキストが描画されなかった場合は元のy座標を返す
          }
        };

        // 日本語文字列の処理
        const processJapaneseText = (text: string) => {
          if (!text) return "";
          return text.split('').map(char => {
            const code = char.charCodeAt(0);
            if (code > 127) {
              // 日本語文字の場合は半角に変換
              if (code >= 0xFF01 && code <= 0xFF5E) {
                return String.fromCharCode(code - 0xFEE0);
              }
              // その他の日本語文字はそのまま
              return char;
            }
            return char;
          }).join('');
        };
        
        // タイトルと基本情報
        let yPos = 20;
        yPos = drawText(menuData.title, 14, yPos, 'title');
        yPos += 10;
        
        yPos = drawText(`作成日時: ${formatDate(menuData.createdAt)}`, 14, yPos);
        yPos = drawText(`負荷レベル: ${menuData.loadLevels.map(l => `${l}(${getLoadLevelLabel(l)})`).join(', ')}`, 14, yPos + 5);
        yPos = drawText(`予定時間: ${menuData.duration}分 / 実際の時間: ${menuData.totalTime}分`, 14, yPos + 5);
        
        if (menuData.notes) {
          yPos = drawText('備考:', 14, yPos + 5);
          yPos = drawText(menuData.notes, 14, yPos + 3, 'small');
        }

        yPos = menuData.notes ? yPos + 10 : yPos + 5;

        // 各セクションのメニュー
        menuData.menu.forEach((section, index) => {
          yPos = drawText(`${section.name} (${section.totalTime}分)`, 14, yPos);
          yPos += 5;

          let tableFinalY = yPos; // テーブルの最終Y座標を保存する変数

          const sectionRows = section.items.map((item) => ({
            content: [
              processJapaneseText(item.description),
              processJapaneseText(item.distance),
              processJapaneseText(`${item.sets}本`),
              processJapaneseText(`${calculateTotalDistance(item.distance, item.sets)}m`),
              processJapaneseText(item.circle),
              processJapaneseText(typeof item.rest === 'number' && item.rest > 0 ? `${item.rest}分` : '-'),
              processJapaneseText(`${item.time}分`),
              processJapaneseText([
                item.equipment ? `器具: ${item.equipment}` : '',
                item.notes || ''
              ].filter(Boolean).join('\n'))
            ]
          }));

          // セクション合計行
          const sectionTotalRow = {
            content: [
              processJapaneseText(`${section.name}合計`),
              '',
              '',
              processJapaneseText(`${section.items.reduce((sum, item) => sum + calculateTotalDistance(item.distance, item.sets), 0).toString()}m`),
              '',
              '',
              processJapaneseText(`${section.totalTime}分`),
              ''
            ],
            styles: {
              fillColor: [245, 245, 245],
              textColor: [80, 80, 80],
              fontStyle: 'bold',
              fontSize: 8,
              cellPadding: { top: 4, right: 3, bottom: 4, left: 3 },
              halign: 'right'
            }
          };

          autoTable(doc, {
            startY: yPos,
            head: [["内容", "距離", "本数", "合計距離", "サイクル", "休憩", "所要時間", "備考"].map(processJapaneseText)],
            body: [...sectionRows, sectionTotalRow],
            theme: 'grid',
            styles: { 
              fontSize: 9,
              cellPadding: { top: 4, right: 3, bottom: 4, left: 3 },
              lineColor: [220, 220, 220],
              lineWidth: 0.1,
              font: 'helvetica',
              overflow: 'linebreak',
              cellWidth: 'wrap',
              valign: 'middle',
              minCellHeight: 8
            },
            headStyles: { 
              fillColor: [40, 40, 40],
              textColor: [255, 255, 255],
              fontStyle: 'bold',
              font: 'helvetica',
              halign: 'center',
              fontSize: 9,
              cellPadding: { top: 5, right: 3, bottom: 5, left: 3 }
            },
            bodyStyles: {
              halign: 'left'
            },
            alternateRowStyles: {
              fillColor: [252, 252, 252]
            },
            willDrawCell: function(data: any) {
              // セクション合計行のスタイル調整
              if (data.row.raw === sectionTotalRow) {
                data.cell.styles.fillColor = sectionTotalRow.styles.fillColor;
                data.cell.styles.textColor = sectionTotalRow.styles.textColor;
                data.cell.styles.fontStyle = sectionTotalRow.styles.fontStyle;
                data.cell.styles.fontSize = data.cell.styles.fontSize;
                data.cell.styles.cellPadding = data.cell.styles.cellPadding;
                data.cell.styles.halign = data.cell.styles.halign;
              }
            },
            columnStyles: {
              0: { cellWidth: 45 },          // 内容
              1: { cellWidth: 18 },          // 距離
              2: { cellWidth: 15 },          // 本数
              3: { cellWidth: 22 },          // 合計距離
              4: { cellWidth: 18 },          // サイクル
              5: { cellWidth: 15 },          // 休憩
              6: { cellWidth: 18, halign: 'right' }, // 所要時間
              7: { cellWidth: 35 }           // 備考
            },
            tableWidth: 186,
            margin: { top: 8, right: 14, bottom: 8, left: 14 },
            didDrawCell: function(data: any) {
              // セル内のテキストが日本語を含む場合、位置を微調整
              if (data.cell.text && /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf]/.test(data.cell.text)) {
                const fontSize = data.row.section === 'head' ? 9 : 8;
                data.cell.styles.fontSize = fontSize;
                // 備考欄の場合は左寄せ
                if (data.column === 7) {
                  data.cell.styles.halign = 'left';
                }
              }
            },
            didParseCell: function(data: any) {
              // 数値を含むセルは右寄せ
              if (data.cell.text && /^[\d,]+[^\u3000-\u9faf]*$/.test(data.cell.text)) {
                data.cell.styles.halign = 'right';
              }
            },
            didDrawPage: function(data: any) {
              tableFinalY = data.table.finalY; // 最終Y座標を更新
            }
          });

          yPos = tableFinalY + 10;
        });

        // 総合計テーブル
        autoTable(doc, {
          startY: yPos + 5,
          head: [],
          body: [
            [
              {
                content: [
                  processJapaneseText('総合計'),
                  processJapaneseText(`${menuData.menu.reduce((sum, section) =>
                    sum + section.items.reduce((sectionSum, item) =>
                      sectionSum + calculateTotalDistance(item.distance, item.sets), 0), 0)}m`), // Add initial value 0 for outer reduce
                  processJapaneseText(`練習時間: ${menuData.totalTime}分`),
                  processJapaneseText(`指定時間との差: ${menuData.cooldown}分`)
                ].join('    '),
                styles: {
                  fillColor: [235, 235, 235],
                  textColor: [50, 50, 50],
                  fontStyle: 'bold',
                  fontSize: 10,
                  cellPadding: { top: 8, right: 6, bottom: 8, left: 6 },
                  halign: 'right',
                  valign: 'middle'
                }
              }
            ]
          ],
          theme: 'grid',
          styles: {
            lineColor: [220, 220, 220],
            lineWidth: 0.1,
            font: 'helvetica'
          },
          margin: { top: 8, right: 14, bottom: 8, left: 14 },
          tableWidth: 186,
          columnStyles: {
            0: { cellWidth: 186 } // 全体の幅を合わせる
          }
        });

        // フッター
        const pageCount = (doc.internal as any).getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          drawText(
            `${menuData.title} - ${formatDate(menuData.createdAt)} - ページ ${i} / ${pageCount}`,
            14,
            doc.internal.pageSize.height - 10,
            'small'
          );
        }

        doc.save(`swimming-menu-${menuData.id}.pdf`);
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
