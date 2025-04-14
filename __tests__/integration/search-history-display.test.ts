import { generateMenu } from '../../app/api/generate-menu/route';
import { searchMenus, getMenu } from '../../lib/kv-storage';
import { MenuGenerationParams, TrainingMenu } from '../../types/menu';

describe('Search and History Display Integration (IT-004)', () => {
  let savedMenuId: string;

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env.OPENAI_API_KEY = 'mock_openai_key';

    // テスト用のメニューを生成して保存
    const params: MenuGenerationParams = {
      model: 'openai',
      loadLevel: 'medium',
      duration: 60,
      notes: '検索テスト用メニュー'
    };

    const menu = await generateMenu(params);
    savedMenuId = menu.id;
  });

  test('検索結果から履歴の詳細表示が正しく機能する', async () => {
    // 検索条件に基づいてメニューを検索
    const searchResults = await searchMenus({
      loadLevel: 'medium',
      duration: 60
    });

    expect(searchResults).toBeInstanceOf(Array);
    expect(searchResults.length).toBeGreaterThan(0);

    // 検索結果の最初のメニューの詳細を取得
    const foundMenu = searchResults[0];
    expect(foundMenu).toBeDefined();
    expect(foundMenu.id).toBe(savedMenuId);

    // 詳細表示の検証
    const menuDetail = await getMenu(foundMenu.id);
    expect(menuDetail).toBeDefined();
    expect(menuDetail?.id).toBe(foundMenu.id);
    expect(menuDetail?.items).toEqual(foundMenu.items);
    expect(menuDetail?.metadata).toEqual(foundMenu.metadata);
  });

  test('複数の検索条件で正しく結果が絞り込まれる', async () => {
    // 複数条件での検索
    const searchResults = await searchMenus({
      loadLevel: 'medium',
      duration: 60,
      model: 'openai'
    });

    expect(searchResults).toBeInstanceOf(Array);
    searchResults.forEach(menu => {
      expect(menu.metadata.loadLevel).toBe('medium');
      expect(menu.metadata.duration).toBe(60);
      expect(menu.metadata.model).toBe('openai');
    });
  });

  test('検索結果が存在しない場合、空配列が返される', async () => {
    // 存在しない条件で検索
    const searchResults = await searchMenus({
      loadLevel: 'high',
      duration: 120
    });

    expect(searchResults).toBeInstanceOf(Array);
    expect(searchResults.length).toBe(0);
  });

  test('無効なメニューIDでの詳細表示要求時にnullが返される', async () => {
    const invalidId = 'non_existent_menu_id';
    const menuDetail = await getMenu(invalidId);
    expect(menuDetail).toBeNull();
  });
});
