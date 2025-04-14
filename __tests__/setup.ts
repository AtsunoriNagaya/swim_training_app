import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { NextRequest, NextResponse } from 'next/server';
import type { GenerateMenuRequest, TrainingMenu } from '../types/menu';

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
jest.mock('../app/api/generate-menu/route', () => {
  // requireをファクトリ関数内で行う
  const { NextResponse } = require('next/server');
  return {
    POST: jest.fn().mockImplementation(async (request: NextRequest) => {
      const body = await request.json();
      // モックのレスポンスを生成
      const mockMenu: TrainingMenu = {
      menuId: `mock-${Date.now()}`,
      title: `Mock Menu for ${body.loadLevel}`,
      createdAt: new Date().toISOString(),
      menu: [
        {
          name: 'Warm Up',
          items: [{ description: 'Swim', distance: '200m', sets: 1, circle: '4:00', rest: 30 }],
          totalTime: 10
        },
        {
          name: 'Main Set',
          items: [{ description: 'Kick', distance: '400m', sets: 1, circle: '8:00', rest: 60 }],
          totalTime: 20
        }
      ],
      totalTime: body.trainingTime,
      intensity: body.loadLevel,
      targetSkills: ['Endurance'],
      remainingTime: 0,
        specialNotes: body.specialNotes
      };
      return NextResponse.json(mockMenu);
    })
  };
});

// KVストレージのモック
jest.mock('../lib/kv-storage', () => ({
  searchSimilarMenus: jest.fn().mockImplementation(
    async (query: string, duration: number, apiKey?: string) => {
      // モックデータを返すように修正
      const mockResults = [
        {
          menuData: {
            title: 'Mock Similar Menu 1',
            menu: [],
            totalTime: duration,
            intensity: '中'
          },
          similarityScore: 0.85
        },
        {
          menuData: {
            title: 'Mock Similar Menu 2',
            menu: [],
            totalTime: duration,
            intensity: '中'
          },
          similarityScore: 0.75
        }
      ];
      // クエリや時間に基づいてフィルタリングするロジックをここに追加可能
      return mockResults.filter(m => m.menuData.totalTime === duration);
    }
  ),
  saveMenu: jest.fn().mockResolvedValue(undefined),
  getMenu: jest.fn().mockResolvedValue(null)
}));

// BLOBストレージのモック
jest.mock('../lib/blob-storage', () => ({
  uploadFileToBlob: jest.fn().mockImplementation(
    async () => {
      throw new Error('Unsupported file type');
    }
  ),
  getJsonFromBlob: jest.fn().mockResolvedValue(null),
  saveJsonToBlob: jest.fn().mockResolvedValue('mock-url')
}));

// Embeddingライブラリのモック
jest.mock('../lib/embedding', () => ({
  getEmbedding: jest.fn().mockResolvedValue(Array(1536).fill(0.1)), // ダミーのEmbeddingベクトルを返す
  cosineSimilarity: jest.fn((vecA, vecB) => {
    // ダミーの類似度計算
    if (!vecA || !vecB) return 0;
    let dotProduct = 0;
    let magnitudeA = 0;
    let magnitudeB = 0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      magnitudeA += vecA[i] * vecA[i];
      magnitudeB += vecB[i] * vecB[i];
    }
    magnitudeA = Math.sqrt(magnitudeA);
    magnitudeB = Math.sqrt(magnitudeB);
    if (magnitudeA === 0 || magnitudeB === 0) {
      return 0;
    }
    return dotProduct / (magnitudeA * magnitudeB);
  }),
  generateMenuText: jest.fn((menuData) => JSON.stringify(menuData)) // ダミーのテキスト生成
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
