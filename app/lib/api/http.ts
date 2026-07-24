import { type ApiErrorBody, type ApiResponse } from '../../types/api';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, '');

const REFRESH_TOKEN_COOKIE = 'refresh_token';
const REFRESH_PATH = '/auth/refresh';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body?: ApiErrorBody | null,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function assertApiConfigured() {
  getApiBaseUrl();
}

export function getApiBaseUrl(): string {
  if (!API_BASE_URL) {
    throw new ApiError('NEXT_PUBLIC_API_BASE_URL is required when mock data is disabled.', 0);
  }

  return API_BASE_URL;
}

export async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = normalizeHeaders(init?.headers);
  const response = await fetch(`${getApiBaseUrl()}${path}`, { ...init, credentials: 'include', headers });

  if (response.status === 401 && path !== REFRESH_PATH) {
    const outcome = await retryAfterRefresh<T>(path, init, headers);
    if (outcome.attempted) {
      return outcome.value;
    }
  }

  return parseOrThrow<T>(response);
}

// "재시도를 안 했다"와 "재시도해서 정상적으로 falsy 값(void/null/false/0/'')을 받았다"를 구분해야 한다.
// retryAfterRefresh가 T | null을 돌려주면 두 경우가 구분이 안 돼서, void를 반환하는
// /auth/logout 같은 엔드포인트가 재시도에 성공해도 실패로 오인될 수 있다.
type RetryOutcome<T> = { attempted: true; value: T } | { attempted: false };

// HeadersInit은 plain object/배열/Headers 인스턴스 중 뭐든 될 수 있는데, {...init?.headers}로
// 스프레드하면 Headers 인스턴스나 배열은 조용히 빈 객체가 되어 헤더가 통째로 사라진다.
// new Headers(...)로 정규화해야 어떤 형태로 들어와도 안전하게 병합/조회할 수 있다.
function normalizeHeaders(initHeaders?: HeadersInit): Headers {
  const headers = new Headers(initHeaders);
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  return headers;
}

/**
 * 서버 컴포넌트에서 명시적으로 넘겨준 Cookie 헤더에 refresh_token 값이 있을 때만 재시도한다.
 * credentials:'include'로 브라우저가 자동 첨부하는 호출은 httpOnly라 JS로 쿠키 값을 읽을 수 없어
 * 여기서는 재시도 대상이 아니다.
 *
 * 지금 requestJson을 클라이언트 컴포넌트에서 직접 호출하는 사례는 `logout()`(`MainLayoutClient.tsx`),
 * `login()`(`LoginFormClient.tsx`), `signup()`(`SignupFormClient.tsx`), `updatePassword()`
 * (`PasswordUpdateFormClient.tsx`) 네 곳이다. 앞의 셋은 `POST /auth/{logout,login,signup}`으로
 * permitAll이고 인증 여부를 아예 안 보므로, 401이 나도 "자격 증명이 틀림"(login)이지 "Access Token
 * 만료"가 아니라 이 재시도 로직이 다루는 케이스를 받을 일이 없다.
 *
 * `updatePassword()`(`PATCH /auth/password`)는 다르다 — 인증이 필요한 엔드포인트라 페이지에 머무는
 * 동안 Access Token이 만료되면 실제로 이 401을 받는다. 이 함수(재시도)도 proxy.ts(페이지 이동
 * 시점에만 동작)도 이 케이스를 커버하지 못하므로, 대신 `PasswordUpdateFormClient`가 응답의
 * `error.code === 'COMMON_401'`을 직접 감지해 `/login?error=session_expired`로 보낸다 — 인증이
 * 필요한 다른 클라이언트 사이드 호출(예: 체크리스트 토글)도 새로 추가할 땐 같은 패턴을 따르거나,
 * 반복된다면 그때 가서 이 지점에 공통 처리로 끌어올릴 것.
 */
