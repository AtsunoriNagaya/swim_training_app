import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { NextRequest, NextResponse } from 'next/server';
import type { GenerateMenuRequest, TrainingMenu } from '../types/menu';
import { Response } from 'node-fetch';

// 拡張型の定義
interface MenuMetadata {
  ragEnabled: boolean;
  sourceDocuments?: string[];
}

interface ExtendedTrainingMenu extends TrainingMenu {
  metadata?: MenuMetadata;
  usedRAG?: boolean;
}

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
      json: (data: any, options?: { status?: number }) => ({
        status: options?.status || 200,
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
      
      // 無効なAPIキーの場合はエラーを返す
      if (process.env.OPENAI_API_KEY === 'invalid_key') {
        return NextResponse.json({ error: '無効なAPIキーです' }, { status: 401 });
      }
      
      // モックのレスポンスを生成
      const isRagEnabled = body.specialNotes?.includes('RAGテスト') ?? false;
      const mockMenu: ExtendedTrainingMenu = {
        menuId: `mock-${Date.now()}`,
        title: `テスト用メニュー（${body.loadLevel}）`,
        createdAt: new Date().toISOString(),
        menu: [
          {
            name: 'ウォームアップ',
            items: [{ description: 'フリースタイル', distance: '200m', sets: 1, circle: '4:00', rest: 30 }],
            totalTime: 10
          },
          {
            name: 'メインセット',
            items: [{ description: 'キック', distance: '400m', sets: 1, circle: '8:00', rest: 60 }],
            totalTime: 20
          }
        ],
        totalTime: body.trainingTime,
        intensity: body.loadLevel,
        targetSkills: ['持久力'],
        remainingTime: 0,
        specialNotes: body.specialNotes,
        metadata: {
          ragEnabled: isRagEnabled,
          sourceDocuments: isRagEnabled ? ['test-menu.pdf'] : undefined
        },
        usedRAG: isRagEnabled
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
            title: '類似メニュー1',
            menu: [
              {
                name: 'ウォームアップ',
                items: [{ description: 'フリースタイル', distance: '200m', sets: 1, circle: '4:00', rest: 30 }],
                totalTime: duration * 0.2
              }
            ],
            totalTime: duration,
            intensity: '中'
          },
          similarityScore: 0.85
        },
        {
          menuData: {
            title: '類似メニュー2',
            menu: [
              {
                name: 'ウォームアップ',
                items: [{ description: 'キック', distance: '100m', sets: 2, circle: '2:00', rest: 20 }],
                totalTime: duration * 0.2
              }
            ],
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
    async (file: File) => {
      if (file.type === 'application/pdf' || file.type === 'text/csv') {
        return `mock-blob-url/${file.name}`;
      }
      throw new Error('Unsupported file type');
    }
  ),
  getJsonFromBlob: jest.fn().mockResolvedValue(null),
  saveJsonToBlob: jest.fn().mockResolvedValue('mock-url')
}));

