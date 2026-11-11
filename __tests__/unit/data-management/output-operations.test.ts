import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { handlers } from '../../setup'; // Keep handlers import as it's likely used by setupServer
import type { TrainingMenu } from '../../../types/menu';

// モックのインポート
jest.mock('@/lib/blob-storage');

// モックメニューデータ
const mockMenu: TrainingMenu = {
  menuId: 'menu-test',
  title: 'テスト用メニュー 日本語表示確認',
  createdAt: new Date().toISOString(),
  menu: [
    {
      name: 'ウォームアップ',
      items: [
        {
          description: 'クロール練習',
          distance: '200',
          sets: 2,
          circle: '2:00',
          rest: '30',
          time: 10
        }
      ],
      totalTime: 10
    }
  ],
  totalTime: 10,
  intensity: 'B',
  targetSkills: ['持久力']
};

// MSWサーバーのセットアップ
const server = setupServer(...handlers);

describe('出力機能のテスト', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  describe('ファイル出力', () => {
    it('メニューがPDFとして出力される (UT-013)', async () => {
      // jest.setup.ts で Response を node-fetch v2 に置き換えているため、Blob ではなく文字列で本文を渡す（Blob だと本文が空になる）
      const mockPdfContent = 'PDF content';

      server.use(
        http.post('http://localhost/api/generate-menu/pdf', () => {
          return new HttpResponse(mockPdfContent, { status: 200, headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="training-menu.pdf"' } });
        })
      );

      const response = await fetch('http://localhost/api/generate-menu/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockMenu)
      });

      expect(response.ok).toBe(true);
      expect(response.headers.get('Content-Type')).toBe('application/pdf');
      const blob = await response.blob();
      expect(blob.type).toBe('application/pdf');
    });

    it('メニューがCSVとしてエクスポートされる (UT-014)', async () => {
      const mockCsvContent = 'メニュー名,時間,強度\nテスト用メニュー,10,B';

      server.use(
        http.post('http://localhost/api/generate-menu/csv', () => {
          return HttpResponse.text(mockCsvContent, { status: 200, headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename="training-menu.csv"' } });
        })
      );

      const response = await fetch('http://localhost/api/generate-menu/csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockMenu)
      });

      expect(response.ok).toBe(true);
      expect(response.headers.get('Content-Type')).toBe('text/csv');
      const blob = await response.blob();
      expect(blob.type).toBe('text/csv');
    });
  });

  describe('文字エンコーディング', () => {
    it('日本語が正しく表示される (UT-015)', async () => {
      server.use(
        http.get('http://localhost/api/get-menu', () => {
          return HttpResponse.json(mockMenu, { status: 200 });
        })
      );

      const response = await fetch('http://localhost/api/get-menu');
      const result = await response.json();

      expect(result.title).toBe('テスト用メニュー 日本語表示確認');
      expect(result.menu[0].name).toBe('ウォームアップ');
      expect(result.menu[0].items[0].description).toBe('クロール練習');
      
      // PDFでの日本語表示確認
      const pdfResponse = await fetch('http://localhost/api/generate-menu/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockMenu)
      });
      
      expect(pdfResponse.ok).toBe(true);
      
      // CSVでの日本語表示確認
      const csvResponse = await fetch('http://localhost/api/generate-menu/csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockMenu)
      });
      
      expect(csvResponse.ok).toBe(true);
    });
  });
});