async function retryAfterRefresh<T>(
  path: string,
  init: RequestInit | undefined,
  headers: Headers,
): Promise<RetryOutcome<T>> {
  const cookieHeader = headers.get('Cookie');
  const refreshToken = extractCookieValue(cookieHeader, REFRESH_TOKEN_COOKIE);
  if (!refreshToken) {
    return { attempted: false };
  }

  const newCookies = await refreshSession(refreshToken);
  if (!newCookies) {
    return { attempted: false };
  }

  const retryHeaders = new Headers(headers);
  retryHeaders.set('Cookie', mergeCookieHeader(cookieHeader, newCookies));

  const retryResponse = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    credentials: 'include',
    headers: retryHeaders,
  });
  const value = await parseOrThrow<T>(retryResponse);
  return { attempted: true, value };
}

async function parseOrThrow<T>(response: Response): Promise<T> {
  const body = await readApiResponse<T>(response);

  if (!response.ok) {
    throw new ApiError(body.error?.message ?? `API request failed: ${response.status}`, response.status, body.error);
  }

  if (!body.success) {
    throw new ApiError(body.error?.message ?? 'API request failed.', response.status, body.error);
  }

  return body.data;
}

/**
 * Access Token 쿠키가 만료(브라우저가 자동 삭제)된 상태에서 Refresh Token으로 세션을 갱신한다.
 * 백엔드는 응답 바디 대신 Set-Cookie 헤더로 새 access_token/refresh_token을 내려주므로,
 * requestJson(바디만 반환) 대신 raw fetch로 응답 헤더를 그대로 반환한다 — 호출부(middleware,
 * retryAfterRefresh)가 이 값을 그대로 브라우저 응답/재시도 요청에 실어 보내야 실제로 반영된다.
 */
export async function refreshSession(refreshTokenCookieValue: string): Promise<string[] | null> {
  try {
    const response = await fetch(`${getApiBaseUrl()}${REFRESH_PATH}`, {
      method: 'POST',
      headers: { Cookie: `${REFRESH_TOKEN_COOKIE}=${refreshTokenCookieValue}` },
    });

    if (!response.ok) {
      return null;
    }

    // 미들웨어/Node 런타임에서는 지원되지만, 런타임에 따라 없을 수 있으니 안전하게 호출한다.
    const setCookies = response.headers.getSetCookie?.() ?? [];
    return setCookies.length > 0 ? setCookies : null;
  } catch {
    return null;
  }
}

export function extractCookieValue(cookieHeader: string | null | undefined, name: string): string | undefined {
  if (!cookieHeader) {
    return undefined;
  }

  for (const pair of cookieHeader.split(';')) {
    const separatorIndex = pair.indexOf('=');
    if (separatorIndex > 0 && pair.slice(0, separatorIndex).trim() === name) {
      return pair.slice(separatorIndex + 1).trim();
    }
  }

  return undefined;
}

// Set-Cookie 문자열 배열("access_token=xxx; Path=/; HttpOnly; ...")에서 name=value 쌍만 뽑아,
// 기존 Cookie 헤더에 병합한다(같은 이름이면 새 값으로 덮어씀).
export function mergeCookieHeader(existingCookieHeader: string | null | undefined, newSetCookies: string[]): string {
  const cookies = new Map<string, string>();

  for (const pair of existingCookieHeader?.split(';') ?? []) {
    const separatorIndex = pair.indexOf('=');
    if (separatorIndex > 0) {
      cookies.set(pair.slice(0, separatorIndex).trim(), pair.slice(separatorIndex + 1).trim());
    }
  }

  for (const setCookie of newSetCookies) {
    const pair = setCookie.split(';')[0] ?? '';
    const separatorIndex = pair.indexOf('=');
    if (separatorIndex > 0) {
      cookies.set(pair.slice(0, separatorIndex).trim(), pair.slice(separatorIndex + 1).trim());
    }
  }

  return Array.from(cookies.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join('; ');
}

async function readApiResponse<T>(response: Response): Promise<ApiResponse<T>> {
  try {
    return (await response.json()) as ApiResponse<T>;
  } catch {
    return {
      success: false,
      data: undefined as T,
      error: {
        code: 'INVALID_RESPONSE',
        message: 'API response is not valid JSON.',
      },
    };
  }
}
