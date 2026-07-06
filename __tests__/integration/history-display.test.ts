import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { jest } from '@jest/globals';
import React from 'react';
import HistoryPage from '../../app/history/page';

// fetchをモック
// setup.ts の msw サーバーが beforeAll で global.fetch を差し替えるため、
// それより後に実行される beforeEach で毎回モックを代入し直す
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe('History Display Integration (IT-005)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = mockFetch;
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

    // タイトルが結果ページへのリンクになっていることを確認
    const menuLink = screen.getByRole('link', { name: '高強度の60分トレーニングメニュー' });
    expect(menuLink).toHaveAttribute('href', '/result?id=menu_1234567890_abc123');
  });

  test('アップロードメニューは専用ページへのリンクとファイル情報を表示する', async () => {
    const mockApiResponse = {
      menuHistory: [
        {
          id: 'menu_ai_generated',
          title: 'AI生成メニュー',
          description: 'AI生成メニュー: 高強度 60分',
          createdAt: '2024-08-16T05:00:00.000Z',
        },
        {
          id: 'upload_file_123',
          title: 'アップロードされたメニュー',
          description: 'CSVファイルからアップロード',
          fileType: 'text/csv',
          fileSize: '2KB',
          createdAt: '2024-08-14T10:00:00.000Z',
          content: 'メニュー内容...',
        },
      ],
      count: 2,
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockApiResponse,
    } as Response);

    render(React.createElement(HistoryPage));

    await waitFor(() => {
      expect(screen.getByText('AI生成メニュー')).toBeInTheDocument();
      expect(screen.getByText('アップロードされたメニュー')).toBeInTheDocument();
    });

    // AI生成とアップロードのバッジが正しく表示されることを確認
    expect(screen.getByText('AI生成')).toBeInTheDocument();
    expect(screen.getByText('アップロード')).toBeInTheDocument();

    // アップロードメニューは専用ページへのリンクになる
    const uploadLink = screen.getByRole('link', { name: 'アップロードされたメニュー' });
    expect(uploadLink).toHaveAttribute('href', '/upload-result?id=upload_file_123');

    // アップロードファイルにはファイル情報が表示される
    expect(screen.getByText('ファイル形式: CSV')).toBeInTheDocument();
    expect(screen.getByText('ファイルサイズ: 2KB')).toBeInTheDocument();
  });

  test('取得エラー時にエラー表示と再試行ボタンが表示される', async () => {
    // APIエラーをモック
    mockFetch.mockRejectedValueOnce(new Error('Database connection failed'));

    render(React.createElement(HistoryPage));

    await waitFor(() => {
      // エラーメッセージが表示される
      expect(screen.getByText(/エラー:/)).toBeInTheDocument();
    });
    expect(screen.getByText('Database connection failed')).toBeInTheDocument();

    // 再試行すると履歴が再取得される
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        menuHistory: [
          {
            id: 'menu_recovered',
            title: '復旧後のメニュー',
            description: '再試行で取得',
            createdAt: '2024-08-16T05:00:00.000Z',
          },
        ],
        count: 1,
      }),
    } as Response);

    fireEvent.click(screen.getByRole('button', { name: '再試行' }));

    await waitFor(() => {
      expect(screen.getByText('復旧後のメニュー')).toBeInTheDocument();
    });
    expect(screen.queryByText(/エラー:/)).not.toBeInTheDocument();
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

    render(React.createElement(HistoryPage));

    await waitFor(() => {
      expect(screen.getByText('過去のメニューはありません')).toBeInTheDocument();
    });

    // メニュー作成への導線が表示される
    expect(screen.getByRole('link', { name: 'メニューを作成する' })).toHaveAttribute('href', '/create');
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

    render(React.createElement(HistoryPage));

    await waitFor(() => {
      expect(screen.getByText(/エラー:/)).toBeInTheDocument();
    });
  });

  test('削除ダイアログの確認フロー（キャンセル→確認削除）', async () => {
    const mockApiResponse = {
      menuHistory: [
        {
          id: 'menu_del_1',
          title: '削除対象メニュー',
          description: '削除テスト用',
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

    render(React.createElement(HistoryPage));

    await waitFor(() => {
      expect(screen.getByText('削除対象メニュー')).toBeInTheDocument();
    });

    // 削除ボタンで確認ダイアログが開く
    fireEvent.click(screen.getByRole('button', { name: '「削除対象メニュー」を削除' }));
    expect(await screen.findByText('メニューを削除しますか？')).toBeInTheDocument();
    expect(screen.getByText('「削除対象メニュー」を削除します。この操作は取り消せません。')).toBeInTheDocument();

    // キャンセルするとダイアログが閉じ、削除APIは呼ばれない
    fireEvent.click(screen.getByRole('button', { name: 'キャンセル' }));
    await waitFor(() => {
      expect(screen.queryByText('メニューを削除しますか？')).not.toBeInTheDocument();
    });
    expect(mockFetch).toHaveBeenCalledTimes(1); // 初回の履歴取得のみ
    expect(screen.getByText('削除対象メニュー')).toBeInTheDocument();

    // 再度開いて「削除する」を押すと DELETE が呼ばれ、カードが消える
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    } as Response);

    fireEvent.click(screen.getByRole('button', { name: '「削除対象メニュー」を削除' }));
    fireEvent.click(await screen.findByRole('button', { name: '削除する' }));

    await waitFor(() => {
      expect(screen.queryByText('削除対象メニュー')).not.toBeInTheDocument();
    });
    expect(mockFetch).toHaveBeenCalledWith('/api/delete-menu?id=menu_del_1', { method: 'DELETE' });
  });
});
