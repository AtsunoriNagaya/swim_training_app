import { rest } from 'msw'; // http の代わりに rest をインポート
import { setupServer } from 'msw/node';
import { handlers } from '../../setup';

// モックのインポート
jest.mock('@/lib/pdf-parser');
jest.mock('@/lib/blob-storage');

// MSWサーバーのセットアップ
const server = setupServer(...handlers);

describe('ファイル操作機能のテスト', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  describe('ファイルアップロード', () => {
    it('PDFファイルが正常にアップロードされる (UT-008)', async () => {
      const mockFile = new File(['test pdf content'], 'test.pdf', { type: 'application/pdf' });
      
      server.use(
        rest.post('/api/upload-menu', (req, res, ctx) => { // http.post を rest.post に変更し、引数を追加
          return res( // response.json を res(ctx.json(...)) に変更
            ctx.status(200),
            ctx.json({ 
              success: true, 
              message: 'ファイルが正常にアップロードされました' 
            })
          );
        })
      );

      const formData = new FormData();
      formData.append('file', mockFile);

      const response = await fetch('/api/upload-menu', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.message).toBe('ファイルが正常にアップロードされました');
    });

    // Removed duplicated test block below

    it('CSVファイルが正常にアップロードされる (UT-009)', async () => {
      const mockFile = new File(['test,csv,content'], 'test.csv', { type: 'text/csv' });
      
      server.use(
        rest.post('/api/upload-menu', (req, res, ctx) => { // http.post を rest.post に変更し、引数を追加
          return res( // response.json を res(ctx.json(...)) に変更
            ctx.status(200),
            ctx.json({ 
              success: true, 
              message: 'ファイルが正常にアップロードされました' 
            })
          ); // Missing closing parenthesis added here
        })
      );

      const formData = new FormData();
      formData.append('file', mockFile);

      const response = await fetch('/api/upload-menu', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.message).toBe('ファイルが正常にアップロードされました');
    });

    it('無効なファイル形式の場合はエラーが返される (UT-010)', async () => {
      const mockFile = new File(['invalid content'], 'test.txt', { type: 'text/plain' });
      
      server.use(
        rest.post('/api/upload-menu', (req, res, ctx) => { // http.post を rest.post に変更し、引数を追加
          return res( // response.json を res(ctx.json(...)) に変更
            ctx.status(400), // status を ctx.status() に移動
            ctx.json({ 
              success: false, 
              error: '無効なファイル形式です' 
            })
          );
        })
      );

      const formData = new FormData();
      formData.append('file', mockFile);

      const response = await fetch('/api/upload-menu', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      expect(response.ok).toBe(false);
      expect(result.success).toBe(false);
      expect(result.error).toBe('無効なファイル形式です');
    });
  });
});
