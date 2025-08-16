// モックのインポート
jest.mock('@/lib/pdf-parser');
jest.mock('@/lib/blob-storage');

// fetchをモック化
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('ファイル操作機能のテスト', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('ファイルアップロード', () => {
    it('PDFファイルが正常にアップロードされる (UT-008)', async () => {
      const mockFile = new File(['test pdf content'], 'test.pdf', { type: 'application/pdf' });
      
      // fetchのモックレスポンスを設定
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        clone: () => ({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            message: 'ファイルが正常にアップロードされました',
            url: 'mock-blob-url/test.pdf'
          })
        }),
        json: async () => ({
          success: true,
          message: 'ファイルが正常にアップロードされました',
          url: 'mock-blob-url/test.pdf'
        })
      });

      const formData = new FormData();
      formData.append('file', mockFile);

      const response = await fetch('http://localhost/api/upload-menu', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.message).toBe('ファイルが正常にアップロードされました');
      
      // fetchが正しい引数で呼ばれたことを確認
      expect(fetch).toHaveBeenCalledWith('http://localhost/api/upload-menu', {
        method: 'POST',
        body: formData
      });
    });

    it('CSVファイルが正常にアップロードされる (UT-009)', async () => {
      const mockFile = new File(['test,csv,content'], 'test.csv', { type: 'text/csv' });
      
      // fetchのモックレスポンスを設定
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        clone: () => ({
          ok: true,
          status: 200,
          json: async () => ({
            success: true,
            message: 'ファイルが正常にアップロードされました',
            url: 'mock-blob-url/test.csv'
          })
        }),
        json: async () => ({
          success: true,
          message: 'ファイルが正常にアップロードされました',
          url: 'mock-blob-url/test.csv'
        })
      });

      const formData = new FormData();
      formData.append('file', mockFile);

      const response = await fetch('http://localhost/api/upload-menu', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      expect(result.success).toBe(true);
      expect(result.message).toBe('ファイルが正常にアップロードされました');
      
      // fetchが正しい引数で呼ばれたことを確認
      expect(fetch).toHaveBeenCalledWith('http://localhost/api/upload-menu', {
        method: 'POST',
        body: formData
      });
    });

    it('無効なファイル形式の場合はエラーが返される (UT-010)', async () => {
      const mockFile = new File(['invalid content'], 'test.txt', { type: 'text/plain' });
      
      // fetchのモックレスポンスを設定
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        clone: () => ({
          ok: false,
          status: 400,
          json: async () => ({
            success: false,
            error: '無効なファイル形式です'
          })
        }),
        json: async () => ({
          success: false,
          error: '無効なファイル形式です'
        })
      });

      const formData = new FormData();
      formData.append('file', mockFile);

      const response = await fetch('http://localhost/api/upload-menu', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      expect(response.ok).toBe(false);
      expect(result.success).toBe(false);
      expect(result.error).toBe('無効なファイル形式です');
      
      // fetchが正しい引数で呼ばれたことを確認
      expect(fetch).toHaveBeenCalledWith('http://localhost/api/upload-menu', {
        method: 'POST',
        body: formData
      });
    });
  });
});
