'use client';

type SocialLoginLinksProps = {
  googleLoginUrl: string;
  kakaoLoginUrl: string;
  // 세션 만료/일시 장애로 온 경우 원래 있던 경로. OAuth 로그인은 구글/카카오로 리다이렉트됐다가
  // 돌아오므로 이 값을 쿼리스트링으로 들고 다닐 방법이 없다 — 대신 여기서 클릭 시점에 짧게 사는
  // 쿠키에 심어두고, app/oauth/callback/route.ts가 돌아온 뒤 그 쿠키를 읽어 소비한다.
  next?: string;
};

const OAUTH_NEXT_COOKIE = 'oauth_next';

export function SocialLoginLinks({ googleLoginUrl, kakaoLoginUrl, next }: SocialLoginLinksProps) {
  function rememberNext() {
    if (!next) {
      return;
    }
    // 민감 정보가 아닌 내부 경로 문자열이라 httpOnly가 필요 없다(애초에 클라이언트에서만 쓰고 쓸
    // 수도 있다). OAuth 왕복이 오래 걸릴 리 없으므로 5분이면 충분하고, 짧게 둬서 다음 로그인
    // 시도에 엉뚱하게 재사용되는 걸 방지한다.
    document.cookie = `${OAUTH_NEXT_COOKIE}=${encodeURIComponent(next)}; path=/; max-age=300; samesite=lax`;
  }

  return (
    <div className="flex flex-col gap-3">
      {/* onClick만으로는 가운데 클릭/새 탭에서 열기(click 대신 auxclick이 발생)에서 next가 조용히
          사라진다 — onAuxClick도 같이 걸어 어느 버튼으로 열든 쿠키가 남게 한다. */}
      <a
        href={googleLoginUrl}
        onClick={rememberNext}
        onAuxClick={rememberNext}
        className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-6 py-3 font-semibold text-slate-700 transition-colors hover:bg-slate-50"
      >
        구글로 로그인
      </a>
      <a
        href={kakaoLoginUrl}
        onClick={rememberNext}
        onAuxClick={rememberNext}
        className="flex items-center justify-center gap-2 rounded-lg bg-[#FEE500] px-6 py-3 font-semibold text-[#191919] transition-colors hover:bg-[#f5dc00]"
      >
        카카오로 로그인
      </a>
    </div>
  );
}
