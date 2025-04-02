"use client";

import { useState, useCallback } from "react";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { stringify } from "csv-stringify";
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

interface MenuItem {
  description: string;
  time: number;
}

interface MenuSection {
  name: string;
  items: MenuItem[];
  totalTime: number;
}

interface MenuData {
  id: string;
  title: string;
  createdAt: string;
  aiModel: string;
  loadLevels: string[];
  duration: number;
  notes?: string;
  menu: MenuSection[];
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
        const doc = new jsPDF();
        doc.text(menuData.title, 10, 10);

        (doc as any).autoTable({
          head: [["内容", "時間"]],
          body: menuData.menu.flatMap((section) =>
            section.items.map((item) => [item.description, item.time])
          ),
        });

        doc.save(`swimming-menu-${menuData.id}.pdf`);
      } else if (format === "csv") {
        const csvData = [
          ["内容", "時間"],
          ...menuData.menu.flatMap((section) =>
            section.items.map((item) => [item.description, item.time])
          ),
        ];

        stringify(csvData, (err, output) => {
          if (err) throw err;
          const blob = new Blob([output]);
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
        title: "Download started",
        description: `Downloading ${menuData.title} in ${format} format.`,
      });
    } catch (error: any) {
      console.error("Download error:", error);
      toast({
        title: "Download failed",
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
          text: "Check out this swimming workout menu!",
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Copied to clipboard!",
          description: "URL copied to clipboard",
        });
      }
    } catch (error: any) {
      console.error("Share error:", error);
      toast({
        title: "Share failed",
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
                    <TableHead className="w-[80%]">内容</TableHead>
                    <TableHead className="text-right">所要時間</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {section.items.map((item, itemIndex) => (
                    <TableRow key={itemIndex} className="hover:bg-primary/5">
                      <TableCell className="font-medium">{item.description}</TableCell>
                      <TableCell className="text-right">{item.time}分</TableCell>
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
