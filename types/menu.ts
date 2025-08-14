export interface MenuItem {
  description: string;
  distance: string;
  sets: number;
  circle: string;
  rest: string | number; // test ブランチから追加
  equipment?: string;
  notes?: string;
  time: number; // HEAD ブランチから必須に変更
}

export interface MenuSection {
  name: string;
  items: MenuItem[];
  totalTime: number;
}

export interface TrainingMenu {
  menuId: string;
  title: string;
  createdAt: string;
  menu: MenuSection[];
  totalTime: number;
  intensity?: string;
  targetSkills?: string[];
  remainingTime?: number;
  specialNotes?: string;
  similarityScore?: number; // 類似度スコアを追加 (test ブランチから採用)
}

export type LoadLevel = '低' | '中' | '高';

export interface GenerateMenuRequest {
  loadLevel: LoadLevel;
  trainingTime: number;
  model: 'openai' | 'google' | 'anthropic';
  apiKey?: string;
  specialNotes?: string;
}

// AI応答の型定義（TrainingMenuと互換性のある形）
export interface GeneratedMenuData {
  title: string;
  menu: Array<{
    name: string;
    items: Array<{
      description: string;
      distance: string | number;
      sets: number;
      circle: string;
      equipment?: string;
      notes?: string;
      time?: number;
    }>;
    totalTime?: number;
  }>;
  totalTime: number;
  intensity?: string | null;
  targetSkills?: string[] | null;
}
