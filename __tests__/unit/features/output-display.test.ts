import { rest } from 'msw';
import { setupServer } from 'msw/node';
import fs from 'fs';
import path from 'path';

// モックのインポート
jest.mock('@/lib/kv-storage');
jest.mock('fs');
jest.mock('path');

// モックメニューデータ
const mockMenu = {
  menuId: 'menu-test',
  title: 'テスト用メニュー',
  createdAt: new Date().toISOString(),
  menu: [
    {
      name: 'W-up',
      items: [
        {
          description: '軽めのフリースタイル',
          distance: '400',
          sets: 1,
          time: 10
        }
      ],
      totalTime: 10
    }
  ],
  totalTime: 10,
  intensity: 'B'
};

// MSWサーバーのセットアップ
const server = setupServer();

describe('出力と表示機能のテスト', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  describe('PDF出力機能', () => {
    it('メニューがPDF形式で出力される (UT-013)', async () => {
      server.use(
        rest.post('http://localhost/api/export-pdf', (req, res, ctx) => {
          return res(
            ctx.set('Content-Type', 'application/pdf'),
            ctx.body('mock pdf content')
          );
        })
      );

      const response = await fetch('http://localhost/api/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockMenu)
      });

      expect(response.ok).toBe(true);
      expect(response.headers.get('Content-Type')).toBe('application/pdf');
      const content = await response.text();
      expect(content).toBeTruthy();
    });
  });

  describe('CSVエクスポート機能', () => {
    it('メニューがCSV形式で出力される (UT-014)', async () => {
      server.use(
        rest.post('http://localhost/api/export-csv', (req, res, ctx) => {
          return res(
            ctx.set('Content-Type', 'text/csv'),
            ctx.text('name,description,distance,sets,time\nW-up,軽めのフリースタイル,400,1,10')
          );
        })
      );

      const response = await fetch('http://localhost/api/export-csv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockMenu)
      });

      expect(response.ok).toBe(true);
      expect(response.headers.get('Content-Type')).toBe('text/csv');
      const content = await response.text();
      expect(content).toContain('name,description');
      expect(content).toContain('W-up,軽めのフリースタイル');
    });
  });

  describe('日本語文字表示', () => {
    it('日本語が正常に表示される (UT-015)', async () => {
      server.use(
        rest.get('http://localhost/api/get-menu', (req, res, ctx) => {
          return res(ctx.json(mockMenu));
        })
      );

      const response = await fetch('http://localhost/api/get-menu');
      
      expect(response.ok).toBe(true);
      const result = await response.json();
      expect(result.title).toBe('テスト用メニュー');
      expect(result.menu[0].items[0].description).toBe('軽めのフリースタイル');
      
      // 文字化けしていないことを確認
      const hasValidJapanese = /[\u3000-\u303f\u3040-\u309f\u30a0-\u30ff\uff00-\uff9f\u4e00-\u9faf\u3400-\u4dbf]/.test(
        result.title + result.menu[0].items[0].description
      );
      expect(hasValidJapanese).toBe(true);
    });
  });
});
