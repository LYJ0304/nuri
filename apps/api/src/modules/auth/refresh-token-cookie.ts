import type { CookieOptions, Request, Response } from 'express';

export const REFRESH_TOKEN_COOKIE_NAME = 'nuri_refresh_token';

export function readRefreshTokenCookie(request: Request): string | undefined {
  const cookieHeader = request.headers.cookie;
  if (!cookieHeader) return undefined;

  for (const segment of cookieHeader.split(';')) {
    const separatorIndex = segment.indexOf('=');
    if (separatorIndex < 0) continue;

    const name = segment.slice(0, separatorIndex).trim();
    if (name !== REFRESH_TOKEN_COOKIE_NAME) continue;

    const value = segment.slice(separatorIndex + 1).trim();
    try {
      return decodeURIComponent(value);
    } catch {
      return undefined;
    }
  }

  return undefined;
}

export function clearRefreshTokenCookie(
  response: Response,
  secure: boolean,
): void {
  response.clearCookie(REFRESH_TOKEN_COOKIE_NAME, {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
  });
}

export function setRefreshTokenCookie(
  response: Response,
  refreshToken: string,
  expiresAt: Date,
  secure: boolean,
): void {
  const options: CookieOptions = {
    httpOnly: true,
    secure,
    sameSite: 'lax',
    path: '/',
    expires: expiresAt,
  };

  response.cookie(REFRESH_TOKEN_COOKIE_NAME, refreshToken, options);
}
