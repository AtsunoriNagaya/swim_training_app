import { generateMenu } from '../../app/api/generate-menu/route';
import { searchMenus, getMenu } from '../../lib/kv-storage';
import { calculateSimilarity } from '../../lib/embedding';
import { MenuGenerationParams, TrainingMenu } from '../../types/menu';

describe('History and Similar Search Integration (IT-007)', () => {
  let baseMenu: TrainingMenu;

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env.OPENAI_API_KEY = 'mock_openai_key';

    // テスト用の基準メニューを生成
    const params: MenuGenerationParams = {
      model: 'openai',
      loadLevel: 'medium',
      duration: 60,
      notes: '類似検索テスト用メニュー'
    };

    baseMenu = await generateMenu(params);
  });

  test('履歴から類似メニューが検索できる', async () => {
    // 類似メニューのパラメータを設定
    const similarParams: MenuGenerationParams = {
      model: 'openai',
      loadLevel: 'medium',
      duration: 60,
      notes: '類似メニュー'
    };

    // 類似メニューを生成
    const similarMenu = await generateMenu(similarParams);

    // 類似度計算
    const similarities = await calculateSimilarity(
      JSON.stringify(baseMenu.items),
      [similarMenu]
    );

    expect(similarities).toBeInstanceOf(Array);
    expect(similarities.length).toBeGreaterThan(0);

    // 類似度スコアの検証
    const [topMatch] = similarities;
    expect(topMatch.score).toBeGreaterThan(0);
    expect(topMatch.score).toBeLessThanOrEqual(1);

    // 類似メニューの内容を検証
    const matchedMenu = topMatch.document;
    expect(matchedMenu.metadata.loadLevel).toBe(baseMenu.metadata.loadLevel);
    expect(matchedMenu.metadata.duration).toBe(baseMenu.metadata.duration);
  });

  test('負荷レベルに基づく類似検索が機能する', async () => {
    // 異なる負荷レベルのメニューを生成
    const levels: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];
    const menus = await Promise.all(
      levels.map(level => 
        generateMenu({
          model: 'openai',
          loadLevel: level,
          duration: 60,
          notes: `${level}強度メニュー`
        })
      )
    );

    // 中程度の負荷レベルで検索
    const searchResults = await searchMenus({
      loadLevel: 'medium'
    });

    expect(searchResults).toBeInstanceOf(Array);
    searchResults.forEach(menu => {
      expect(menu.metadata.loadLevel).toBe('medium');
    });

    // 類似度による並び替えの検証
    const similarities = await calculateSimilarity(
      JSON.stringify(baseMenu.items),
      searchResults
    );

    expect(similarities).toBeSorted((a, b) => b.score - a.score);
  });

  test('時間範囲に基づく類似検索が機能する', async () => {
    const durations = [30, 45, 60, 90];
    await Promise.all(
      durations.map(duration =>
        generateMenu({
          model: 'openai',
          loadLevel: 'medium',
          duration,
          notes: `${duration}分メニュー`
        })
      )
    );

    // 60分前後のメニューを検索
    const searchResults = await searchMenus({
      duration: 60
    });

    expect(searchResults).toBeInstanceOf(Array);
    searchResults.forEach(menu => {
      expect(menu.metadata.duration).toBe(60);
    });
  });

  test('メニュー項目の内容に基づく類似度計算が機能する', async () => {
    const variationParams: MenuGenerationParams = {
      ...baseMenu.metadata,
      notes: '基準メニューのバリエーション'
    };

    const variationMenu = await generateMenu(variationParams);
    const similarities = await calculateSimilarity(
      JSON.stringify(baseMenu.items),
      [variationMenu]
    );

    // 類似度スコアの範囲を検証
    similarities.forEach(({ score }) => {
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  });
});
