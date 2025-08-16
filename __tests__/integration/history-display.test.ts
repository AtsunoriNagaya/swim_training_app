import { render, screen, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';
import React from 'react';
import HistoryPage from '../../app/history/page';

// fetchをモック
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;
global.fetch = mockFetch;

// localStorageをモック
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
});

describe('History Display Integration (IT-005)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockClear();
  });

  test('データベースからの履歴が正常に表示される', async () => {
    // APIレスポンスをモック
    const mockApiResponse = {
      menuHistory: [
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
      ],
      count: 2,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockApiResponse,
    } as Response);

    // ローカルストレージは空
    mockLocalStorage.getItem.mockReturnValue('[]');

    render(React.createElement(HistoryPage));

    // ローディング状態の確認
    expect(screen.getByText('読み込み中...')).toBeInTheDocument();

    // データが表示されるまで待機
    await waitFor(() => {
      expect(screen.getByText('高強度の60分トレーニングメニュー')).toBeInTheDocument();
    });

    // AI生成メニューのバッジが表示されることを確認
    const aiGeneratedBadges = screen.getAllByText('AI生成');
    expect(aiGeneratedBadges).toHaveLength(2);

    // メニュー表示リンクが存在することを確認
    const menuLinks = screen.getAllByText('メニューを表示');
    expect(menuLinks).toHaveLength(2);
    expect(menuLinks[0]).toHaveAttribute('href', '/result?menuId=menu_1234567890_abc123');
  });

  test('ローカルストレージとデータベースの統合表示', async () => {
    // APIレスポンスをモック（AI生成メニュー）
    const mockApiResponse = {
      menuHistory: [
        {
          id: 'menu_ai_generated',
          title: 'AI生成メニュー',
          description: 'AI生成メニュー: 高強度 60分',
          createdAt: '2024-08-16T05:00:00.000Z',
        },
      ],
      count: 1,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockApiResponse,
    } as Response);

    // ローカルストレージにアップロードファイルのデータ
    const localStorageData = [
      {
        id: 'upload_file_123',
        title: 'アップロードされたメニュー',
        description: 'CSVファイルからアップロード',
        fileType: 'text/csv',
        fileSize: '2KB',
        createdAt: '2024-08-14T10:00:00.000Z',
        content: 'メニュー内容...',
      },
    ];
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(localStorageData));

    render(React.createElement(HistoryPage));

    await waitFor(() => {
      expect(screen.getByText('AI生成メニュー')).toBeInTheDocument();
      expect(screen.getByText('アップロードされたメニュー')).toBeInTheDocument();
    });

    // AI生成とアップロードのバッジが正しく表示されることを確認
    expect(screen.getByText('AI生成')).toBeInTheDocument();
    expect(screen.getByText('アップロード')).toBeInTheDocument();

    // AI生成メニューにはメニュー表示リンクがある
    expect(screen.getByText('メニューを表示')).toBeInTheDocument();

    // アップロードファイルにはファイル情報が表示される
    expect(screen.getByText('ファイル形式: CSV')).toBeInTheDocument();
    expect(screen.getByText('ファイルサイズ: 2KB')).toBeInTheDocument();
  });

  test('重複メニューの処理（データベース優先）', async () => {
    // 同じIDのメニューがデータベースとローカルストレージに存在
    const duplicateId = 'menu_duplicate_123';
    
    const mockApiResponse = {
      menuHistory: [
        {
          id: duplicateId,
          title: 'データベースのメニュー',
          description: 'データベースから取得',
          createdAt: '2024-08-16T05:00:00.000Z',
        },
      ],
      count: 1,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockApiResponse,
    } as Response);

    const localStorageData = [
      {
        id: duplicateId,
        title: 'ローカルストレージのメニュー',
        description: 'ローカルストレージから取得',
        fileType: 'text/csv',
        createdAt: '2024-08-15T10:00:00.000Z',
      },
    ];
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(localStorageData));

    render(React.createElement(HistoryPage));

    await waitFor(() => {
      // データベースのメニューが表示される（優先される）
      expect(screen.getByText('データベースのメニュー')).toBeInTheDocument();
      // ローカルストレージのメニューは表示されない
      expect(screen.queryByText('ローカルストレージのメニュー')).not.toBeInTheDocument();
    });
  });

  test('データベースエラー時のフォールバック処理', async () => {
    // APIエラーをモック
    mockFetch.mockRejectedValueOnce(new Error('Database connection failed'));

    // ローカルストレージにデータがある
    const localStorageData = [
      {
        id: 'local_menu_123',
        title: 'ローカルメニュー',
        description: 'ローカルストレージのみ',
        fileType: 'text/csv',
        createdAt: '2024-08-15T10:00:00.000Z',
      },
    ];
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(localStorageData));

    render(React.createElement(HistoryPage));

    await waitFor(() => {
      // エラーメッセージが表示される
      expect(screen.getByText(/エラー:/)).toBeInTheDocument();
      expect(screen.getByText('ローカルストレージのデータのみ表示しています')).toBeInTheDocument();
      
      // ローカルストレージのデータは表示される
      expect(screen.getByText('ローカルメニュー')).toBeInTheDocument();
    });
  });

  test('履歴が空の場合の表示', async () => {
    // 空のAPIレスポンス
    const mockApiResponse = {
      menuHistory: [],
      count: 0,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockApiResponse,
    } as Response);

    // ローカルストレージも空
    mockLocalStorage.getItem.mockReturnValue('[]');

    render(React.createElement(HistoryPage));

    await waitFor(() => {
      expect(screen.getByText('過去のメニューはありません')).toBeInTheDocument();
    });
  });

  test('日付順ソート（新しい順）', async () => {
    const mockApiResponse = {
      menuHistory: [
        {
          id: 'menu_old',
          title: '古いメニュー',
          description: '古いメニュー',
          createdAt: '2024-08-14T05:00:00.000Z',
        },
        {
          id: 'menu_new',
          title: '新しいメニュー',
          description: '新しいメニュー',
          createdAt: '2024-08-16T05:00:00.000Z',
        },
      ],
      count: 2,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockApiResponse,
    } as Response);

    mockLocalStorage.getItem.mockReturnValue('[]');

    render(React.createElement(HistoryPage));

    await waitFor(() => {
      const menuTitles = screen.getAllByRole('heading', { level: 3 });
      // 新しいメニューが最初に表示される
      expect(menuTitles[0]).toHaveTextContent('新しいメニュー');
      expect(menuTitles[1]).toHaveTextContent('古いメニュー');
    });
  });

  test('APIレスポンスエラー時の処理', async () => {
    // HTTP 500エラーをモック
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Internal Server Error' }),
    } as Response);

    mockLocalStorage.getItem.mockReturnValue('[]');

    render(React.createElement(HistoryPage));

    await waitFor(() => {
      expect(screen.getByText(/エラー:/)).toBeInTheDocument();
    });
  });
});
