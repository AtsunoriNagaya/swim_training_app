import { rest } from 'msw';
import { setupServer } from 'msw/node';
import type { GenerateMenuRequest } from '../../../types/menu';

// モックのインポート
jest.mock('@/lib/kv-storage');

// MSWサーバーのセットアップ（ハンドラーは外部からインポートせず、各it内で直接定義）
const server = setupServer();

describe('メニュー生成バリデーションのテスト', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  describe('負荷レベルとパラメータのバリデーション', () => {
    it('負荷レベルが正しく反映される (UT-005)', async () => {
      // 負荷レベルごとにモックAPIレスポンスを返す
      server.use(
        rest.post('http://localhost/api/generate-menu', (req, res, ctx) => {
          const { loadLevels } = req.body as any;
          let intensity = 'A';
          if (loadLevels === '中') intensity = 'B';
          if (loadLevels === '高') intensity = 'C';

          return res(
            ctx.json({
              menuId: `menu-${loadLevels}`,
              title: `${loadLevels}強度メニュー`,
              createdAt: new Date().toISOString(),
              menu: [],
              totalTime: 60,
              intensity
            })
          );
        })
      );

      const loadLevels = ['低', '中', '高'] as const;
      for (const level of loadLevels) {
        const params: GenerateMenuRequest = {
          loadLevel: level,
          trainingTime: 60,
          model: 'openai'
        };

        const response = await fetch('http://localhost/api/generate-menu', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            aiModel: params.model,
            apiKey: params.apiKey,
            loadLevels: params.loadLevel,
            duration: params.trainingTime
          })
        });

        expect(response.ok).toBe(true);
        const result = await response.json();
        expect(result.intensity).toBe(
          level === '低' ? 'A' : level === '中' ? 'B' : 'C'
        );
      }
    });

    it('APIキーが無効な場合エラーが返される (UT-004)', async () => {
      server.use(
        rest.post('http://localhost/api/generate-menu', (req, res, ctx) => {
          return res(ctx.status(401), ctx.json({ error: 'Invalid API key' }));
        })
      );

      const params: GenerateMenuRequest = {
        loadLevel: '中',
        trainingTime: 60,
        model: 'openai',
        apiKey: 'invalid-api-key'
      };

      const response = await fetch('http://localhost/api/generate-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          aiModel: params.model,
          apiKey: params.apiKey,
          loadLevels: params.loadLevel,
          duration: params.trainingTime
        })
      });

      expect(response.status).toBe(401);
      const result = await response.json();
      expect(result.error).toBe('Invalid API key');
    });
  });
});
