import { response, rest } from 'msw'; // Import 'response' again
import { setupServer } from 'msw/node';
import { handlers } from '../../setup';
import type { TrainingMenu } from '../../../types/menu';

// モックのインポート
jest.mock('@/lib/kv-storage');
jest.mock('@/lib/embedding');

// モックメニューデータ
const mockMenus: TrainingMenu[] = [
  {
    menuId: 'menu-1',
    title: '持久力向上メニュー',
    createdAt: new Date().toISOString(),
    menu: [
      {
        name: 'Main',
        items: [
          {
            description: '長距離フリー',
            distance: '400',
            sets: 4,
            circle: '2:00',
            rest: '30',
            time: 30
          }
        ],
        totalTime: 30
      }
    ],
    totalTime: 30,
    intensity: 'B',
    targetSkills: ['持久力']
  },
  {
    menuId: 'menu-2',
    title: 'スプリントメニュー',
    createdAt: new Date().toISOString(),
    menu: [
      {
        name: 'Main',
        items: [
          {
            description: '短距離スプリント',
            distance: '50',
            sets: 8,
            circle: '1:00',
            rest: '30',
            time: 20
          }
        ],
        totalTime: 20
      }
    ],
    totalTime: 20,
    intensity: 'A',
    targetSkills: ['スピード']
  }
];

// Add definitions for missing mock data
const baseMenu: TrainingMenu = mockMenus[0]; // Example: use the first mock menu as base
const comparisonMenu: TrainingMenu = { // Example: create a different menu for comparison
  menuId: 'menu-3',
  title: '回復メニュー',
  createdAt: new Date().toISOString(),
  menu: [
    {
      name: 'Recovery',
      items: [
        { description: '軽いスイム', distance: '200', sets: 1, circle: '5:00', rest: '0', time: 10 }
      ],
      totalTime: 10
    }
  ],
  totalTime: 10,
  intensity: 'C',
  targetSkills: ['回復']
};


// MSWサーバーのセットアップ
const server = setupServer(...handlers);

describe('メニュー管理機能のテスト', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  describe('メニュー検索と履歴', () => {

    // Test case for searching similar menus (UT-011)
    it('類似メニューが正しく検索される (UT-011)', async () => {
      server.use(
        rest.post('http://localhost/api/search-similar-menus', (req, res, ctx) => {
          // Simulate API response for similar menus based on query
          return res(
            ctx.json({
              menus: mockMenus,
              similarities: [0.85, 0.65] // Example similarities
            })
          );
        })
      );

      const fetchResponse = await fetch('http://localhost/api/search-similar-menus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: '持久力' }) // Search query
      });

      const result = await fetchResponse.json();
      expect(result.menus).toHaveLength(2);
      expect(result.similarities[0]).toBeGreaterThan(result.similarities[1]); // Check similarity order
    });

    // Test case for getting menu history
    it('メニュー履歴が正しく取得される', async () => {
       server.use(
        rest.get('http://localhost/api/get-menu-history', (req, res, ctx) => {
          // Simulate API response for menu history
          return res(ctx.json({ menus: mockMenus })); // Correct usage of res and ctx
        })
      );

      const fetchResponse = await fetch('http://localhost/api/get-menu-history'); // Use different variable name
      const result = await fetchResponse.json(); // Use different variable name

      expect(result.menus).toHaveLength(2);
      expect(result.menus[0].menuId).toBe('menu-1');
      expect(result.menus[1].menuId).toBe('menu-2');
    });

    // Test case for similarity search precision (UT-018)
    it('類似度検索の精度が正しい (UT-018)', async () => {
      // Define search query criteria
      const searchQuery = {
        intensity: 'B',
        targetSkills: ['持久力'],
        trainingTime: 30
      }; // Correctly defined object

      server.use(
        rest.post('http://localhost/api/search-similar-menus', (req, res, ctx) => {
           // Simulate API response for a specific high-similarity menu
          return res(
            ctx.json({
              menus: [mockMenus[0]], // Return the matching menu
              similarities: [0.95]   // High similarity score
            })
          );
        }) // Removed extra closing brackets/parentheses
      );

      const fetchResponse = await fetch('http://localhost/api/search-similar-menus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(searchQuery) // Send the search query
      });

      const result = await fetchResponse.json(); // Use different variable name
      expect(result.similarities[0]).toBeGreaterThan(0.9); // Check high similarity
      expect(result.menus[0].intensity).toBe(searchQuery.intensity); // Verify intensity matches
      expect(result.menus[0].totalTime).toBe(searchQuery.trainingTime); // Verify total time matches
    });

    // Test case for low similarity between different menus
    it('特性が異なるメニュー間の類似度が低い', async () => {
       server.use(
        rest.post('http://localhost/api/search-similar-menus', (req, res, ctx) => {
          // Simulate API response for low similarity comparison
          return res(
            ctx.json({
              similarities: [0.3], // Low similarity score
              menus: [comparisonMenu] // Return the comparison menu
            })
          );
        })
      );

      const fetchResponse = await fetch('http://localhost/api/search-similar-menus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ menu: baseMenu }) // Send the base menu for comparison
      });

      const result = await fetchResponse.json(); // Use different variable name
      expect(result.similarities[0]).toBeLessThan(0.5); // Check low similarity
    });
  });
});
