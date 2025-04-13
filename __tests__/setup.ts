import { rest } from 'msw';
import { setupServer } from 'msw/node';

// テストグローバル関数の明示的な型定義
declare const beforeAll: (callback: () => void) => void;
declare const afterAll: (callback: () => void) => void;
declare const afterEach: (callback: () => void) => void;

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

// // MSWサーバーのセットアップ (グローバル設定はコメントアウト)
// const server = setupServer(...handlers);

// // テスト環境のグローバルセットアップ (グローバル設定はコメントアウト)
// beforeAll(() => {
//   // MSWサーバーの起動
//   server.listen();
// });

// afterEach(() => {
//   // 各テスト後にリクエストハンドラーをリセット
//   server.resetHandlers();
// });

// afterAll(() => {
//   // テスト終了時にMSWサーバーをクローズ
//   server.close();
// });

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
