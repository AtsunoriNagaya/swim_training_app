import { GET } from '../../../app/api/get-menu-history/route';
import { getMenuHistory } from '../../../lib/neon-db';
import { NextRequest } from 'next/server';

// neon-dbモジュールをモック
jest.mock('../../../lib/neon-db', () => ({
  getMenuHistory: jest.fn(),
}));

const mockGetMenuHistory = getMenuHistory as jest.MockedFunction<typeof getMenuHistory>;

describe('GET /api/get-menu-history', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('正常な履歴データが返される', async () => {
    // モックデータの設定
    const mockHistoryData = [
      {
        id: 'menu_1234567890_abc123',
        title: '高強度の60分トレーニングメニュー',
        description: 'AI生成メニュー: 高強度 60分',
        createdAt: '2024-08-16T05:00:00.000Z',
      },
      {
        id: 'menu_0987654321_def456',
        title: '中強度の45分トレーニングメニュー',
        description: 'AI生成メニュー: 中強度 45分',
        createdAt: '2024-08-15T10:30:00.000Z',
      },
    ];

    mockGetMenuHistory.mockResolvedValue(mockHistoryData);

    // APIを呼び出し
    const response = await GET();
    const responseData = await response.json();

    // レスポンスの検証
    expect(response.status).toBe(200);
    expect(responseData).toEqual({
      menuHistory: mockHistoryData,
      count: 2,
    });
    expect(mockGetMenuHistory).toHaveBeenCalledTimes(1);
  });

  test('空の履歴データが返される', async () => {
    // 空のデータを設定
    mockGetMenuHistory.mockResolvedValue([]);

    // APIを呼び出し
    const response = await GET();
    const responseData = await response.json();

    // レスポンスの検証
    expect(response.status).toBe(200);
    expect(responseData).toEqual({
      menuHistory: [],
      count: 0,
    });
    expect(mockGetMenuHistory).toHaveBeenCalledTimes(1);
  });

  test('データベースエラー時に適切なエラーレスポンスが返される', async () => {
    // データベースエラーを設定
    const mockError = new Error('Database connection failed');
    mockGetMenuHistory.mockRejectedValue(mockError);

    // APIを呼び出し
    const response = await GET();
    const responseData = await response.json();

    // エラーレスポンスの検証
    expect(response.status).toBe(500);
    expect(responseData).toHaveProperty('error');
    expect(responseData.error).toBe('Database connection failed');
    expect(mockGetMenuHistory).toHaveBeenCalledTimes(1);
  });

  test('予期しないエラー時にデフォルトエラーメッセージが返される', async () => {
    // 予期しないエラーを設定
    mockGetMenuHistory.mockRejectedValue(new Error());

    // APIを呼び出し
    const response = await GET();
    const responseData = await response.json();

    // エラーレスポンスの検証
    expect(response.status).toBe(500);
    expect(responseData).toHaveProperty('error');
    expect(responseData.error).toBe('メニュー履歴の取得に失敗しました');
    expect(mockGetMenuHistory).toHaveBeenCalledTimes(1);
  });

  test('レスポンスにタイムスタンプが含まれる', async () => {
    // エラーを設定してタイムスタンプをテスト
    mockGetMenuHistory.mockRejectedValue(new Error('Test error'));

    // APIを呼び出し
    const response = await GET();
    const responseData = await response.json();

    // タイムスタンプの検証
    expect(responseData).toHaveProperty('timestamp');
    expect(new Date(responseData.timestamp)).toBeInstanceOf(Date);
  });

  test('開発環境でのみスタックトレースが含まれる', async () => {
    // 開発環境を設定
    const originalEnv = process.env.NODE_ENV;
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'development',
      configurable: true,
    });

    const mockError = new Error('Test error');
    mockError.stack = 'Error stack trace';
    mockGetMenuHistory.mockRejectedValue(mockError);

    // APIを呼び出し
    const response = await GET();
    const responseData = await response.json();

    // スタックトレースの検証
    expect(responseData).toHaveProperty('details');
    expect(responseData.details).toBe('Error stack trace');

    // 環境変数を元に戻す
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalEnv,
      configurable: true,
    });
  });

  test('本番環境ではスタックトレースが含まれない', async () => {
    // 本番環境を設定
    const originalEnv = process.env.NODE_ENV;
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'production',
      configurable: true,
    });

    const mockError = new Error('Test error');
    mockError.stack = 'Error stack trace';
    mockGetMenuHistory.mockRejectedValue(mockError);

    // APIを呼び出し
    const response = await GET();
    const responseData = await response.json();

    // スタックトレースが含まれないことを検証
    expect(responseData).not.toHaveProperty('details');

    // 環境変数を元に戻す
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalEnv,
      configurable: true,
    });
  });
});
