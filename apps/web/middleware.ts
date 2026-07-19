import { NextResponse, type NextRequest } from 'next/server';

const REFRESH_COOKIE = 'nuri_refresh_token';

export function middleware(request: NextRequest) {
  if (request.cookies.has(REFRESH_COOKIE)) return NextResponse.next();
  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('next', request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/', '/clients/:path*', '/records/:path*'],
};
