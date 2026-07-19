import {
  AuthenticatedUserSchema,
  AuthTokenResponseSchema,
  type AuthUser,
} from '@nuri/contracts';

export const API_BASE_URL = '/api';

let accessToken: string | null = null;
let refreshRequest: Promise<AuthUser | null> | null = null;

export function clearAccessToken(): void {
  accessToken = null;
}

export async function refreshAccessToken(): Promise<AuthUser | null> {
  if (refreshRequest) return refreshRequest;

  refreshRequest = fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    credentials: 'include',
  })
    .then(async (response) => {
      if (!response.ok) return null;
      const parsed = AuthTokenResponseSchema.safeParse(await response.json());
      if (!parsed.success) return null;
      accessToken = parsed.data.accessToken;
      return parsed.data.user;
    })
    .catch(() => null)
    .finally(() => {
      refreshRequest = null;
    });

  const user = await refreshRequest;
  if (!user) clearAccessToken();
  return user;
}

export async function apiFetch(
  path: string,
  init: RequestInit = {},
  retryUnauthorized = true,
): Promise<Response> {
  const headers = new Headers(init.headers);
  if (accessToken) headers.set('Authorization', `Bearer ${accessToken}`);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  });
  if (response.status !== 401 || !retryUnauthorized) return response;

  const user = await refreshAccessToken();
  if (!user) {
    if (typeof window !== 'undefined') window.location.assign('/login');
    return response;
  }
  return apiFetch(path, init, false);
}

export async function fetchAuthenticatedUser(): Promise<AuthUser | null> {
  const response = await apiFetch('/auth/me');
  if (!response.ok) return null;
  const parsed = AuthenticatedUserSchema.safeParse(await response.json());
  return parsed.success
    ? { id: parsed.data.userId, email: parsed.data.email }
    : null;
}

export async function signIn(email: string, password: string): Promise<AuthUser> {
  const response = await fetch(`${API_BASE_URL}/auth/sign-in`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (!response.ok) throw new Error('이메일 또는 비밀번호를 확인해 주세요.');

  const parsed = AuthTokenResponseSchema.safeParse(await response.json());
  if (!parsed.success) throw new Error('로그인 응답을 확인할 수 없습니다.');
  accessToken = parsed.data.accessToken;
  return parsed.data.user;
}

export async function signOut(): Promise<void> {
  try {
    await fetch(`${API_BASE_URL}/auth/sign-out`, {
      method: 'POST',
      credentials: 'include',
    });
  } finally {
    clearAccessToken();
  }
}
