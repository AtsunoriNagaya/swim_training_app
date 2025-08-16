import { type GeneratedMenuData } from "@/types/menu";
import { extractAndValidateJSON } from "@/lib/json-sanitizer";

// AI応答のクリーニングとJSON抽出
export function cleanAIResponse(text: string): string {
  console.log("AIモデルからの生の応答:", text.substring(0, 200) + "...");
  
  const cleanedText = extractAndValidateJSON(text);
  console.log("クリーニング後のテキスト:", cleanedText.substring(0, 100) + "...");
  return cleanedText;
}

// メニューデータの検証
export function validateMenuData(menuData: any): menuData is GeneratedMenuData {
  // 必須フィールドの存在チェック
  if (!menuData.title || typeof menuData.title !== 'string') {
    console.error("メニュータイトルが不正です:", menuData.title);
    return false;
  }
  
  if (!Array.isArray(menuData.menu)) {
    console.error("メニューセクションが配列ではありません:", menuData.menu);
    return false;
  }
  
  if (!menuData.totalTime || typeof menuData.totalTime !== 'number') {
    console.error("合計時間が不正です:", menuData.totalTime);
    return false;
  }
  
  // メニューセクションの検証
  for (const section of menuData.menu) {
    if (!section.name || typeof section.name !== 'string') {
      console.error("セクション名が不正です:", section.name);
      return false;
    }
    
    if (!Array.isArray(section.items)) {
      console.error("セクションアイテムが配列ではありません:", section.items);
      return false;
    }
    
    // アイテムの検証
    for (const item of section.items) {
      if (!item.description || typeof item.description !== 'string') {
        console.error("アイテム説明が不正です:", item.description);
        return false;
      }
      
      if (!item.distance || (typeof item.distance !== 'string' && typeof item.distance !== 'number')) {
        console.error("距離が不正です:", item.distance);
        return false;
      }
      
      if (!item.sets || typeof item.sets !== 'number') {
        console.error("セット数が不正です:", item.sets);
        return false;
      }
      
      if (!item.circle || typeof item.circle !== 'string') {
        console.error("サークル時間が不正です:", item.circle);
        return false;
      }
    }
  }
  
  return true;
}

// メニューデータの時間計算
export function calculateMenuTimes(menuData: GeneratedMenuData): GeneratedMenuData {
  const updatedMenu = menuData.menu.map(section => {
    const updatedItems = section.items.map(item => {
      // 時間を自動計算（例：距離、セット数、サークル時間から推定）
      const estimatedTime = estimateItemTime(item.distance, item.circle, item.sets);
      return { ...item, time: estimatedTime };
    });
    
    const sectionTotalTime = updatedItems.reduce((sum, item) => sum + item.time, 0);
    return { ...section, items: updatedItems, totalTime: sectionTotalTime };
  });
  
  const totalTime = updatedMenu.reduce((sum, section) => sum + section.totalTime, 0);
  
  return {
    ...menuData,
    menu: updatedMenu,
    totalTime: totalTime
  };
}

// アイテムの時間を推定する関数
function estimateItemTime(distance: string | number, circle: string, sets: number): number {
  // 距離を数値に変換（例："100m" → 100 または 100 → 100）
  let distanceNum: number;
  if (typeof distance === 'number') {
    distanceNum = distance;
  } else {
    distanceNum = parseInt(distance.replace(/[^\d]/g, ''));
  }
  
  // サークル時間を分に変換（例："2:00" → 2）
  const circleParts = circle.split(':');
  const circleMinutes = parseInt(circleParts[0]) + (parseInt(circleParts[1] || '0') / 60);
  
  // 基本的な時間計算（距離、セット数、サークル時間から推定）
  const baseTime = (distanceNum / 100) * circleMinutes * sets;
  
  // 最低時間を保証
  return Math.max(Math.round(baseTime), 1);
}
