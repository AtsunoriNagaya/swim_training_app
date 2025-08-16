// Load DB credentials if present
require('dotenv').config({ path: '.env.local' });
import { GET as getMenuRoute } from '../../app/api/get-menu/route';
import * as neonDb from '../../lib/neon-db';

describe('Get Menu API Route (IT-009)', () => {
  const testId = `it009-${Date.now()}`;

  beforeAll(async () => {
    await neonDb.initDatabase();
  });

  afterAll(async () => {
    await neonDb.closeDatabase();
  });

  test('saves a menu and retrieves it via route', async () => {
    const menuData = {
      menuId: testId,
      title: '取得テスト用メニュー',
      createdAt: new Date().toISOString(),
      menu: [
        {
          name: 'ウォームアップ',
          items: [
            { description: '軽めのフリースタイル', distance: '200m', sets: 1, circle: '4:00', rest: 30 }
          ],
          totalTime: 10
        }
      ],
      totalTime: 60,
      intensity: '中'
    } as any;

    // Save into Neon DB without embedding
    await neonDb.saveMenu(testId, menuData);

    const req = new Request(`http://localhost/api/get-menu?id=${testId}`, { method: 'GET' });
    const res = await getMenuRoute(req as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toBeDefined();
    expect(json.menu).toBeDefined();
    expect(json.title).toBe(menuData.title);
    expect(json.totalTime).toBe(menuData.totalTime);
  });
});
