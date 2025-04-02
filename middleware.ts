import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// next.config.mjs と同じ許可オリジンリスト
const allowedOrigins = [
  'https://swim-training-app.vercel.app',
  'https://swim-traing-app.vercel.app', // タイプミスのあるドメインも含む
  'http://localhost:3000',
];

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin');
  const isAllowedOrigin = origin && allowedOrigins.includes(origin);

  // APIルート以外はそのまま処理
  if (!request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  // OPTIONS (Preflight) リクエストの処理
  if (request.method === 'OPTIONS') {
    const headers = new Headers();
    headers.set('Access-Control-Allow-Credentials', 'true');
    headers.set('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    headers.set('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (isAllowedOrigin) {
      headers.set('Access-Control-Allow-Origin', origin);
    }

    return new NextResponse(null, { status: 204, headers });
  }

  // 通常のリクエストの処理
  const response = NextResponse.next();

  if (isAllowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
  }
  
  // 既存のヘッダーも保持しつつ、必要なヘッダーを追加・上書き
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  // Access-Control-Allow-Methods と Access-Control-Allow-Headers は Preflight で処理されるため、
  // 通常のリクエストレスポンスには必須ではないことが多いですが、念のため追加することも可能です。
  // response.headers.set('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  // response.headers.set('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');


  return response;
}

// ミドルウェアを適用するパスを指定
export const config = {
  matcher: '/api/:path*',
}
