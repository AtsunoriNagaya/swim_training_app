import { generateMenu } from '../../app/api/generate-menu/route';
import { saveMenu } from '../../lib/kv-storage';
import { MenuGenerationParams, TrainingMenu } from '../../types/menu';

describe('Menu Generation and Storage Integration (IT-001)', () => {
  beforeEach(() => {
    // テスト前の初期化処理
    jest.clearAllMocks();
  });

  test('メニューが正常に生成され保存される', async () => {
    // テスト用のメニュー生成パラメータ
    const params: MenuGenerationParams = {
      model: 'openai',
      loadLevel: 'medium',
      duration: 60,
      notes: '練習テスト'
    };

    // メニュー生成の実行
    const generatedMenu = await generateMenu(params);
    expect(generatedMenu).toBeDefined();
    expect(generatedMenu.items).toBeInstanceOf(Array);
    expect(generatedMenu.totalDuration).toBeLessThanOrEqual(params.duration);

    // メニューの保存
    const saveResult = await saveMenu(generatedMenu);
    expect(saveResult).toBeTruthy();

    // 保存されたメニューの検証
    const savedMenu = await getMenu(saveResult.id);
    expect(savedMenu).toBeDefined();
    expect(savedMenu.items).toEqual(generatedMenu.items);
    expect(savedMenu.metadata.loadLevel).toBe(params.loadLevel);
    expect(savedMenu.metadata.duration).toBe(params.duration);
  });

  test('APIキーが無効な場合、適切なエラーが返される', async () => {
    const params: MenuGenerationParams = {
      model: 'openai',
      loadLevel: 'medium',
      duration: 60,
      notes: 'テスト'
    };

    // 無効なAPIキーでのテスト
    process.env.OPENAI_API_KEY = 'invalid_key';

    await expect(generateMenu(params)).rejects.toThrow('Invalid API key');
  });

  test('保存に失敗した場合、適切なエラーが返される', async () => {
    const params: MenuGenerationParams = {
      model: 'openai',
      loadLevel: 'medium',
      duration: 60,
      notes: 'テスト'
    };

    const generatedMenu = await generateMenu(params);
    
    // 保存処理をモックしてエラーを発生させる
    jest.spyOn(require('../../lib/kv-storage'), 'saveMenu')
      .mockRejectedValueOnce(new Error('Storage error'));

    await expect(saveMenu(generatedMenu)).rejects.toThrow('Storage error');
  });
});
