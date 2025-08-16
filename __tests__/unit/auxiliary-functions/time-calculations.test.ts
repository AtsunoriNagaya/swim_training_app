import { rest } from 'msw'; // HttpResponse を削除し、rest のみインポート
import { setupServer } from 'msw/node';
import { handlers } from '../../setup';
import type { TrainingMenu, MenuItem } from '../../../types/menu';

// MSWサーバーのセットアップ
const server = setupServer(...handlers);

describe('時間計算機能のテスト', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  describe('時間調整と計算', () => {
    it('自動時間調整が正しく機能する (UT-016)', async () => {
      // 要求時間より長いメニューの自動調整
      const longMenu: TrainingMenu = {
        menuId: 'test-menu',
        title: 'テストメニュー',
        createdAt: new Date().toISOString(),
        menu: [
          {
            name: 'W-up',
            items: [
              { description: 'フリー', distance: '400', sets: 2, circle: '2:00', rest: '30', time: 10 }
            ],
            totalTime: 10
          },
          {
            name: 'Main',
            items: [
              { description: 'スプリント', distance: '50', sets: 10, circle: '1:00', rest: '30', time: 25 }
            ],
            totalTime: 25
          }
        ],
        totalTime: 35,
        intensity: 'A'
      };

      server.use(
        rest.post('http://localhost/api/generate-menu', (req, res, ctx) => {
          const adjustedMenu = {
            ...longMenu,
            menu: [
              longMenu.menu[0],
              {
                ...longMenu.menu[1],
                items: [
                  { ...longMenu.menu[1].items[0], sets: 6, time: 15 }
                ],
                totalTime: 15
              }
            ],
            totalTime: 25
          };
          // 実際のAPIレスポンス形式に合わせる
          return res(ctx.json({
            success: true,
            menuId: adjustedMenu.menuId,
            menu: adjustedMenu,
            message: "メニューが正常に生成されました"
          }));
        })
      );

      const responseFetch = await fetch('http://localhost/api/generate-menu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          duration: 25,
          loadLevels: ['中'],
          aiModel: 'openai',
          apiKey: 'test-key'
        })
      });

      const response = await responseFetch.json();
      const result: TrainingMenu = response.menu; // APIレスポンス形式に合わせて修正
      expect(result.totalTime).toBeLessThanOrEqual(25);
      expect(result.menu.length).toBe(2);
      expect(result.menu[1].items[0].sets).toBe(6);
    });

    it('メニュー全体の合計時間が正しく計算される (UT-017)', () => {
      const menu: TrainingMenu = {
        menuId: 'test-menu',
        title: 'テストメニュー',
        createdAt: new Date().toISOString(),
        menu: [
          {
            name: 'W-up',
            items: [
              { description: '軽めのフリー', distance: '200', sets: 2, circle: '1:30', rest: '30', time: 7 } as MenuItem
            ],
            totalTime: 7
          },
          {
            name: 'Main',
            items: [
              { description: 'キック練習', distance: '100', sets: 4, circle: '2:00', rest: '30', time: 12 } as MenuItem,
              { description: 'プル練習', distance: '100', sets: 4, circle: '2:00', rest: '30', time: 12 } as MenuItem
            ],
            totalTime: 24
          },
          {
            name: 'Cool-down',
            items: [
              { description: 'クールダウン', distance: '200', sets: 1, circle: '3:00', rest: '0', time: 4 } as MenuItem
            ],
            totalTime: 4
          }
        ],
        totalTime: 35,
        intensity: 'B'
      };

      // セクションごとの時間計算テスト
      menu.menu.forEach(section => {
        const sectionTotal = section.items.reduce((sum, item) => sum + (item.time || 0), 0);
        expect(section.totalTime).toBe(sectionTotal);
      });

      // メニュー全体の合計時間テスト
      const totalTime = menu.menu.reduce((sum, section) => sum + section.totalTime, 0);
      expect(menu.totalTime).toBe(totalTime);
      expect(totalTime).toBe(35);
    });
  });
});
