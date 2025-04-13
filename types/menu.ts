export interface MenuItem {
  description: string;
  distance: string;
  sets: number;
  circle: string;
  equipment?: string;
  notes?: string;
  time: number;  // 必須に変更
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
  similarityScore?: number;
}

export type LoadLevel = '低' | '中' | '高';

export interface GenerateMenuRequest {
  loadLevel: LoadLevel;
  trainingTime: number;
  model: 'openai' | 'google' | 'anthropic';
  apiKey?: string;
  specialNotes?: string;
}
