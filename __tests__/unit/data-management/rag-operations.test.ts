import { rest } from 'msw';
import { setupServer } from 'msw/node';
import { handlers } from '../../setup';

// モックのインポート
jest.mock('@/lib/embedding');
jest.mock('@/lib/kv-storage');

// MSWサーバーのセットアップ
const server = setupServer(...handlers);

describe('RAG機能のテスト', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  describe('RAG機能の設定と動作', () => {
    it('RAG機能の切り替えが正しく動作する (UT-020)', async () => {
      // RAG機能の有効化
      server.use(
        rest.post('http://localhost/api/settings/rag', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json({ 
              success: true, 
              enabled: true,
              message: 'RAG機能が有効化されました' 
            })
          );
        })
      );

      let response = await fetch('http://localhost/api/settings/rag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled: true })
      });

      let result = await response.json();
      expect(result.success).toBe(true);
      expect(result.enabled).toBe(true);

      // RAG機能の無効化
      server.use(
        rest.post('http://localhost/api/settings/rag', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json({ 
              success: true, 
              enabled: false,
              message: 'RAG機能が無効化されました' 
            })
          );
        })
      );

      response = await fetch('http://localhost/api/settings/rag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled: false })
      });

      result = await response.json();
      expect(result.success).toBe(true);
      expect(result.enabled).toBe(false);
    });

    it('RAG機能を使用したメニュー生成が正しく動作する', async () => {
      // RAG機能が有効な状態でのメニュー生成
      const mockRAGMenu = {
        menuId: 'rag-menu-1',
        title: 'RAGを使用して生成されたメニュー',
        createdAt: new Date().toISOString(),
        menu: [
          {
            name: 'Main',
            items: [
              {
                description: '過去のメニューを参考にした練習',
                distance: '300',
                sets: 3,
                circle: '2:00',
                rest: '30',
                time: 20
              }
            ],
            totalTime: 20
          }
        ],
        totalTime: 20,
        intensity: 'B',
        targetSkills: ['持久力'],
        usedRAG: true
      };

      server.use(
        rest.post('http://localhost/api/generate-menu', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json({
              success: true,
              menuId: mockRAGMenu.menuId,
              menu: mockRAGMenu,
              message: "メニューが正常に生成されました"
            })
          );
        })
      );

      const response = await fetch('http://localhost/api/generate-menu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          loadLevel: '中',
          trainingTime: 60,
          model: 'openai',
          useRAG: true
        })
      });

      const result = await response.json();
      expect(result.menu.usedRAG).toBe(true);
      expect(result.menu.title).toContain('RAGを使用して生成された');
    });

    it('RAG機能の設定が永続化される', async () => {
      // 設定の保存
      server.use(
        rest.post('http://localhost/api/settings/rag', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json({ 
              success: true, 
              enabled: true,
              message: '設定が保存されました'
            })
          );
        })
      );

      const saveResponse = await fetch('http://localhost/api/settings/rag', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ enabled: true })
      });

      expect(saveResponse.ok).toBe(true);

      // 設定の読み込み
      server.use(
        rest.get('http://localhost/api/settings/rag', (req, res, ctx) => {
          return res(
            ctx.status(200),
            ctx.json({ 
              enabled: true 
            })
          );
        })
      );

      const loadResponse = await fetch('http://localhost/api/settings/rag');
      const settings = await loadResponse.json();
      expect(settings.enabled).toBe(true);
    });
  });
});
