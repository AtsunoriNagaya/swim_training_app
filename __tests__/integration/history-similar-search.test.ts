import { POST as generateMenuHandler } from '../../app/api/generate-menu/route';

const generateMenu = async (params: GenerateMenuRequest): Promise<TrainingMenu> => {
  const request = {
    json: () => Promise.resolve(params)
  } as NextRequest;
  const response = await generateMenuHandler(request);
  return response.json();
};
import { searchSimilarMenus as searchMenus, getMenu } from '../../lib/kv-storage';
import { cosineSimilarity as calculateSimilarity, getEmbedding } from '../../lib/embedding';
import { GenerateMenuRequest, TrainingMenu, LoadLevel } from '../../types/menu';
import { NextRequest } from 'next/server';

describe('History and Similar Search Integration (IT-007)', () => {
  let baseMenu: TrainingMenu;

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env.OPENAI_API_KEY = 'mock_openai_key';

    // テスト用の基準メニューを生成
    const params: GenerateMenuRequest = {
      model: 'openai',
      loadLevel: '中',
      trainingTime: 60
    };

    baseMenu = await generateMenu(params);
  });

  test('履歴から類似メニューが検索できる', async () => {
    // 類似メニューのパラメータを設定
    const similarParams: GenerateMenuRequest = {
      model: 'openai',
      loadLevel: '中',
      trainingTime: 60
    };

    // 類似メニューを生成
    const similarMenu = await generateMenu(similarParams);

    // 類似度計算
    const baseEmbedding = await getEmbedding(JSON.stringify(baseMenu.menu), process.env.OPENAI_API_KEY as string);
    const similarEmbedding = await getEmbedding(JSON.stringify(similarMenu.menu), process.env.OPENAI_API_KEY as string);
    const similarity = calculateSimilarity(baseEmbedding, similarEmbedding);

    expect(similarity).toBeDefined();

    // 類似度スコアの検証
    expect(similarity).toBeGreaterThan(0);
    expect(similarity).toBeLessThanOrEqual(1);

    // 類似メニューの内容を検証
    expect(similarMenu.intensity).toBe(baseMenu.intensity);
    expect(similarMenu.totalTime).toBe(baseMenu.totalTime);
  });

  test('負荷レベルに基づく類似検索が機能する', async () => {
    // 異なる負荷レベルのメニューを生成
    const levels: LoadLevel[] = ['低', '中', '高'];
    const menus = await Promise.all(
      levels.map(level => 
        generateMenu({
          model: 'openai',
          loadLevel: level,
          trainingTime: 60
        })
      )
    );

    // 中程度の負荷レベルで検索
    const searchResults = await searchMenus(
      '類似検索テスト用メニュー',
      60,
      process.env.OPENAI_API_KEY as string
    );

    expect(searchResults).toBeInstanceOf(Array);
    searchResults.forEach(menu => {
      expect(menu.menuData.intensity).toBe('中');
    });

    // 類似度による並び替えの検証
    expect(searchResults.length).toBeGreaterThan(0);
    for (let i = 0; i < searchResults.length - 1; i++) {
      expect(searchResults[i].similarityScore).toBeGreaterThanOrEqual(searchResults[i+1].similarityScore);
    }
  });

  test('時間範囲に基づく類似検索が機能する', async () => {
    const durations = [30, 45, 60, 90];
    await Promise.all(
      durations.map(duration =>
        generateMenu({
          model: 'openai',
          loadLevel: '中',
          trainingTime: duration
        })
      )
    );

    // 60分前後のメニューを検索
    const searchResults = await searchMenus(
      '類似検索テスト用メニュー',
      60,
      process.env.OPENAI_API_KEY as string
    );

    expect(searchResults).toBeInstanceOf(Array);
    searchResults.forEach(menu => {
      expect(menu.menuData.totalTime).toBe(60);
    });
  });

  test('メニュー項目の内容に基づく類似度計算が機能する', async () => {
    const variationParams: GenerateMenuRequest = {
      model: 'openai',
      loadLevel: '中',
      trainingTime: 60
    };

    const variationMenu = await generateMenu(variationParams);
    const baseEmbedding = await getEmbedding(JSON.stringify(baseMenu.menu), process.env.OPENAI_API_KEY as string);
    const variationEmbedding = await getEmbedding(JSON.stringify(variationMenu.menu), process.env.OPENAI_API_KEY as string);
    const similarity = calculateSimilarity(baseEmbedding, variationEmbedding);

    // 類似度スコアの範囲を検証
    expect(similarity).toBeGreaterThanOrEqual(0);
    expect(similarity).toBeLessThanOrEqual(1);
  });
});
