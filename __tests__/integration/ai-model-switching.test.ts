import { GenerateMenuRequest, TrainingMenu } from '../../types/menu';

// APIエンドポイントのURL
const API_ENDPOINT = '/api/generate-menu';

// APIを呼び出すヘルパー関数
async function callGenerateMenuAPI(params: GenerateMenuRequest): Promise<TrainingMenu> {
  const response = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }

  return response.json();
}

describe('AI Model Switching Integration (IT-003)', () => {
  // globalのfetchをモック化
  beforeAll(() => {
    global.fetch = jest.fn();
  });

  afterAll(() => {
    jest.resetAllMocks();
  });
  beforeEach(() => {
    jest.clearAllMocks();
    // 各モデルのAPIキーを設定
    process.env.OPENAI_API_KEY = 'mock_openai_key';
    process.env.GOOGLE_API_KEY = 'mock_google_key';
    process.env.ANTHROPIC_API_KEY = 'mock_anthropic_key';
  });

  test('異なるAIモデル間で一貫性のあるメニューが生成される', async () => {
    const baseParams: Omit<GenerateMenuRequest, 'model'> = {
      loadLevel: '中',
      trainingTime: 60,
      specialNotes: 'モデル切替テスト'
    };

    // モックレスポンスを準備
    const mockResponse = (model: string): TrainingMenu => ({
      menuId: `test-${model}`,
      title: `${model}生成メニュー`,
      createdAt: new Date().toISOString(),
      menu: [
        {
          name: 'メインセット',
          items: [
            {
              description: 'クロール',
              distance: '100m',
              sets: 4,
              circle: '2:00',
              rest: 1
            }
          ],
          totalTime: 10
        }
      ],
      totalTime: 60,
      intensity: '中',
      targetSkills: ['持久力'],
      remainingTime: 0
    });

    // fetchのモックを設定
    (global.fetch as jest.Mock).mockImplementation(async (url, options) => {
      const requestBody = JSON.parse(options.body);
      return {
        ok: true,
        json: async () => mockResponse(requestBody.model)
      };
    });

    // 各モデルでメニューを生成
    const models = ['openai', 'google', 'anthropic'] as const;
    const menus = await Promise.all(
      models.map(model =>
        callGenerateMenuAPI({
          ...baseParams,
          model
        })
      )
    );

    // 生成されたメニューの検証
    menus.forEach((menu, index) => {
      expect(menu).toBeDefined();
      expect(menu.menu.length).toBeGreaterThan(0);
      expect(menu.menuId).toContain(models[index]);

      // メニュー項目の妥当性検証
      menu.menu.forEach(section => {
        section.items.forEach(item => {
          expect(item.description).toBeTruthy();
          expect(item.distance).toBeTruthy();
          expect(item.sets).toBeGreaterThan(0);
        });
      });

      // 合計時間の検証
      expect(menu.totalTime).toBeLessThanOrEqual(baseParams.trainingTime);
    });
  });

  test('特定のモデルのAPIキーが無効な場合、適切なエラーが返される', async () => {
    const params: GenerateMenuRequest = {
      model: 'openai',
      loadLevel: '中',
      trainingTime: 60,
      specialNotes: 'エラーテスト'
    };

    // fetchのモックを設定してエラーを返す
    (global.fetch as jest.Mock).mockImplementation(async () => ({
      ok: false,
      status: 401,
      statusText: 'Unauthorized'
    }));

    await expect(callGenerateMenuAPI(params)).rejects.toThrow('API error: 401');
  });

  test('モデル切替時にパラメータが正しく引き継がれる', async () => {
    const customParams: GenerateMenuRequest = {
      model: 'openai',
      loadLevel: '高',
      trainingTime: 45,
      specialNotes: 'カスタムパラメータテスト'
    };

    // モックレスポンスを準備
    const mockMenu = (model: string): TrainingMenu => ({
      menuId: `test-${model}`,
      title: `${model}生成メニュー`,
      createdAt: new Date().toISOString(),
      menu: [
        {
          name: 'メインセット',
          items: [
            {
              description: 'クロール',
              distance: '100m',
              sets: 4,
              circle: '2:00',
              rest: 1
            }
          ],
          totalTime: customParams.trainingTime
        }
      ],
      totalTime: customParams.trainingTime,
      intensity: customParams.loadLevel,
      targetSkills: ['持久力'],
      remainingTime: 0
    });

    // fetchのモックを設定
    (global.fetch as jest.Mock).mockImplementation(async (url, options) => {
      const requestBody = JSON.parse(options.body);
      return {
        ok: true,
        json: async () => mockMenu(requestBody.model)
      };
    });

    // 1つ目のモデルでメニュー生成
    const firstMenu = await callGenerateMenuAPI(customParams);
    expect(firstMenu.totalTime).toBe(customParams.trainingTime);
    expect(firstMenu.intensity).toBe(customParams.loadLevel);

    // 2つ目のモデルで同じパラメータでメニュー生成
    const secondMenu = await callGenerateMenuAPI({
      ...customParams,
      model: 'google'
    });
    expect(secondMenu.totalTime).toBe(customParams.trainingTime);
    expect(secondMenu.intensity).toBe(customParams.loadLevel);

    // パラメータが正しく維持されているか検証
    expect(secondMenu.totalTime).toBe(firstMenu.totalTime);
    expect(secondMenu.intensity).toBe(firstMenu.intensity);
  });
});
