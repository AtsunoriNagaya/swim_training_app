"use client";

import { calculateTotalDistance } from "@/lib/utils";
import { formatDate, getLoadLevelColor, getLoadLevelLabel } from "@/lib/menu-labels";
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
import MenuExportActions, { type MenuData } from "@/components/menu-export-actions";

export default function TrainingMenuResult({ menuData }: { menuData: MenuData }) {
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
            <Badge className="bg-primary/10 text-primary border-primary/20 dark:bg-primary/20 dark:text-primary dark:border-primary/30">
              {menuData.duration}分メニュー
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {menuData.notes && (
          <div className="mb-6 p-4 bg-muted/50 rounded-md border">
            <p className="text-sm font-medium">備考・特記事項:</p>
            <p className="text-sm mt-1">{menuData.notes}</p>
          </div>
        )}

        <div className="space-y-6">
          {menuData.menu.map((section, index) => (
            <div key={index} className="rounded-lg border border-primary/10 overflow-hidden">
              <div className="bg-primary/10 dark:bg-primary/20 p-3 flex justify-between items-center">
                <h3 className="text-lg font-semibold">{section.name}</h3>
                <span className="text-sm font-medium bg-background/70 px-2 py-1 rounded-full">
                  合計: {section.totalTime}分
                </span>
              </div>
              {/* 幅の狭い画面ではテーブル側を横スクロールさせ、ページ全体は崩さない */}
              <div className="overflow-x-auto">
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
                            <Badge
                              variant="outline"
                              className="ml-2 border-secondary/30 bg-secondary/10 text-secondary"
                            >
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
            </div>
          ))}
        </div>

        <div className="mt-8 p-4 border border-primary/20 rounded-md bg-muted/50">
          <div className="flex flex-wrap items-center justify-between gap-3">
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
        <MenuExportActions menuData={menuData} />
      </CardFooter>
    </Card>
  );
}
