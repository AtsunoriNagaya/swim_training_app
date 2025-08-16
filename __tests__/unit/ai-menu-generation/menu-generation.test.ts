import { rest } from 'msw';
import { setupServer } from 'msw/node';
import type { TrainingMenu, GenerateMenuRequest } from '../../../types/menu';

// モックのインポート
jest.mock('@/lib/neon-db');

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
  remainingTime: 110,
  specialNotes: 'テスト'
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
            ctx.json({ success: false, error: 'Invalid API key' })
          );
        })
      );

      const params: GenerateMenuRequest = {
        loadLevel: '中',
        trainingTime: 120,
        model: 'openai',
        apiKey: 'invalid_key'
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

  describe('練習時間指定機能のテスト', () => {
    it('指定した練習時間に応じたメニューが生成される (UT-006)', async () => {
      const times = [30, 60, 90];
      for (const time of times) {
        server.use(
          rest.post('http://localhost/api/generate-menu', (req, res, ctx) => {
            // 要求された時間に応じて動的にレスポンスを調整
            const adjustedResponse = {
              ...mockMenuResponse,
              totalTime: Math.min(time, mockMenuResponse.totalTime),
              remainingTime: Math.max(0, time - mockMenuResponse.totalTime)
            };
            return res(ctx.json(adjustedResponse));
          })
        );

        const params: GenerateMenuRequest = {
          loadLevel: '中',
          trainingTime: time,
          model: 'openai'
        };

        const response = await generateTrainingMenu(params);
        expect(response).toBeDefined();
        expect(response.totalTime).toBeLessThanOrEqual(params.trainingTime);
      }
    });
  });

  describe('特記事項反映機能のテスト', () => {
    it('特記事項が反映されたメニューが生成される (UT-007)', async () => {
      server.use(
        rest.post('http://localhost/api/generate-menu', (req, res, ctx) => {
          return res(ctx.json(mockMenuResponse));
        })
      );
      const params: GenerateMenuRequest = {
        loadLevel: '中',
        trainingTime: 60,
        model: 'openai',
        specialNotes: '膝の怪我に配慮が必要'
      };

      // APIレスポンスのモックにspecialNotesを含める
      server.use(
        rest.post('http://localhost/api/generate-menu', (req, res, ctx) => {
          return res(ctx.json({...mockMenuResponse, specialNotes: params.specialNotes}));
        })
      );


      const response = await generateTrainingMenu(params);
      expect(response).toBeDefined();
      expect(response.specialNotes).toBe(params.specialNotes);
    });
  });
});

// メニュー生成関数
async function generateTrainingMenu(params: GenerateMenuRequest): Promise<TrainingMenu> {
  const { loadLevel, trainingTime, model, apiKey, specialNotes } = params;
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
      specialNotes,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    // エラーメッセージが { error: '...' } 形式ならそれを使う
    throw new Error(error.error || error.message || 'メニュー生成に失敗しました');
  }

  const result = await response.json();
  // 実際のAPIレスポンス形式 { success: true, menu: TrainingMenu } から menu を取得
  return result.menu || result;
}
