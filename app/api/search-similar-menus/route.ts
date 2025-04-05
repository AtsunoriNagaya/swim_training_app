import { NextRequest, NextResponse } from 'next/server';
import { searchSimilarMenus } from '@/lib/kv-storage';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, duration } = body;

    if (!query || !duration) {
      return NextResponse.json(
        { error: '検索クエリと時間の指定が必要です' },
        { status: 400 }
      );
    }

    // 類似メニューを検索
    const similarMenus = await searchSimilarMenus(query, parseInt(duration));

    return NextResponse.json({
      menus: similarMenus
    });
  } catch (error) {
    console.error('[API] 類似メニュー検索エラー:', error);
    return NextResponse.json(
      { error: '類似メニューの検索中にエラーが発生しました' },
      { status: 500 }
    );
  }
}
