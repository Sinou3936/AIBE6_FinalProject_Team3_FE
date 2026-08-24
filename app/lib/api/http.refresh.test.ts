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

  // 회귀 테스트(2026-08-20 전수조사) - 원래 이 테스트는 resetAuthRefreshState()만 두 번 호출하고
  // refreshCallCount가 0인지만 확인했다 - requestJson()을 한 번도 안 거쳐 실제 refresh 자체를
  // 구동하지 않으므로, resetAuthRefreshState()를 빈 함수로 바꿔도 그대로 통과했다. 실제로 refresh를
  // 한 번 완주시킨 뒤 reset하고, 두 번째 refresh가 첫 번째의 캐시된 상태를 물려받지 않고 독립적으로
  // 다시 실행되는지 끝까지 확인한다.
  it('reset 이후 새 refresh 시도는 이전 refresh의 결과를 물려받지 않는다', async () => {
    let refreshCallCount = 0;
    let protectedCallCount = 0;

    const fetchMock = vi.fn((url: unknown) => {
      const href = String(url);
      if (href.endsWith('/auth/refresh')) {
        refreshCallCount += 1;
        return Promise.resolve(new Response(null, { status: 200 }));
      }
      protectedCallCount += 1;
      // 각 requestJson() 사이클은 최초 요청(홀수 번째 - 만료된 access token으로 401)과 refresh
      // 성공 후 재시도(짝수 번째 - 새 access token으로 성공) 두 번의 protected 호출로 이뤄진다.
      const isInitialRequestOfCycle = protectedCallCount % 2 === 1;
      if (isInitialRequestOfCycle) {
        return Promise.resolve(
          new Response(JSON.stringify({ success: false, error: { code: 'AUTH_TOKEN_EXPIRED', message: 'expired' } }), {
            status: 401,
          }),
        );
      }
      return Promise.resolve(new Response(JSON.stringify({ success: true, data: { ok: true } }), { status: 200 }));
    });
    vi.stubGlobal('fetch', fetchMock);

    const { requestJson, resetAuthRefreshState } = await import('./http');

    const first = await requestJson<{ ok: boolean }>('/some/protected/path');
    expect(first).toEqual({ ok: true });
    expect(refreshCallCount).toBe(1);

    resetAuthRefreshState();
    resetAuthRefreshState();

    // reset 자체는 새 요청을 만들지 않는다 - 상태만 정리한다.
    expect(refreshCallCount).toBe(1);

    const second = await requestJson<{ ok: boolean }>('/some/protected/path');
    expect(second).toEqual({ ok: true });
    // reset 이후 두 번째 refresh는 첫 번째가 남긴 lastRefreshSucceededAt/refreshInFlight 상태를
    // 물려받지 않고 독립적으로 다시 실행돼야 한다 - 캐시된 결과로 스킵됐다면 이 값이 1에 머문다.
    expect(refreshCallCount).toBe(2);
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

// 회귀 테스트 - AbortSignal.any/AbortSignal.timeout는 비교적 최신 API라, 이를 지원하지 않는
// 런타임에서는 refreshOnceInBrowser()가 이 조합을 만드는 시점에 동기적으로 예외를 던져 자동
// 갱신 흐름 전체가 깨지고 모든 401이 강제 재로그인으로 떨어질 수 있었다. 무한 대기 타임아웃
// 보호는 잃더라도 refresh-then-retry 자체는 계속 동작해야 한다.
describe('AbortSignal.any 미지원 환경 폴백', () => {
  const originalEnv = process.env.NEXT_PUBLIC_API_BASE_URL;
  const originalAbortSignalAny = AbortSignal.any;

  beforeEach(() => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_API_BASE_URL = 'http://localhost:8080';
    // 일부 런타임엔 AbortSignal.any 자체가 없거나(구형 Node/브라우저), 있어도 이 조합에서 던지는
    // 경우와 동일한 실패 양상이므로 던지도록 스텁해 폴백 경로를 검증한다.
    AbortSignal.any = () => {
      throw new TypeError('AbortSignal.any is not supported');
    };
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = originalEnv;
    AbortSignal.any = originalAbortSignalAny;
    vi.unstubAllGlobals();
  });

  it('AbortSignal.any가 없어도 refresh-then-retry 흐름이 정상 동작한다', async () => {
    let protectedPathCallCount = 0;

    const fetchMock = vi.fn((url: unknown) => {
      const href = String(url);
      if (href.endsWith('/auth/refresh')) {
        return Promise.resolve(new Response(null, { status: 200 }));
      }
      protectedPathCallCount += 1;
      if (protectedPathCallCount === 1) {
        // 최초 요청은 만료된 access token으로 401을 받는다 - refresh 흐름을 트리거한다.
        return Promise.resolve(
          new Response(JSON.stringify({ success: false, error: { code: 'AUTH_TOKEN_EXPIRED', message: 'expired' } }), {
            status: 401,
          }),
        );
      }
      // refresh 성공 후 재시도는 새 access token으로 정상 응답을 받는다.
      return Promise.resolve(new Response(JSON.stringify({ success: true, data: { ok: true } }), { status: 200 }));
    });
    vi.stubGlobal('fetch', fetchMock);

    const { requestJson } = await import('./http');

    const result = await requestJson<{ ok: boolean }>('/some/protected/path');

    expect(result).toEqual({ ok: true });
    expect(protectedPathCallCount).toBe(2);
  });
});

// 회귀/커버리지 테스트(2026-08-20) - 두 요청(A/B)이 거의 동시에 401을 받았는데 A의 refresh가 먼저
// 끝나 성공한 뒤에야 B의 401이 뒤늦게 도착하면, requestJson()은 B를 위해 refreshOnceInBrowser()를
// 다시 부르지 않고 lastRefreshSucceededAt과 비교해 바로 재시도만 한다(위 requestJson() 안의
// `requestStartedAt < lastRefreshSucceededAt` 분기). 이 분기 자체는 지금까지 직접 구동하는
// 테스트가 없었다 - 로직은 맞아 보였지만(다른 분기들과 대칭적인 단일 재시도 구조), 실제로 두
// 요청을 겹쳐 구동해서 (1) refresh가 정확히 한 번만 나가는지 (2) 뒤늦게 도착한 B가 정상적으로
// 재시도에 성공하는지를 검증한다.
describe('이미 다른 요청이 refresh를 끝낸 뒤 늦게 도착한 401', () => {
  const originalEnv = process.env.NEXT_PUBLIC_API_BASE_URL;

  beforeEach(() => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_API_BASE_URL = 'http://localhost:8080';
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = originalEnv;
    vi.unstubAllGlobals();
  });

  it('refreshOnceInBrowser()를 다시 부르지 않고 바로 재시도만 한다', async () => {
    let resolveBFirstResponse: (response: Response) => void;
    const bFirstResponsePromise = new Promise<Response>((resolve) => {
      resolveBFirstResponse = resolve;
    });
    let refreshCallCount = 0;
    let protectedCallCount = 0;

    const fetchMock = vi.fn((url: unknown) => {
      const href = String(url);
      if (href.endsWith('/auth/refresh')) {
        refreshCallCount += 1;
        return Promise.resolve(new Response(null, { status: 200 }));
      }
      protectedCallCount += 1;
      if (protectedCallCount === 1) {
        // B의 최초 요청 - A가 refresh를 끝낼 때까지 응답을 붙잡아둔다(뒤늦게 도착시키기 위함).
        return bFirstResponsePromise;
      }
      if (protectedCallCount === 2) {
        // A의 최초 요청 - 곧바로 401을 받아 refresh를 트리거한다.
        return Promise.resolve(
          new Response(JSON.stringify({ success: false, error: { code: 'AUTH_TOKEN_EXPIRED', message: 'expired' } }), {
            status: 401,
          }),
        );
      }
      // A의 재시도, 그리고 나중의 B의 재시도 - 새 access token으로 정상 응답을 받는다.
      return Promise.resolve(new Response(JSON.stringify({ success: true, data: { who: 'retry' } }), { status: 200 }));
    });
    vi.stubGlobal('fetch', fetchMock);

    const { requestJson } = await import('./http');

    // B가 먼저 요청을 시작한다(requestStartedAt이 A보다 이르다) - 응답은 아직 안 옴.
    const bPromise = requestJson<{ who: string }>('/some/protected/path-b');
    // B의 fetch가 실제로 호출된 뒤에 A를 시작해야 호출 순서(1=B, 2=A)가 보장된다.
    await vi.waitFor(() => expect(protectedCallCount).toBe(1));
    // requestStartedAt은 Date.now() 밀리초 단위라, 실제 시간차 없이 바로 이어서 실행하면 B의
    // requestStartedAt과 A의 refresh 성공 시각(lastRefreshSucceededAt)이 같은 밀리초로 찍혀
    // `<` 비교가 false가 될 수 있다(둘 다 만들어지는 데 실제로 몇 ms는 걸린다는 전제가 깨짐) -
    // 최소 몇 ms의 실제 간격을 둬 이 분기가 실제 운영 환경처럼 "이후"로 판정되게 한다.
    await new Promise((resolve) => setTimeout(resolve, 5));

    // A는 이 시점 이후에 시작해 곧바로 401 -> refresh -> 재시도까지 전부 끝낸다.
    const aResult = await requestJson<{ who: string }>('/some/protected/path-a');
    expect(aResult).toEqual({ who: 'retry' });
    expect(refreshCallCount).toBe(1);

    // A의 refresh 성공 이후에야 B의 최초 요청이 401로 뒤늦게 도착한다.
    resolveBFirstResponse!(
      new Response(JSON.stringify({ success: false, error: { code: 'AUTH_TOKEN_EXPIRED', message: 'expired' } }), {
        status: 401,
      }),
    );

    const bResult = await bPromise;
    expect(bResult).toEqual({ who: 'retry' });
    // B 때문에 refresh가 한 번 더 나가면 안 된다 - A의 refresh 성공 결과를 그대로 재사용해야 한다.
    expect(refreshCallCount).toBe(1);
  });

  // 회귀 테스트(2026-08-24) - 위 테스트는 `setTimeout(5)`로 requestStartedAt과 lastRefreshSucceededAt이
  // 같은 밀리초로 찍히는 경우를 일부러 피해갔다. 실제로는 두 값이 동률(tie)일 수 있는데,
  // `requestStartedAt < lastRefreshSucceededAt`(엄격한 비교)이면 이 동률에서 false가 되어 B가
  // 불필요한 두 번째 refresh를 또 시작한다 - 여기서는 Date.now()를 고정해 동률을 강제로 재현하고,
  // `<=`로 바뀐 뒤에는 refresh가 여전히 한 번만 나가는지 검증한다.
  it('requestStartedAt과 lastRefreshSucceededAt이 같은 밀리초여도 refresh를 중복 호출하지 않는다', async () => {
    const fixedNow = 1_700_000_000_000;
    vi.spyOn(Date, 'now').mockReturnValue(fixedNow);

    let resolveBFirstResponse: (response: Response) => void;
    const bFirstResponsePromise = new Promise<Response>((resolve) => {
      resolveBFirstResponse = resolve;
    });
    let refreshCallCount = 0;
    let protectedCallCount = 0;

    const fetchMock = vi.fn((url: unknown) => {
      const href = String(url);
      if (href.endsWith('/auth/refresh')) {
        refreshCallCount += 1;
        return Promise.resolve(new Response(null, { status: 200 }));
      }
      protectedCallCount += 1;
      if (protectedCallCount === 1) {
        return bFirstResponsePromise;
      }
      if (protectedCallCount === 2) {
        return Promise.resolve(
          new Response(JSON.stringify({ success: false, error: { code: 'AUTH_TOKEN_EXPIRED', message: 'expired' } }), {
            status: 401,
          }),
        );
      }
      return Promise.resolve(new Response(JSON.stringify({ success: true, data: { who: 'retry' } }), { status: 200 }));
    });
    vi.stubGlobal('fetch', fetchMock);

    const { requestJson } = await import('./http');

    // B의 requestStartedAt과 A의 refresh 성공 시각(lastRefreshSucceededAt)이 fixedNow로 완전히 같다.
    const bPromise = requestJson<{ who: string }>('/some/protected/path-b');
    await vi.waitFor(() => expect(protectedCallCount).toBe(1));

    const aResult = await requestJson<{ who: string }>('/some/protected/path-a');
    expect(aResult).toEqual({ who: 'retry' });
    expect(refreshCallCount).toBe(1);

    resolveBFirstResponse!(
      new Response(JSON.stringify({ success: false, error: { code: 'AUTH_TOKEN_EXPIRED', message: 'expired' } }), {
        status: 401,
      }),
    );

    const bResult = await bPromise;
    expect(bResult).toEqual({ who: 'retry' });
    // 동률이어도 B가 refresh를 또 트리거하면 안 된다 - 트리거했다면 토큰 회전 경합으로 정상
    // 세션인데 강제 로그아웃되는 시나리오로 이어진다.
    expect(refreshCallCount).toBe(1);
  });
});
