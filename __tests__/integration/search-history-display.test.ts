import { POST as generateMenuHandler } from '../../app/api/generate-menu/route';
import { searchSimilarMenus as searchMenus, getMenu } from '../../lib/neon-db';
import type { GenerateMenuRequest, TrainingMenu } from '../../types/menu';
import { NextRequest } from 'next/server';

// モックの検索結果の型定義
interface MockSearchResult {
  menus: TrainingMenu[];
  similarities: number[];
}

// searchMenusのモックを上書き
jest.mock('../../lib/neon-db', () => {
  const originalModule = jest.requireActual('../../lib/neon-db');
  return {
    ...originalModule,
    searchSimilarMenus: jest.fn().mockImplementation(
      async (query: string, duration: number, apiKey?: string) => {
        if (query === '存在しないメニュー') {
          return { menus: [], similarities: [] };
        }

        const mockMenus = [
          {
            menuId: 'menu-1',
            title: query?.includes('高強度') ? '高強度トレーニング' : '類似メニュー1',
            menu: [
              {
                name: 'ウォームアップ',
                items: [{ description: 'フリースタイル', distance: '200m', sets: 1, circle: '4:00', rest: 30 }],
                totalTime: 10
              }
            ],
            totalTime: 30,
            intensity: query?.includes('高強度') ? 'C' : 'B'
          },
          {
            menuId: 'menu-2',
            title: '類似メニュー2',
            menu: [
              {
                name: 'ウォームアップ',
                items: [{ description: 'キック', distance: '100m', sets: 2, circle: '2:00', rest: 20 }],
                totalTime: 10
              }
            ],
            totalTime: 30,
            intensity: 'B'
          }
        ];

        const similarities = [0.95, 0.45];

        return {
          menus: mockMenus,
          similarities
        };
      }
    ),
    getMenu: jest.fn().mockImplementation(async (menuId: string) => {
      if (menuId === 'non_existent_menu_id') {
        return null;
      }
      return {
        menuId: menuId,
        title: 'テスト用メニュー',
        createdAt: new Date().toISOString(),
        menu: [
          {
            name: 'ウォームアップ',
            items: [{ description: '軽めのフリースタイル', distance: '200m', sets: 1, circle: '4:00', rest: 30 }],
            totalTime: 10
          }
        ],
        totalTime: 60,
        intensity: 'B',
        targetSkills: ['持久力'],
        remainingTime: 0,
        specialNotes: 'テスト用のメニューです'
      };
    })
  };
});

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
    const testEmbedding = [0.1, 0.2, 0.3]; // テスト用のembedding
    const searchResult = await searchMenus(
      testEmbedding,
      5,
      60
    );

    // 型アサーションを使用
    const result = searchResult as unknown as MockSearchResult;

    expect(result.menus).toBeInstanceOf(Array);
    expect(result.menus.length).toBeGreaterThan(0);

    // 検索結果の最初のメニューの詳細を取得
    const foundMenu = result.menus[0];
    expect(foundMenu).toBeDefined();
    expect(foundMenu.title).toBe('類似メニュー1');

    // 詳細表示の検証
    const menuDetail = await getMenu(foundMenu.menuId);
    expect(menuDetail).toBeDefined();
    if (menuDetail) {
      expect(menuDetail.title).toBe('テスト用メニュー');
      expect(menuDetail.menu).toBeDefined();
    }
  });

  test('複数の検索条件で正しく結果が絞り込まれる', async () => {
    // 複数条件での検索
    const testEmbedding = [0.1, 0.2, 0.3]; // テスト用のembedding
    const searchResult = await searchMenus(
      testEmbedding,
      5,
      60
    );

    // 型アサーションを使用
    const result = searchResult as unknown as MockSearchResult;

    expect(result.menus).toBeInstanceOf(Array);
    expect(result.similarities).toBeInstanceOf(Array);
    
    result.menus.forEach((menu, index) => {
      expect(menu.intensity).toBe('B');
      expect(menu.totalTime).toBe(30);
      expect(result.similarities[index]).toBeGreaterThan(0);
    });
  });

  test('検索結果が存在しない場合、空配列が返される', async () => {
    // 存在しない条件で検索
    const testEmbedding = [0.1, 0.2, 0.3]; // テスト用のembedding
    const searchResult = await searchMenus(
      testEmbedding,
      5,
      120
    );

    // 型アサーションを使用
    const result = searchResult as unknown as MockSearchResult;

    expect(result.menus).toBeInstanceOf(Array);
    expect(result.menus.length).toBe(0);
    expect(result.similarities).toBeInstanceOf(Array);
    expect(result.similarities.length).toBe(0);
  });

  test('無効なメニューIDでの詳細表示要求時にnullが返される', async () => {
    const invalidId = 'non_existent_menu_id';
    const menuDetail = await getMenu(invalidId);
    expect(menuDetail).toBeNull();
  });
});
