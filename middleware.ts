import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

function getAllowedOrigin(request: NextRequest): string | null {
  const origin = request.headers.get('origin');
  // Same-origin is always allowed
  const sameOrigin = request.nextUrl.origin;
  if (origin && origin === sameOrigin) return origin;

  const allowList = (process.env.CORS_ALLOW_ORIGINS || '')
    .split(',')
    .map(o => o.trim())
    .filter(Boolean);

  if (origin && allowList.includes(origin)) return origin;
  return null;
}

export function middleware(request: NextRequest) {
  const headers = new Headers();
  const allowedOrigin = getAllowedOrigin(request);

  if (allowedOrigin) {
    headers.set('Access-Control-Allow-Origin', allowedOrigin);
    headers.set('Vary', 'Origin');
  }
  headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (request.method === 'OPTIONS') {
    return new NextResponse(null, { status: 204, headers });
  }

  const response = NextResponse.next();
  headers.forEach((value, key) => response.headers.set(key, value));
  return response;
}

// ミドルウェアを適用するパスを指定
export const config = {
  matcher: '/api/:path*',
}
