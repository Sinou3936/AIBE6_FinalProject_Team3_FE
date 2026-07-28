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

// 401을 받아도 여기서 자체적으로 refresh를 시도하지 않는다 — refresh는 백엔드에서 refresh token을
// 실제로 회전(rotate)시키는 상태 변경 작업인데, 이 함수는 브라우저로 나가는 최종 응답(Set-Cookie)에
// 접근할 방법이 없어 회전된 새 토큰을 브라우저 쿠키에 반영할 수 없다. 예전에는 여기서도 자체
// refresh를 시도해 그 요청 한 번은 성공시켰지만, 회전된 refresh token이 브라우저에 전달되지 않아
// 브라우저는 이미 무효화된 옛 토큰을 계속 들고 있다가 다음 refresh 시점에 세션이 끊기는 문제가
// 있었다. refresh는 이제 proxy.ts(미들웨어)에서만 수행한다 — 보호 라우트는 항상 미들웨어를 먼저
// 거치므로, 이 함수가 호출되는 시점엔 이미 유효한 access token이 쿠키에 있어야 정상이다.
export async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = normalizeHeaders(init?.headers);
  const response = await fetch(`${getApiBaseUrl()}${path}`, { ...init, credentials: 'include', headers });
  return parseOrThrow<T>(response);
}

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

// `updatePassword()`(`PATCH /auth/password`)처럼 인증이 필요한 엔드포인트를 클라이언트 컴포넌트에서
// 직접 호출하는 경우, 페이지에 머무는 동안 Access Token이 만료되면 이 함수가 401을 그대로 던진다.
// proxy.ts는 페이지 이동 시점에만 동작해 이 케이스를 커버하지 못하므로, 대신 `PasswordUpdateFormClient`가
// `error.code === 'UNAUTHORIZED'`을 직접 감지해 `/login?error=session_expired`로 보낸다 — 인증이 필요한
// 다른 클라이언트 사이드 호출을 새로 추가할 땐 같은 패턴을 따를 것.
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

// 'rejected'는 백엔드가 실제로 응답해서 이 Refresh Token을 거부한 경우(만료/무효 등)이고,
// 'unreachable'은 요청 자체가 실패해(네트워크 오류, 백엔드 일시 다운 등) 토큰 상태를 알 수 없는
// 경우다 — 호출부가 "무효 토큰이니 쿠키를 지워도 된다"와 "일시 장애라 쿠키는 그대로 둬야 한다"를
// 구분하려면 이 둘을 뭉뚱그리면 안 된다.
export type RefreshSessionOutcome =
  | { status: 'success'; cookies: string[] }
  | { status: 'rejected' }
  | { status: 'unreachable' };

/**
 * Access Token 쿠키가 만료(브라우저가 자동 삭제)된 상태에서 Refresh Token으로 세션을 갱신한다.
 * 백엔드는 응답 바디 대신 Set-Cookie 헤더로 새 access_token/refresh_token을 내려주므로,
 * requestJson(바디만 반환) 대신 raw fetch로 응답 헤더를 그대로 반환한다 — 호출부(middleware)가
 * 이 값을 그대로 브라우저 응답에 실어 보내야 실제로 반영된다.
 */
export async function refreshSession(refreshTokenCookieValue: string): Promise<RefreshSessionOutcome> {
  let response: Response;
  try {
    response = await fetch(`${getApiBaseUrl()}${REFRESH_PATH}`, {
      method: 'POST',
      headers: { Cookie: `${REFRESH_TOKEN_COOKIE}=${refreshTokenCookieValue}` },
    });
  } catch {
    return { status: 'unreachable' };
  }

  if (!response.ok) {
    return { status: 'rejected' };
  }

  // 미들웨어/Node 런타임에서는 지원되지만, 런타임에 따라 없을 수 있으니 안전하게 호출한다.
  const setCookies = response.headers.getSetCookie?.() ?? [];
  return setCookies.length > 0 ? { status: 'success', cookies: setCookies } : { status: 'rejected' };
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