// Embeddingライブラリのモック
jest.mock('../lib/embedding', () => ({
  getEmbedding: jest.fn().mockResolvedValue(Array(1536).fill(0.1)),
  cosineSimilarity: jest.fn((vecA, vecB) => {
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
  generateMenuText: jest.fn((menuData) => JSON.stringify(menuData))
}));

// ベースURL
const BASE_URL = 'http://localhost';

// MSWハンドラーの定義
export const handlers = [
  // アプリケーションAPIエンドポイント
  rest.post(`${BASE_URL}/api/generate-menu`, async (req, res, ctx) => {
    const auth = req.headers.get('Authorization');
    if (auth === 'Bearer invalid_key' || process.env.OPENAI_API_KEY === 'invalid_key') {
      return res(
        ctx.status(401),
        ctx.json({ error: '無効なAPIキーです' })
      );
    }

    const body = await req.text().then(text => JSON.parse(text));
    const requestedTime = Number(body.trainingTime) || 60;
    const adjustedTime = Math.min(requestedTime, body.maxTime || requestedTime);

    const isRagEnabled = body.specialNotes?.includes('RAGテスト') ?? false;
    const response: ExtendedTrainingMenu = {
      menuId: `mock-${Date.now()}`,
      title: `テスト用メニュー（${body.loadLevel}）`,
      createdAt: new Date().toISOString(),
      menu: [
        {
          name: 'ウォームアップ',
          items: [{ description: 'フリースタイル', distance: '200m', sets: 1, circle: '4:00', rest: 30 }],
          totalTime: Math.round(adjustedTime * 0.2)
        },
        {
          name: 'メインセット',
          items: [{ description: 'キック', distance: '400m', sets: 1, circle: '8:00', rest: 60 }],
          totalTime: Math.round(adjustedTime * 0.8)
        }
      ],
      totalTime: adjustedTime,
      intensity: body.loadLevel === '低' ? 'A' : body.loadLevel === '中' ? 'B' : 'C',
      targetSkills: ['持久力'],
      remainingTime: 0,
      specialNotes: body.specialNotes || 'テスト',
      metadata: {
        ragEnabled: isRagEnabled,
        sourceDocuments: isRagEnabled ? ['test-menu.pdf'] : undefined
      },
      usedRAG: isRagEnabled
    };

    return res(
      ctx.status(200),
      ctx.json(response)
    );
  }),

  rest.post(`${BASE_URL}/api/upload-menu`, async (req, res, ctx) => {
    try {
      const formData = await (req as unknown as Request).formData();
      const file = formData.get('file') as File;
      if (!file) {
        return res(ctx.status(400), ctx.json({ success: false, error: 'ファイルが指定されていません' }));
      }
      if (file.type === 'application/pdf' || file.type === 'text/csv') {
        return res(ctx.status(200), ctx.json({
          success: true,
          message: 'ファイルが正常にアップロードされました',
          url: `mock-blob-url/${file.name}`
        }));
      }
      return res(ctx.status(400), ctx.json({ success: false, error: '無効なファイル形式です' }));
    } catch (error) {
      return res(ctx.status(400), ctx.json({ success: false, error: '無効なフォームデータです' }));
    }
  }),

  rest.get(`${BASE_URL}/api/get-menu`, async (req, res, ctx) => {
    const url = new URL(req.url);
    const menuId = url.searchParams.get('menuId');
    if (menuId && menuId.startsWith('mock-')) {
      const mockMenu: TrainingMenu = {
        menuId: menuId,
        title: 'テスト用メニュー',
        createdAt: new Date().toISOString(),
        menu: [
          {
            name: 'ウォームアップ',
            items: [{ description: '軽めのフリースタイル', distance: '200m', sets: 1, circle: '4:00', rest: 30 }],
            totalTime: 10
          }
        ],
        totalTime: 60,
        intensity: 'B',
        targetSkills: ['持久力'],
        remainingTime: 0,
        specialNotes: 'テスト用のメニューです'
      };
      return res(ctx.status(200), ctx.json(mockMenu));
    }
    return res(ctx.status(404), ctx.json({ error: 'メニューが見つかりません' }));
  }),

  rest.get(`${BASE_URL}/api/get-menu-history`, async (req, res, ctx) => {
    const mockHistory = {
      menus: [
        { menuId: 'menu-1', title: 'テスト用メニュー1', createdAt: new Date().toISOString() },
        { menuId: 'menu-2', title: 'テスト用メニュー2', createdAt: new Date().toISOString() }
      ]
    };
    return res(ctx.status(200), ctx.json(mockHistory));
  }),

  rest.post(`${BASE_URL}/api/search-similar-menus`, async (req, res, ctx) => {
    const { query } = await req.json();
    if (query === '存在しないメニュー') {
      return res(ctx.status(200), ctx.json({ menus: [], similarities: [] }));
    }

    const mockMenus = [
      {
        menuId: 'menu-1',
        title: query?.includes('高強度') ? '高強度トレーニング' : '類似メニュー1',
        menu: [
          {
            name: 'ウォームアップ',
            items: [{ description: 'フリースタイル', distance: '200m', sets: 1, circle: '4:00', rest: 30 }],
            totalTime: 10
          }
        ],
        totalTime: 30,
        intensity: query?.includes('高強度') ? 'C' : 'B'
      },
      {
        menuId: 'menu-2',
        title: '類似メニュー2',
        menu: [
          {
            name: 'ウォームアップ',
            items: [{ description: 'キック', distance: '100m', sets: 2, circle: '2:00', rest: 20 }],
            totalTime: 10
          }
        ],
        totalTime: 30,
        intensity: 'B'
      }
    ];

    const similarities = [0.95, 0.45];

    return res(ctx.status(200), ctx.json({
      menus: mockMenus,
      similarities
    }));
  }),

  rest.post(`${BASE_URL}/api/settings/rag`, async (req, res, ctx) => {
    const { enabled } = await req.json();
    return res(ctx.status(200), ctx.json({ 
      success: true, 
      enabled: enabled ?? true,
      message: enabled ? 'RAG機能が有効化されました' : 'RAG機能が無効化されました'
    }));
  }),

  rest.get(`${BASE_URL}/api/settings/rag`, async (req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ enabled: true }));
  }),

  rest.post(`${BASE_URL}/api/export-pdf`, async (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.set('Content-Type', 'application/pdf'),
      ctx.body(new Blob(['mock pdf content'], { type: 'application/pdf' }))
    );
  }),

  rest.post(`${BASE_URL}/api/export-csv`, async (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.set('Content-Type', 'text/csv'),
      ctx.text('name,description\nW-up,軽めのフリースタイル')
    );
  }),

  rest.post(`${BASE_URL}/api/generate-menu/csv`, async (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.set('Content-Type', 'text/csv'),
      ctx.text('name,description\nW-up,軽めのフリースタイル')
    );
  }),

  rest.post('https://api.openai.com/v1/*', async (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ choices: [{ message: { content: 'テストメニュー' } }] })
    );
  }),

  rest.post('https://generative-language.googleapis.com/*', async (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ candidates: [{ content: 'テストメニュー' }] })
    );
  }),

  rest.post('https://api.anthropic.com/*', async (req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ content: [{ text: 'テストメニュー' }] })
    );
  }),
];

const server = setupServer(...handlers);

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

process.env = {
  ...process.env,
  OPENAI_API_KEY: 'test-openai-key',
  GOOGLE_API_KEY: 'test-google-key',
  ANTHROPIC_API_KEY: 'test-anthropic-key'
};

export type MockFunction = jest.Mock;
export type CreateMockRequestFn = (body: GenerateMenuRequest) => NextRequest;
