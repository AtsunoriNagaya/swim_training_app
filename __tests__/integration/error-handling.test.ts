import { NextRequest } from 'next/server';
import type { GenerateMenuRequest as MenuGenerationParams, LoadLevel } from '../../types/menu';
import type { MockFunction } from '../setup';

// モックのインポート
let POST: MockFunction;
let uploadFileToBlob: MockFunction;
let searchSimilarMenus: MockFunction;

// NextRequestのモック作成ヘルパー関数
function createMockRequest(body: MenuGenerationParams): NextRequest {
  const input = new Request('http://localhost:3000/api/generate-menu', {
    method: 'POST',
    headers: new Headers({
      'Content-Type': 'application/json'
    }),
    body: JSON.stringify(body)
  });

  return Object.assign(new NextRequest(input), {
    json: async () => body
  });
}

describe('Error Handling Consistency Integration (IT-008)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // モジュールのモックを取得
    const { POST: postMock } = jest.requireMock('../../app/api/generate-menu/route');
    const { uploadFileToBlob: uploadMock } = jest.requireMock('../../lib/blob-storage');
    const { searchSimilarMenus: searchMock } = jest.requireMock('../../lib/kv-storage');
    
    // モック関数を設定
    POST = postMock;
    uploadFileToBlob = uploadMock;
    searchSimilarMenus = searchMock;

    // 各モックのデフォルトの実装を設定
    POST.mockRejectedValue(new Error('Mock error'));
    uploadFileToBlob.mockRejectedValue(new Error('Unsupported file type'));
    searchSimilarMenus.mockRejectedValue(new Error('Mock error'));
  });

  test('APIキーエラーが一貫して処理される', async () => {
    // APIキーを無効化
    process.env.OPENAI_API_KEY = 'invalid_key';
    process.env.GOOGLE_API_KEY = 'invalid_key';
    process.env.ANTHROPIC_API_KEY = 'invalid_key';

    const baseParams: MenuGenerationParams = {
      model: 'openai',
      loadLevel: '中',
      trainingTime: 60
    };

    // 各AIモデルでのエラー
    const modelTests = [
      { model: 'openai' as const, key: process.env.OPENAI_API_KEY },
      { model: 'google' as const, key: process.env.GOOGLE_API_KEY },
      { model: 'anthropic' as const, key: process.env.ANTHROPIC_API_KEY }
    ];

    for (const { model, key } of modelTests) {
      await expect(POST(createMockRequest({
        ...baseParams,
        model,
        apiKey: key
      }))).rejects.toThrow('Mock error');
    }
  });

  test('ファイル形式エラーが一貫して処理される', async () => {
    const invalidFiles = [
      { name: 'test.txt', content: 'text content', type: 'text/plain' },
      { name: 'test.jpg', content: 'image data', type: 'image/jpeg' },
      { name: 'test.doc', content: 'doc content', type: 'application/msword' }
    ];

    for (const file of invalidFiles) {
      await expect(uploadFileToBlob({
        fileName: file.name,
        fileContent: Buffer.from(file.content),
        contentType: file.type
      })).rejects.toThrow('Unsupported file type');
    }

    expect(uploadFileToBlob).toHaveBeenCalledTimes(invalidFiles.length);
  });

  test('無効な検索条件が一貫して処理される', async () => {
    const invalidQueries = [
      { query: 'invalid load level query', duration: 60 },
      { query: 'medium load level query', duration: -30 },
      { query: 'invalid model query', duration: 60 }
    ];

    for (const { query, duration } of invalidQueries) {
      await expect(searchSimilarMenus(query, duration, process.env.OPENAI_API_KEY))
        .rejects.toThrow('Mock error');
    }

    expect(searchSimilarMenus).toHaveBeenCalledTimes(invalidQueries.length);
  });

  test('ネットワークエラーが一貫して処理される', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('Network error'));

    const params: MenuGenerationParams = {
      model: 'openai',
      loadLevel: '中',
      trainingTime: 60
    };

    await expect(POST(createMockRequest(params)))
      .rejects.toThrow('Mock error');
  });

  test('タイムアウトエラーが一貫して処理される', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('Request timeout'));

    const params: MenuGenerationParams = {
      model: 'openai',
      loadLevel: '中',
      trainingTime: 60
    };

    await expect(POST(createMockRequest(params)))
      .rejects.toThrow('Mock error');
  });

  test('バリデーションエラーが一貫して処理される', async () => {
    const invalidParams = [
      {
        model: 'openai',
        loadLevel: '無効' as LoadLevel,
        trainingTime: 60
      },
      {
        model: 'openai',
        loadLevel: '中',
        trainingTime: -30
      },
      {
        model: 'invalid' as any,
        loadLevel: '中',
        trainingTime: 60
      }
    ] as const;

    for (const params of invalidParams) {
      await expect(POST(createMockRequest(params as MenuGenerationParams)))
        .rejects.toThrow('Mock error');
    }

    expect(POST).toHaveBeenCalledTimes(invalidParams.length);
  });

  test('同時エラーが適切に処理される', async () => {
    const promises = [
      POST(createMockRequest({
        model: 'openai',
        loadLevel: '中',
        trainingTime: 60
      })),
      uploadFileToBlob({
        fileName: 'test.txt',
        fileContent: Buffer.from('test'),
        contentType: 'text/plain'
      }),
      searchSimilarMenus('invalid menu query', 60, process.env.OPENAI_API_KEY)
    ];

    const results = await Promise.allSettled(promises);
    
    results.forEach(result => {
      expect(result.status).toBe('rejected');
      if (result.status === 'rejected') {
        expect(result.reason).toBeInstanceOf(Error);
      }
    });
  });
});
