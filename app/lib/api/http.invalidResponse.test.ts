import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// 회귀 테스트(2026-08-20) - fetch() 자체는 성공했지만 응답 본문이 JSON이 아닌 경우(리버스
// 프록시/로드밸런서가 만든 HTML 502/503 에러 페이지 등, 실제 app.sinou.site nginx 502 장애
// 이력 참고) 예전엔 'API response is not valid JSON.'라는 영어 문구가 그대로 사용자에게
// 노출됐다 - 다른 연결 실패 경로(NETWORK_ERROR_MESSAGE)와 동일한 한국어 안내가 나가야 한다.
describe('readApiResponse - JSON이 아닌 응답 본문', () => {
  const originalEnv = process.env.NEXT_PUBLIC_API_BASE_URL;

  beforeEach(() => {
    vi.resetModules();
    process.env.NEXT_PUBLIC_API_BASE_URL = 'http://localhost:8080';
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_API_BASE_URL = originalEnv;
    vi.unstubAllGlobals();
  });

  it('502와 함께 HTML 에러 페이지가 오면 네트워크 오류와 동일한 한국어 메시지를 던진다', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(new Response('<html>502 Bad Gateway</html>', { status: 502 })),
    );
    vi.stubGlobal('fetch', fetchMock);

    const { requestJson } = await import('./http');

    await expect(requestJson('/some/path')).rejects.toMatchObject({
      message: '서버와 통신할 수 없습니다. 잠시 후 다시 시도해 주세요.',
    });
  });
});
