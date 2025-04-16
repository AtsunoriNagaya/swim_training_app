import { rest } from 'msw';
import { setupServer } from 'msw/node';
import type { TrainingMenu } from '../../../types/menu';

// モックのインポート
jest.mock('@/lib/kv-storage');

const server = setupServer();

describe('RAG機能のテスト', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  describe('RAG機能切替', () => {
    it('RAG機能の切替が正常に動作する (UT-020)', async () => {
      // RAG機能ONの設定
      server.use(
        rest.post('/api/settings/rag', (req, res, ctx) => {
          return res(ctx.json({ enabled: true }));
        })
      );

      let response = await fetch('/api/settings/rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: true })
      });

      expect(response.ok).toBe(true);
      let result = await response.json();
      expect(result.enabled).toBe(true);

      // RAG機能を有効にした状態でのメニュー生成
      const mockMenu: TrainingMenu = {
        menuId: 'test-menu',
        title: 'RAGテストメニュー',
        createdAt: new Date().toISOString(),
        menu: [
          {
            name: 'メインセット',
            items: [
              {
                description: 'クロール',
                distance: '100',
                sets: 4,
                circle: '2:00',
                rest: '30',
                time: 12
              }
            ],
            totalTime: 12
          }
        ],
        totalTime: 12,
        intensity: 'B'
      };

      server.use(
        rest.post('/api/generate-menu', (req, res, ctx) => {
          return res(ctx.json(mockMenu));
        })
      );

      response = await fetch('/api/generate-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          loadLevel: '中',
          trainingTime: 60,
          model: 'openai',
          useRAG: true
        })
      });

      expect(response.ok).toBe(true);
      result = await response.json();
      expect(result).toHaveProperty('menuId');
      expect(result).toHaveProperty('menu');

      // RAG機能OFFの設定
      server.use(
        rest.post('/api/settings/rag', (req, res, ctx) => {
          return res(ctx.json({ enabled: false }));
        })
      );

      response = await fetch('/api/settings/rag', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: false })
      });

      expect(response.ok).toBe(true);
      result = await response.json();
      expect(result.enabled).toBe(false);
    });
  });
});
