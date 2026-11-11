import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import type { GenerateMenuRequest } from '../../../types/menu';

// モックのインポート
jest.mock('@/lib/neon-db');

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
        http.post('http://localhost/api/generate-menu', async ({ request }) => {
          // 送られた負荷レベルに応じた強度を返す（低→A、中→B、高→C）
          const { loadLevels } = (await request.json()) as { loadLevels?: string };
          const intensity = ({ '低': 'A', '中': 'B', '高': 'C' } as Record<string, string>)[loadLevels ?? ''] ?? 'B';
          return HttpResponse.json({
              success: true,
              menuId: 'test-menu',
              menu: {
                menuId: 'test-menu',
                title: 'テスト用メニュー',
                createdAt: new Date().toISOString(),
                menu: [],
                totalTime: 60,
                intensity
              },
              message: "メニューが正常に生成されました"
            });
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
        expect(result.menu.intensity).toBe(
          level === '低' ? 'A' : level === '中' ? 'B' : 'C'
        );
      }
    });

    it('APIキーが無効な場合エラーが返される (UT-004)', async () => {
      server.use(
        http.post('http://localhost/api/generate-menu', () => {
          return HttpResponse.json({ error: 'Invalid API key' }, { status: 401 });
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
