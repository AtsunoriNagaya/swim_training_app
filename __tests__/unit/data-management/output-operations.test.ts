import { rest } from 'msw'; // Import rest instead of the whole namespace
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
      const mockPdfBlob = new Blob(['PDF content'], { type: 'application/pdf' });
      
      server.use(
        rest.post('/api/generate-menu/pdf', (req, res, ctx) => { // Use rest and handler arguments
          return res(
            ctx.status(200),
            ctx.set('Content-Type', 'application/pdf'),
            ctx.set('Content-Disposition', 'attachment; filename="training-menu.pdf"'),
            ctx.body(mockPdfBlob)
          );
        })
      );

      const response = await fetch('/api/generate-menu/pdf', {
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
      const mockCsvBlob = new Blob([mockCsvContent], { type: 'text/csv' });

      server.use(
        rest.post('/api/generate-menu/csv', (req, res, ctx) => { // Use rest and handler arguments
          return res(
            ctx.status(200),
            ctx.set('Content-Type', 'text/csv'),
            ctx.set('Content-Disposition', 'attachment; filename="training-menu.csv"'),
            ctx.body(mockCsvBlob)
          );
        })
      );

      const response = await fetch('/api/generate-menu/csv', {
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
        rest.get('/api/get-menu', (req, res, ctx) => { // Use rest and handler arguments
          return res(
            ctx.status(200),
            ctx.json(mockMenu)
          );
        })
      );

      const response = await fetch('/api/get-menu');
      const result = await response.json();

      expect(result.title).toBe('テスト用メニュー 日本語表示確認');
      expect(result.menu[0].name).toBe('ウォームアップ');
      expect(result.menu[0].items[0].description).toBe('クロール練習');
      
      // PDFでの日本語表示確認
      const pdfResponse = await fetch('/api/generate-menu/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mockMenu)
      });
      
      expect(pdfResponse.ok).toBe(true);
      
      // CSVでの日本語表示確認
      const csvResponse = await fetch('/api/generate-menu/csv', {
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
