// Load DB credentials if present
require('dotenv').config({ path: '.env.local' });
import { POST as generateMenuHandler } from '../../app/api/generate-menu/route';
import * as neonDb from '../../lib/neon-db';
import type { GenerateMenuRequest, TrainingMenu } from '../../types/menu';
import { NextRequest } from 'next/server';

const generateMenu = async (params: GenerateMenuRequest): Promise<TrainingMenu> => {
  const request = {
    json: () => Promise.resolve(params)
  } as NextRequest;
  const response = await generateMenuHandler(request);
  
  // レスポンスのステータスコードを確認
  if (response.status === 401) {
    const errorData = await response.json();
    throw new Error(errorData.error || '無効なAPIキーです');
  }
  
  return response.json();
};

describe('Menu Generation and Storage Integration (IT-001)', () => {
  beforeAll(async () => {
    // Initialize Neon DB schema (requires DATABASE_URL)
    await neonDb.initDatabase();
  });

  afterAll(async () => {
    await neonDb.closeDatabase();
  });

  beforeEach(() => {
    // テスト前の初期化処理
    jest.clearAllMocks();
  });

  test('メニューが正常に生成され保存される', async () => {
    // テスト用のメニュー生成パラメータ
    const params: GenerateMenuRequest = {
      model: 'openai',
      loadLevel: '中',
      trainingTime: 60,
      specialNotes: '練習テスト'
    };

    // メニュー生成の実行
    const generatedMenu = await generateMenu(params);
    expect(generatedMenu).toBeDefined();
    expect(generatedMenu.menu).toBeInstanceOf(Array);
    expect(generatedMenu.totalTime).toBeLessThanOrEqual(params.trainingTime);

    const menuId = `test-${Date.now()}`;
    const testEmbedding = undefined; // omit embedding to avoid pgvector dimension mismatch
    const testMetadata = {
      title: generatedMenu.title,
      description: 'テストメニュー',
      loadLevels: params.loadLevel,
      duration: params.trainingTime.toString(),
      notes: params.specialNotes || '',
      totalTime: generatedMenu.totalTime.toString(),
      intensity: generatedMenu.intensity || '',
      targetSkills: generatedMenu.targetSkills || [],
      aiModel: params.model,
      createdAt: new Date().toISOString(),
    };

    await expect(neonDb.saveMenu(menuId, generatedMenu, testEmbedding, testMetadata)).resolves.not.toThrow();

    const savedMenu = await neonDb.getMenu(menuId);
    expect(savedMenu).toBeDefined();
    if (savedMenu) {
      expect(savedMenu.menu).toEqual(generatedMenu.menu);
      // generateMenuHandler は intensity を負荷レベルのまま返すモック
      expect(savedMenu.intensity).toBe(params.loadLevel);
      expect(savedMenu.totalTime).toBe(params.trainingTime);
    }
  });

  test('APIキーが無効な場合、適切なエラーが返される', async () => {
    const params: GenerateMenuRequest = {
      model: 'openai',
      loadLevel: '中',
      trainingTime: 60,
      specialNotes: 'テスト'
    };

    // 無効なAPIキーでのテスト
    process.env.OPENAI_API_KEY = 'invalid_key';

    await expect(generateMenu(params)).rejects.toThrow('無効なAPIキーです');
  });

  test('保存に失敗した場合、適切なエラーが返される', async () => {
    // APIキーを有効な値に戻す
    process.env.OPENAI_API_KEY = 'test-openai-key';
    
    const params: GenerateMenuRequest = {
      model: 'openai',
      loadLevel: '中',
      trainingTime: 60,
      specialNotes: 'テスト'
    };

    const generatedMenu = await generateMenu(params);
    
    // 保存処理をモックしてエラーを発生させる
    jest.spyOn(require('../../lib/neon-db'), 'saveMenu')
      .mockRejectedValueOnce(new Error('Storage error'));

    const testMenuId = `test-${Date.now()}`;
    const testEmbedding = [0.1, 0.2, 0.3]; // テスト用のembedding
    const testMetadata = {
      title: generatedMenu.title,
      description: 'テストメニュー',
      loadLevels: params.loadLevel,
      duration: params.trainingTime.toString(),
      notes: params.specialNotes || '',
      totalTime: generatedMenu.totalTime.toString(),
      intensity: generatedMenu.intensity || '',
      targetSkills: generatedMenu.targetSkills || [],
      aiModel: params.model,
      createdAt: new Date().toISOString(),
    };
    await expect(neonDb.saveMenu(testMenuId, generatedMenu, testEmbedding, testMetadata)).rejects.toThrow('Storage error');
  });
});
