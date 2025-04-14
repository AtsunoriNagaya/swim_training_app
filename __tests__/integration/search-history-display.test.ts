import { POST as generateMenuHandler } from '../../app/api/generate-menu/route';
import { searchSimilarMenus as searchMenus, getMenu } from '../../lib/kv-storage';
import type { GenerateMenuRequest, TrainingMenu } from '../../types/menu';
import { NextRequest } from 'next/server';

// 検索結果の型定義
interface GeneratedMenuData {
  title: string;
  menu: Array<{
    name: string;
    items: Array<{
      description: string;
      distance: string;
      sets: number;
      circle: string;
      rest: string | number;
    }>;
    totalTime: number;
  }>;
  totalTime: number;
  intensity?: string;
}

interface ScoredMenu {
  menuData: GeneratedMenuData;
  similarityScore: number;
}

describe('Search and History Display Integration (IT-004)', () => {
  let savedMenuId: string;

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env.OPENAI_API_KEY = 'mock_openai_key';

    // テスト用のメニューを生成して保存
    const params: GenerateMenuRequest = {
      model: 'openai',
      loadLevel: '中',
      trainingTime: 60,
      specialNotes: '検索テスト用メニュー'
    };

    const request = {
      json: () => Promise.resolve(params)
    } as NextRequest;
    const response = await generateMenuHandler(request);
    const menu = await response.json();
    savedMenuId = menu.menuId;
  });

  test('検索結果から履歴の詳細表示が正しく機能する', async () => {
    // 検索条件に基づいてメニューを検索
    const searchResults = await searchMenus(
      '検索テスト用メニュー',
      60,
      process.env.OPENAI_API_KEY as string
    );

    expect(searchResults).toBeInstanceOf(Array);
    expect(searchResults.length).toBeGreaterThan(0);

    // 検索結果の最初のメニューの詳細を取得
    const foundMenu = searchResults[0];
    expect(foundMenu).toBeDefined();
    expect(foundMenu.menuData.title).toBe(savedMenuId);

    // 詳細表示の検証
    const menuDetail = await getMenu(foundMenu.menuData.title);
    expect(menuDetail).toBeDefined();
    expect(menuDetail?.title).toBe(foundMenu.menuData.title);
    expect(menuDetail?.menu).toEqual(foundMenu.menuData.menu);
  });

  test('複数の検索条件で正しく結果が絞り込まれる', async () => {
    // 複数条件での検索
    const searchResults = await searchMenus(
      '検索テスト用メニュー',
      60,
      process.env.OPENAI_API_KEY as string
    );

    expect(searchResults).toBeInstanceOf(Array);
    searchResults.forEach(menu => {
      expect(menu.menuData.intensity).toBe('中');
      expect(menu.menuData.totalTime).toBe(60);
      expect(menu.similarityScore).toBeGreaterThan(0);
    });
  });

  test('検索結果が存在しない場合、空配列が返される', async () => {
    // 存在しない条件で検索
    const searchResults = await searchMenus(
      '存在しないメニュー',
      120,
      process.env.OPENAI_API_KEY as string
    );

    expect(searchResults).toBeInstanceOf(Array);
    expect(searchResults.length).toBe(0);
  });

  test('無効なメニューIDでの詳細表示要求時にnullが返される', async () => {
    const invalidId = 'non_existent_menu_id';
    const menuDetail = await getMenu(invalidId);
    expect(menuDetail).toBeNull();
  });
});
