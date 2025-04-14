import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { NextRequest, NextResponse } from 'next/server';
import type { GenerateMenuRequest } from '../types/menu';

// NextRequestの型拡張
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveProperty(property: string, value?: unknown): R;
    }
  }
}

declare module 'next/server' {
  interface NextRequest extends Request {
    json(): Promise<any>;
  }
}

// Next.jsのモック
jest.mock('next/server', () => {
  class MockNextRequest extends Request {
    constructor(input: Request | string | URL, init?: RequestInit) {
      if (input instanceof Request) {
        super(input.url, {
          method: input.method,
          headers: input.headers,
          body: input.body,
          ...init
        });
      } else {
        super(input, init);
      }
    }

    async json() {
      const text = await this.text();
      return JSON.parse(text);
    }
  }

  return {
    NextRequest: function(input: Request | string | URL, init?: RequestInit) {
      const req = new MockNextRequest(input, init);
      return Object.assign(req, {
        json: async () => {
          const text = await req.text();
          return JSON.parse(text);
        }
      });
    },
    NextResponse: {
      json: (data: any) => ({
        status: 200,
        headers: new Headers({
          'content-type': 'application/json',
        }),
        json: () => Promise.resolve(data)
      })
    }
  };
});

// ルートハンドラのモック
jest.mock('../../app/api/generate-menu/route', () => ({
  POST: jest.fn().mockImplementation(async (request: NextRequest) => {
    throw new Error('Mock error');
  })
}));

// KVストレージのモック
jest.mock('../../lib/kv-storage', () => ({
  searchSimilarMenus: jest.fn().mockImplementation(
    async (query: string, duration: number, apiKey?: string) => {
      throw new Error('Mock error');
    }
  ),
  saveMenu: jest.fn().mockResolvedValue(undefined),
  getMenu: jest.fn().mockResolvedValue(null)
}));

// BLOBストレージのモック
jest.mock('../../lib/blob-storage', () => ({
  uploadFileToBlob: jest.fn().mockImplementation(
    async () => {
      throw new Error('Unsupported file type');
    }
  ),
  getJsonFromBlob: jest.fn().mockResolvedValue(null),
  saveJsonToBlob: jest.fn().mockResolvedValue('mock-url')
}));

// MSWハンドラーの定義
export const handlers = [
  // OpenAI API
  rest.post('https://api.openai.com/v1/*', async (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ choices: [{ message: { content: 'テストメニュー' } }] })
    );
  }),

  // Google API
  rest.post('https://generative-language.googleapis.com/*', async (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ candidates: [{ content: 'テストメニュー' }] })
    );
  }),

  // Anthropic API
  rest.post('https://api.anthropic.com/*', async (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ content: [{ text: 'テストメニュー' }] })
    );
  }),
];

// MSWサーバーのセットアップ
const server = setupServer(...handlers);

// テスト環境のグローバルセットアップ
beforeAll(() => {
  server.listen();
});

afterEach(() => {
  server.resetHandlers();
  jest.clearAllMocks();
});

afterAll(() => {
  server.close();
});

// テスト用のモックデータ
export const mockTrainingMenu = {
  title: '水泳部練習メニュー',
  totalTime: 120,
  loadLevel: '中',
  menuItems: [
    {
      type: 'ウォームアップ',
      description: '軽めのフリースタイル',
      distance: 400,
      time: 10
    },
    {
      type: 'メインセット',
      description: '100mスプリント×4本',
      distance: 400,
      time: 20
    }
  ]
};

// APIキーのモック
process.env = {
  ...process.env,
  OPENAI_API_KEY: 'test-openai-key',
  GOOGLE_API_KEY: 'test-google-key',
  ANTHROPIC_API_KEY: 'test-anthropic-key'
};

// モック関数の型
export type MockFunction = jest.Mock;

// モックリクエストの作成ヘルパー関数の型
export type CreateMockRequestFn = (body: GenerateMenuRequest) => NextRequest;
