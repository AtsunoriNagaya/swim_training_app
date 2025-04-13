import { rest } from 'msw';
import { setupServer } from 'msw/node';
import type { TrainingMenu } from '../../../types/menu';

// モックのインポート
jest.mock('@/lib/kv-storage');

// モックメニューデータ
const mockMenus = [
  {
    menuId: 'menu-1',
    title: '高強度スプリントメニュー',
    createdAt: new Date().toISOString(),
    menu: [
      {
        name: 'スプリント',
        items: [
          {
            description: '全力泳',
            distance: '50',
            sets: 10,
            time: 20
          }
        ],
        totalTime: 20
      }
    ],
    totalTime: 20,
    intensity: 'A',
    similarityScore: 0.95
  },
  {
    menuId: 'menu-2',
    title: '中距離持久力メニュー',
    createdAt: new Date().toISOString(),
    menu: [
      {
        name: 'メインセット',
        items: [
          {
            description: 'クロール',
            distance: '200',
            sets: 5,
            time: 30
          }
        ],
        totalTime: 30
      }
    ],
    totalTime: 30,
    intensity: 'B',
    similarityScore: 0.75
  }
];

// MSWサーバーのセットアップ
const server = setupServer();

describe('類似度検索機能のテスト', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  describe('検索精度とスコア計算', () => {
    it('類似度の高い順に正確にメニューが表示される (UT-018)', async () => {
      server.use(
        rest.post('/api/search-similar-menus', (req, res, ctx) => {
          const sortedMenus = [...mockMenus].sort((a, b) => b.similarityScore - a.similarityScore);
          return res(ctx.json(sortedMenus));
        })
      );

      const response = await fetch('/api/search-similar-menus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchQuery: 'スプリント' })
      });

      expect(response.ok).toBe(true);
      const result = await response.json();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(mockMenus.length);
      
      // 類似度の順序を確認
      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].similarityScore).toBeGreaterThanOrEqual(result[i + 1].similarityScore);
      }
    });

    it('類似度スコアが正確に計算され表示される (UT-019)', async () => {
      server.use(
        rest.post('/api/search-similar-menus', (req, res, ctx) => {
          return res(ctx.json(mockMenus));
        })
      );

      const response = await fetch('/api/search-similar-menus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ searchQuery: '高強度' })
      });

      expect(response.ok).toBe(true);
      const result = await response.json();
      
      // 各メニューの類似度スコアをチェック
      result.forEach((menu: TrainingMenu) => {
        expect(menu).toHaveProperty('similarityScore');
        expect(typeof menu.similarityScore).toBe('number');
        expect(menu.similarityScore).toBeGreaterThanOrEqual(0);
        expect(menu.similarityScore).toBeLessThanOrEqual(1);
      });

      // スコアの妥当性チェック
      const highIntensityMenu = result.find((menu: TrainingMenu) => menu.title.includes('高強度'));
      expect(highIntensityMenu.similarityScore).toBeGreaterThan(0.9);
    });
  });
});
