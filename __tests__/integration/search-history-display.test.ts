// Load DB credentials if present
require('dotenv').config({ path: '.env.local' });
import { POST as generateMenuHandler } from '../../app/api/generate-menu/route';
import { POST as searchSimilarHandler } from '../../app/api/search-similar-menus/route';
import * as neonDb from '../../lib/neon-db';
import { getEmbedding } from '../../lib/embedding';
import type { GenerateMenuRequest, TrainingMenu } from '../../types/menu';
import { NextRequest } from 'next/server';

// Neon DB を実際に利用

describe('Search and History Display Integration (IT-004)', () => {
  let savedMenuId: string;

  beforeAll(async () => {
    await neonDb.initDatabase();
  });

  afterAll(async () => {
    await neonDb.closeDatabase();
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    process.env.OPENAI_API_KEY = 'mock_openai_key';

    // テスト用のメニューを生成して保存
    const params: GenerateMenuRequest = {
      model: 'openai',
      loadLevel: '中',
      trainingTime: 60,
      specialNotes: '検索テスト用メニュー'
    };

    const request = {
      json: () => Promise.resolve(params)
    } as NextRequest;
    const response = await generateMenuHandler(request);
    const menu = await response.json();
    savedMenuId = menu.menuId;

    // 生成されたメニューを Neon に保存（検索のために埋め込み付きで保存）
    const menuText = `${menu.menu.title ?? menu.menu.title ?? ''}`;
    const embed = await getEmbedding(menuText, process.env.OPENAI_API_KEY as string);
    const metadata = {
      title: menu.menu.title,
      description: '検索テスト用メニュー',
      duration: String(menu.menu.totalTime ?? 60),
      totalTime: String(menu.menu.totalTime ?? 60),
      intensity: menu.menu.intensity ?? '中',
      createdAt: new Date().toISOString(),
    };
    await neonDb.saveMenu(savedMenuId, menu, embed, metadata);
  });

  test('検索結果から履歴の詳細表示が正しく機能する', async () => {
    // 検索条件に基づいてメニューを検索
    // API ルートを直接呼び出して検索
    const req = new Request('http://localhost/api/search-similar-menus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: '検索テスト用メニュー',
        duration: 60,
        openaiApiKey: process.env.OPENAI_API_KEY,
      }),
    });
    const apiRes = await searchSimilarHandler(req as any);
    const payload = await apiRes.json();

    expect(Array.isArray(payload.menus)).toBe(true);
    expect(payload.menus.length).toBeGreaterThan(0);

    const found = payload.menus[0];
    expect(found.menuId).toBeDefined();
    expect(found.similarityScore).toBeGreaterThanOrEqual(0);

    // 詳細表示の検証（Neon DB 実体から取得）
    const menuDetail = await neonDb.getMenu(found.menuId);
    expect(menuDetail).toBeDefined();
    if (menuDetail) {
      expect(menuDetail.title).toBeDefined();
      expect(menuDetail.menu).toBeDefined();
    }
  });

  test('複数の検索条件で正しく結果が絞り込まれる', async () => {
    // 複数条件での検索
    const req = new Request('http://localhost/api/search-similar-menus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: '検索テスト用メニュー',
        duration: 60,
        openaiApiKey: process.env.OPENAI_API_KEY,
      }),
    });
    const apiRes = await searchSimilarHandler(req as any);
    const payload = await apiRes.json();

    expect(Array.isArray(payload.menus)).toBe(true);
    payload.menus.forEach((m: any) => {
      expect(m.menuData).toBeDefined();
      expect(m.similarityScore).toBeGreaterThanOrEqual(0);
    });
  });

  test('検索結果が存在しない場合、空配列が返される', async () => {
    // 存在しない条件で検索
    const req = new Request('http://localhost/api/search-similar-menus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: '存在しないメニュー',
        duration: 120,
        openaiApiKey: process.env.OPENAI_API_KEY,
      }),
    });
    const apiRes = await searchSimilarHandler(req as any);
    const payload = await apiRes.json();

    expect(Array.isArray(payload.menus)).toBe(true);
    expect(payload.menus.length).toBe(0);
  });

  test('無効なメニューIDでの詳細表示要求時にnullが返される', async () => {
    const invalidId = 'non_existent_menu_id';
    const menuDetail = await neonDb.getMenu(invalidId);
    expect(menuDetail).toBeNull();
  });
});
