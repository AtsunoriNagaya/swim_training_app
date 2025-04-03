"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Calendar, ArrowRight, Filter } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useToast } from "@/hooks/use-toast"

interface MenuItem {
  description: string;
  distance: string;
  sets: number;
  circle: string;
  rest: string | number;
  equipment?: string;
  notes?: string;
  time?: number;
}

interface MenuSection {
  name: string;
  items: MenuItem[];
  totalTime?: number;
}

interface MenuHistoryItem {
  id: string;
  title: string;
  menu: MenuSection[];
  totalTime: number;
  intensity?: string | null;
  targetSkills?: string[] | null;
  createdAt: string;
  aiModel: string;
  loadLevels: string[];
  duration: number;
  notes?: string;
}

export default function MenuHistoryList() {
  const [searchTerm, setSearchTerm] = useState("")
  const [menuHistory, setMenuHistory] = useState<MenuHistoryItem[]>([])
  const { toast } = useToast()

  useEffect(() => {
    const fetchMenuHistory = async () => {
      try {
        const response = await fetch("/api/get-menu-history");
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || "メニュー履歴の取得に失敗しました");
        }
        
        const data = await response.json();
        
        // データの検証
        if (!data || !Array.isArray(data.menuHistory)) {
          console.error("Invalid menu history format:", data);
          throw new Error("メニュー履歴のデータ形式が不正です");
        }

        // 各メニューアイテムの型を検証
        const validatedHistory = data.menuHistory.map((item: any) => {
          if (!item || typeof item !== 'object') {
            console.warn("Invalid menu item:", item);
            return null;
          }

          return {
            id: item.id || "",
            title: item.title || "無題のメニュー",
            menu: Array.isArray(item.menu) ? item.menu : [],
            totalTime: Number(item.totalTime) || 0,
            intensity: item.intensity || null,
            targetSkills: Array.isArray(item.targetSkills) ? item.targetSkills : [],
            createdAt: item.createdAt || new Date().toISOString(),
            aiModel: item.aiModel || "unknown",
            loadLevels: Array.isArray(item.loadLevels) ? item.loadLevels : [],
            duration: Number(item.duration) || 0,
            notes: item.notes || ""
          };
        }).filter(Boolean) as MenuHistoryItem[];

        setMenuHistory(validatedHistory);
      } catch (error: any) {
        console.error("Menu history error:", error);
        toast({
          title: "メニュー履歴の取得に失敗しました",
          description: error.message,
          variant: "destructive",
        });
      }
    };

    fetchMenuHistory();
  }, [toast]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('ja-JP', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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

  const filteredMenus = menuHistory.filter((menu) =>
    menu.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    menu.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    menu.loadLevels.some(level => getLoadLevelLabel(level).includes(searchTerm))
  );

  return (
    <Card className="water-card shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">Menu History</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <Input
            type="search"
            placeholder="Search menus..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <ScrollArea className="max-h-[500px] pr-4">
          {filteredMenus.length > 0 ? (
            <div className="space-y-4">
              {filteredMenus.map((menu) => (
                <div key={menu.id} className="border rounded-md p-4">
                  <h3 className="font-semibold">{menu.title}</h3>
                  <p className="text-sm text-gray-500">Created at: {formatDate(menu.createdAt)}</p>
                  <p className="text-sm">AI Model: {menu.aiModel}</p>
                  <p className="text-sm">Duration: {menu.duration} minutes</p>
                  {menu.notes && <p className="text-sm">Notes: {menu.notes}</p>}
                  <div className="flex flex-wrap gap-2">
                    {menu.loadLevels.map((level) => (
                      <Badge key={level} className={getLoadLevelColor(level)}>
                        {getLoadLevelLabel(level)}
                      </Badge>
                    ))}
                  </div>
                  <Link href={`/result?id=${menu.id}`} className="inline-block mt-2">
                    <Button size="sm">View Details</Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <p>No menus found.</p>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
