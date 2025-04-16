import { rest } from 'msw';
import { setupServer } from 'msw/node';
import type { TrainingMenu } from '../../../types/menu';

// モックのインポート
jest.mock('@/lib/kv-storage');

// モックメニューデータ
const mockMenus = [
  {
    menuId: 'menu-1',
    title: 'テスト用メニュー1',
    createdAt: new Date().toISOString(),
    menu: [
      {
        name: 'W-up',
        items: [
          {
            description: '軽めのフリースタイル',
            distance: '400',
            sets: 1,
            time: 10
          }
        ],
        totalTime: 10
      }
    ],
    totalTime: 10,
    intensity: 'B'
  },
  {
    menuId: 'menu-2',
    title: 'テスト用メニュー2',
    createdAt: new Date().toISOString(),
    menu: [
      {
        name: 'メインセット',
        items: [
          {
            description: 'クロール',
            distance: '100',
            sets: 4,
            time: 20
          }
        ],
        totalTime: 20
      }
    ],
    totalTime: 20,
    intensity: 'A'
  }
];

// MSWサーバーのセットアップ
const server = setupServer();

describe('検索と表示機能のテスト', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  describe('類似メニュー検索機能', () => {
    it('類似メニューが正常に検索される (UT-011)', async () => {
      server.use(
        rest.post('http://localhost/api/search-similar-menus', (req, res, ctx) => {
          return res(ctx.json(mockMenus));
        })
      );

      const response = await fetch('http://localhost/api/search-similar-menus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchQuery: 'フリースタイル' })
      });

      expect(response.ok).toBe(true);
      const result = await response.json();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('menuId');
      expect(result[0]).toHaveProperty('title');
    });
  });

  describe('メニュー履歴表示機能', () => {
    it('メニュー履歴が正常に表示される (UT-012)', async () => {
      server.use(
        rest.get('http://localhost/api/get-menu-history', (req, res, ctx) => {
          return res(ctx.json(mockMenus));
        })
      );

      const response = await fetch('http://localhost/api/get-menu-history');
      
      expect(response.ok).toBe(true);
      const result = await response.json();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('menuId');
      expect(result[0]).toHaveProperty('createdAt');
    });
  });
});
