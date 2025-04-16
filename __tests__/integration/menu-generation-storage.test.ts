import { POST as generateMenuHandler } from '../../app/api/generate-menu/route';
import { saveMenu, getMenu } from '../../lib/kv-storage';
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

    // メニューの保存
    const menuId = `test-${Date.now()}`;
    await expect(saveMenu(menuId, generatedMenu, process.env.OPENAI_API_KEY)).resolves.not.toThrow();

    // 保存されたメニューの検証
    const savedMenu = await getMenu(menuId);
    expect(savedMenu).toBeDefined();
    if (savedMenu) {
      expect(savedMenu.menu).toEqual(generatedMenu.menu);
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
    jest.spyOn(require('../../lib/kv-storage'), 'saveMenu')
      .mockRejectedValueOnce(new Error('Storage error'));

    const testMenuId = `test-${Date.now()}`;
    await expect(saveMenu(testMenuId, generatedMenu, process.env.OPENAI_API_KEY)).rejects.toThrow('Storage error');
  });
});
