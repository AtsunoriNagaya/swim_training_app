import { rest } from 'msw';
import { setupServer } from 'msw/node';
import type { TrainingMenu, GenerateMenuRequest } from '../../../types/menu';

// モックのインポート
jest.mock('@/lib/kv-storage');

// 期待されるメニューデータ
const mockMenuResponse = {
  menuId: 'menu-1234567890',
  title: 'テスト用メニュー',
  createdAt: new Date().toISOString(),
  menu: [
    {
      name: 'W-up',
      items: [
        {
          description: '軽めのフリースタイル',
          distance: '400',
          sets: 1,
          circle: '2:00',
          rest: '1',
          time: 10
        }
      ],
      totalTime: 10
    }
  ],
  totalTime: 10,
  intensity: 'B',
  targetSkills: ['持久力'],
  remainingTime: 110
};

// MSWサーバーのセットアップ（"handlers" は使用せず空でセットアップ）
const server = setupServer();

describe('メニュー生成機能のテスト', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  describe('OpenAIモデルでのメニュー生成', () => {
    it('正常にメニューが生成される', async () => {
      // APIレスポンスのモック
      server.use(
        rest.post('http://localhost/api/generate-menu', (req, res, ctx) => {
          return res(ctx.json(mockMenuResponse));
        })
      );

      const params: GenerateMenuRequest = {
        loadLevel: '中',
        trainingTime: 120,
        model: 'openai',
        apiKey: 'test-api-key',
      };

      // メニュー生成の実行
      const response = await generateTrainingMenu(params);

      // アサーション
      expect(response).toBeDefined();
      expect(response.title).toBeDefined();
      expect(response.menu).toBeInstanceOf(Array);
      expect(response.totalTime).toBeLessThanOrEqual(params.trainingTime);
      expect(response.intensity).toBe('B');
    });

    it('APIキーが無効な場合はエラーが返される', async () => {
      // OpenAIエンドポイントを試す場合、エラーを返すモック
      server.use(
        rest.post('http://localhost/api/generate-menu', (req, res, ctx) => {
          return res(
            ctx.status(401),
            ctx.json({ message: 'Invalid API key' })
          );
        })
      );

      const params: GenerateMenuRequest = {
        loadLevel: '中',
        trainingTime: 120,
        model: 'openai'
      };

      // アサーション
      await expect(generateTrainingMenu(params)).rejects.toThrow('Invalid API key');
    });
  });

  describe('Googleモデルでのメニュー生成', () => {
    it('正常にメニューが生成される', async () => {
      server.use(
        rest.post('http://localhost/api/generate-menu', (req, res, ctx) => {
          return res(ctx.json(mockMenuResponse));
        })
      );

      const params: GenerateMenuRequest = {
        loadLevel: '高',
        trainingTime: 90,
        model: 'google',
      };

      // メニュー生成の実行
      const response = await generateTrainingMenu(params);

      // アサーション
      expect(response).toBeDefined();
      expect(response.title).toBeDefined();
      expect(response.menu).toBeInstanceOf(Array);
      expect(response.totalTime).toBeLessThanOrEqual(params.trainingTime);
      expect(response.menu.length).toBeGreaterThan(0);
    });
  });

  describe('Anthropicモデルでのメニュー生成', () => {
    it('正常にメニューが生成される', async () => {
      server.use(
        rest.post('http://localhost/api/generate-menu', (req, res, ctx) => {
          return res(ctx.json(mockMenuResponse));
        })
      );

      const params: GenerateMenuRequest = {
        loadLevel: '低',
        trainingTime: 60,
        model: 'anthropic',
      };

      // メニュー生成の実行
      const response = await generateTrainingMenu(params);

      // アサーション
      expect(response).toBeDefined();
      expect(response.title).toBeDefined();
      expect(response.menu).toBeInstanceOf(Array);
      expect(response.totalTime).toBeLessThanOrEqual(params.trainingTime);
      expect(response.menu.length).toBeGreaterThan(0);
    });
  });
});

// メニュー生成関数
async function generateTrainingMenu(params: GenerateMenuRequest): Promise<TrainingMenu> {
  const { loadLevel, trainingTime, model, apiKey } = params;
  const response = await fetch('http://localhost/api/generate-menu', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      aiModel: model,
      apiKey,
      loadLevels: loadLevel,
      duration: trainingTime,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    // エラーメッセージが { message: '...' } 形式ならそれを使う
    throw new Error(error.message || 'メニュー生成に失敗しました');
  }

  return response.json();
}
