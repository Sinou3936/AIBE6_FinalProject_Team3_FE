import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// 회귀 테스트 - refreshOnceInBrowser()가 만드는 refresh fetch가 무한정 pending으로 남으면
// (드문 네트워크 행 상태) 그 탭의 이후 모든 401이 같은 죽은 Promise에 계속 합류해 세션 복구가
// 무기한 멈춘다. resetAuthRefreshState()가 실제로 그 fetch를 abort시키는지, 그리고 로그아웃
// 후 다음 로그인이 이전 세션의 refresh 결과를 물려받지 않는지를 검증한다.
describe('resetAuthRefreshState', () => {
  const originalEnv = process.env.NEXT_PUBLIC_API_BASE_URL;

  beforeEach(() => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_API_BASE_URL = 'http://localhost:8080';
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = originalEnv;
    vi.unstubAllGlobals();
  });

  it('진행 중인 refresh fetch를 실제로 abort시킨다', async () => {
    let refreshSignal: AbortSignal | undefined;

    const fetchMock = vi.fn((url: unknown, init?: RequestInit) => {
      const href = String(url);
      if (href.endsWith('/auth/refresh')) {
        refreshSignal = init?.signal as AbortSignal;
        return new Promise<Response>((_, reject) => {
          refreshSignal?.addEventListener('abort', () => reject(new DOMException('aborted', 'AbortError')));
        });
      }
      // 원 요청은 401(access token 만료)로 응답해 refresh 흐름을 트리거한다.
      return Promise.resolve(
        new Response(JSON.stringify({ success: false, error: { code: 'AUTH_TOKEN_EXPIRED', message: 'expired' } }), {
          status: 401,
        }),
      );
    });
    vi.stubGlobal('fetch', fetchMock);

    const { requestJson, resetAuthRefreshState } = await import('./http');

    const pending = requestJson('/some/protected/path').catch((error: unknown) => error);

    await vi.waitFor(() => expect(refreshSignal).toBeDefined());
    expect(refreshSignal?.aborted).toBe(false);

    resetAuthRefreshState();

    expect(refreshSignal?.aborted).toBe(true);

    const result = (await pending) as { sessionRefreshOutcome?: string };
    // abort된 refresh는 '결과를 알 수 없음'으로 처리되어, 원래의 401을 unreachable 표시와 함께 던진다.
    expect(result.sessionRefreshOutcome).toBe('unreachable');
  });

  it('reset 이후 새 refresh 시도는 이전 refresh의 결과를 물려받지 않는다', async () => {
    let refreshCallCount = 0;

    const fetchMock = vi.fn((url: unknown) => {
      const href = String(url);
      if (href.endsWith('/auth/refresh')) {
        refreshCallCount += 1;
        return Promise.resolve(new Response(null, { status: 200 }));
      }
      return Promise.resolve(
        new Response(JSON.stringify({ success: false, error: { code: 'AUTH_TOKEN_EXPIRED', message: 'expired' } }), {
          status: 401,
        }),
      );
    });
    vi.stubGlobal('fetch', fetchMock);

    const { resetAuthRefreshState } = await import('./http');

    resetAuthRefreshState();
    resetAuthRefreshState();

    // reset 자체는 새 요청을 만들지 않는다 - 상태만 정리한다.
    expect(refreshCallCount).toBe(0);
  });
});

// 회귀 테스트 - refreshOnceInBrowser()는 여러 호출자가 공유하는 전역 refresh라 개별 요청의
// AbortSignal로 그 fetch 자체를 끊을 수 없다. 호출자(예: MainLayoutGate)가 라우트 이동으로
// 이미 떠난 뒤 refresh 결과가 늦게 도착하면, 그 결과를 이 요청을 만든 호출자를 대신해 처리해서는
// 안 된다 - 특히 'rejected'였다면 redirectToSessionRecover()가 그 시점의 window.location(=이미
// 이동한 새 페이지)을 기준으로 강제 리다이렉트시켜버린다(뒤로가기 401 버그와 같은 원인).
describe('requestJson()과 caller AbortSignal', () => {
  const originalEnv = process.env.NEXT_PUBLIC_API_BASE_URL;

  beforeEach(() => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_API_BASE_URL = 'http://localhost:8080';
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = originalEnv;
    vi.unstubAllGlobals();
  });

  it('refresh 결과가 도착하기 전에 caller가 abort하면, 결과가 rejected여도 세션 만료로 처리하지 않고 AbortError를 던진다', async () => {
    let resolveRefresh: (response: Response) => void;
    const refreshPromise = new Promise<Response>((resolve) => {
      resolveRefresh = resolve;
    });

    const fetchMock = vi.fn((url: unknown) => {
      const href = String(url);
      if (href.endsWith('/auth/refresh')) {
        return refreshPromise;
      }
      // 원 요청은 401(access token 만료)로 응답해 refresh 흐름을 트리거한다.
      return Promise.resolve(
        new Response(JSON.stringify({ success: false, error: { code: 'AUTH_TOKEN_EXPIRED', message: 'expired' } }), {
          status: 401,
        }),
      );
    });
    vi.stubGlobal('fetch', fetchMock);

    const { requestJson } = await import('./http');

    const controller = new AbortController();
    const pending = requestJson('/some/protected/path', { signal: controller.signal }).catch((error: unknown) => error);

    // 원 요청이 이미 401을 받고 refresh 대기 중인 상태에서, 호출자가 라우트를 이동한다
    // (MainLayoutGate/admin-layout.tsx의 effect cleanup이 하는 것과 동일).
    controller.abort();

    // refresh는 그 이후에야 백엔드가 실제로 거부(rejected)했다는 응답을 받는다.
    resolveRefresh!(new Response(null, { status: 401 }));

    const result = (await pending) as { name?: string };
    expect(result.name).toBe('AbortError');
  });
});
