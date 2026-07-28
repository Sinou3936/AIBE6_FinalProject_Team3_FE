# 인증(auth) 도메인 — Frontend 구현 현황 정리

## 배경 / 성격

Backend `docs/specs/auth-design.md`와 같은 성격의 **요구사항 명세서 대비 실제 구현 대조 문서**입니다. Backend가 API/토큰 발급·검증을 다룬다면, 이 문서는 그 API를 실제로 소비하는 **Frontend 쪽 구현**(로그인/회원가입 화면, 토큰 갱신 흐름, 인증 게이트, 에러 메시지)이 요구사항과 얼마나 일치하는지를 소스 코드 기준으로 확인합니다.

**범위**: `app/login`, `app/signup`, `app/oauth/callback`, `app/services/auth.ts`, `app/lib/api/http.ts`, `proxy.ts`, `app/(main)/layout.tsx`만 다룹니다. 토큰 서명/만료 검증 자체나 소셜 로그인 인가 코드 처리는 전부 Backend 책임이라 이 문서의 범위 밖입니다(Backend `auth-design.md` 참고).

## 주요 화면 / 파일

| 파일 | 역할 |
| --- | --- |
| `app/login/page.tsx` + `LoginFormClient.tsx` | 이메일 로그인 폼, 구글/카카오 로그인 링크, URL 에러 파라미터 → 한글 메시지 매핑 |
| `app/signup/page.tsx` + `SignupFormClient.tsx` | 이메일 회원가입 폼 |
| `app/oauth/callback/route.ts` | 소셜 로그인 성공 후 리다이렉트 목적지(온보딩/홈) 결정 |
| `app/services/auth.ts` | 로그인/회원가입/로그아웃/비밀번호 변경/`GET /auth/me` 호출 |
| `app/lib/api/http.ts` | 공통 fetch 래퍼(`requestJson`), 401 감지 후 자동 재발급 재시도, `refreshSession` |
| `proxy.ts` | Next.js 미들웨어 — 보호된 경로 진입 시 access_token 쿠키 존재 여부 확인, 없으면 refresh 시도 |
| `app/(main)/layout.tsx` | `GET /auth/me` 호출로 실제 세션 유효성 재확인, 실패 시 `/login?error=session_expired` |

## 이메일 회원가입 — 요구사항 대비

| 요구사항 | 실제 구현 |
| --- | --- |
| 이메일/비밀번호/닉네임 입력 → 가입 요청 | ✅ `SignupFormClient` → `POST /auth/signup` |
| 비밀번호 정책(8자 이상, 영문+숫자) 검증 | ⚠️ **클라이언트에서도 선제 검증하지만 최종 판단은 아님** — `<input pattern="(?=.*[A-Za-z])(?=.*\d)[\x21-\x7E]{8,72}">`로 브라우저 단에서 막지만, 실제 정책 판단은 백엔드 응답에 위임. FE 정규식이 백엔드 정책과 어긋나면 이중 실패 가능(남은 이슈 4번) |
| 성공 시 온보딩(프로필 등록) 화면으로 이동 | ✅ 가입 성공 시 무조건 `/mypage/profile`로 이동(방금 만든 계정이라 프로필이 없다고 가정) |
| 실패: 이메일 중복 / 비밀번호 정책 미충족 / 필수값 누락 | ⚠️ 사유별로 구분된 메시지가 아니라, 백엔드가 내려준 `ApiError.message`를 그대로 표시. 필수값 누락은 `required` 속성으로 애초에 제출 자체가 막힘 |

## 이메일 로그인 — 요구사항 대비

| 요구사항 | 실제 구현 |
| --- | --- |
| 이메일/비밀번호로 로그인 요청 | ✅ `LoginFormClient` → `POST /auth/login` |
| 성공 시 로그인 상태가 됨 | ✅ |
| (요구사항엔 없지만) 목적지 화면 분기 | ⚠️ **요구사항에 없는 추가 구현** — OAuth 콜백과 동일한 기준으로 `getMyProfile()` 확인 후 프로필 미등록이면 `/mypage/profile`, 등록돼 있으면 `/home`으로 분기. 요구사항 문서의 "이메일 로그인" 섹션엔 이 분기 언급이 없음(OAuth 섹션에만 있음) — 일관성을 위해 FE가 자체적으로 확장한 부분 |
| 실패: 존재하지 않는 이메일 / 비밀번호 불일치 / 소셜 전용 계정으로 이메일 로그인 시도 | ⚠️ 사유별 구분 없이 백엔드 메시지를 그대로 노출 |

## 소셜 로그인 (구글/카카오) — 요구사항 대비

| 요구사항 | 실제 구현 |
| --- | --- |
| 인증 코드 유효성 확인 / 제공자 사용자 정보 조회 / OAuthAccount 매칭 / 신규 생성 / 계정 연동 | Backend 책임 — FE는 `<a href={getGoogleLoginUrl()}>`로 백엔드 OAuth2 엔드포인트(`/oauth2/authorization/google`)로 브라우저를 그대로 보내는 것만 담당 |
| 성공: 신규 사용자는 온보딩, 기존 사용자는 홈으로 이동 | ✅ `oauth/callback/route.ts`가 `getCurrentUser` → `getMyProfile` 순으로 확인해 분기 |
| 실패: 인증 토큰 미발급 | ✅ 콜백에 `error` 쿼리 파라미터가 있으면 검증 없이 그대로 `/login?error=...`로 전달, `/login` 페이지가 `oauth_login_failed`를 한글 메시지로 매핑(그 외 값은 기본 문구로 폴백) |

## 토큰 검증 — 요구사항 대비

| 요구사항 | 실제 구현 |
| --- | --- |
| Access Token 서명/만료/사용자 상태 검증 | Backend 책임 — FE는 검증 로직 자체가 없음 |
| 실패 시 접근 제한 | ✅ 2단계로 구현: ① `proxy.ts`가 보호 경로 진입 시 `access_token` 쿠키 존재만 가볍게 확인 ② `(main)/layout.tsx`가 `GET /auth/me` 실제 호출로 최종 확인, 실패 시 `/login?error=session_expired` |
| 실패 사유 제공 | ⚠️ "토큰 없음/유효하지 않음/만료됨/비활성 사용자"를 FE가 구분해서 보여주지 않고, 전부 동일한 "로그인 세션을 확인할 수 없습니다" 문구로 뭉뚱그려짐(의도적으로 보안상 사유를 상세히 안 밝히는 쪽에 가까움 — 비기능요구사항의 "실패 사유 과다 노출 방지"와는 오히려 부합) |

## 토큰 재발급 — 요구사항 대비

| 요구사항 | 실제 구현 |
| --- | --- |
| Refresh Token 서명/만료만으로 검증(별도 저장소 조회 없음) | ✅ FE는 그냥 백엔드 `POST /auth/refresh` 응답을 신뢰 — FE 자체 저장소 없음 |
| 성공 시 새 Access Token 발급 | ✅ `refreshSession()`이 백엔드의 `Set-Cookie` 응답을 그대로 브라우저/재시도 요청에 반영 |
| 실패 시 재발급 안 되고 재로그인 요청 | ✅ `proxy.ts`에서 refresh 실패 시 `/login`으로 리다이렉트 |
| (사용성) Access Token 만료 시 자동 재발급 시도 | ⚠️ **화면 전환/Server Component 호출까지만 커버됨** — `proxy.ts`(페이지 이동 시)와 `requestJson`의 `retryAfterRefresh`(Server Component가 쿠키를 명시적으로 넘긴 호출)에서만 동작. **브라우저에서 발생하는 클라이언트 사이드 호출은 대상이 아님** — Refresh Token이 httpOnly라 JS가 값을 읽을 수 없어 원천적으로 재시도가 불가능하기 때문. `PasswordUpdateFormClient`만 `error.code === 'COMMON_401'`을 직접 감지해 재로그인으로 유도하는 개별 처리가 있고, 그 외 클라이언트 컴포넌트(예: 체크리스트 항목 토글)는 이 패턴이 없어 세션 도중 Access Token이 만료되면 그냥 일반 에러("저장하지 못했어요")로만 표시됨 (남은 이슈 2번) |

## 로그아웃 — 요구사항 대비

| 요구사항 | 실제 구현 |
| --- | --- |
| 클라이언트에 저장된 토큰 제거 | ✅(간접) — 토큰이 애초에 httpOnly 쿠키라 FE가 직접 지울 수 없고, `POST /auth/logout` 응답의 `Set-Cookie`로 백엔드가 지움. FE는 `logout()` 성공/실패와 무관하게 `finally`에서 항상 `/login`으로 이동해 사용자 상태를 확실히 로그아웃으로 되돌림 |

## 비기능 요구사항 — 대조

| 항목 | 요구사항 | 실제 |
| --- | --- | --- |
| Access/Refresh 만료 시간 분리 | O | Backend 책임, FE 범위 밖 |
| Refresh Token을 HttpOnly/Secure/SameSite 쿠키로 관리 | O | Backend 책임 — FE는 `credentials: 'include'`로 쿠키를 자동 첨부하는 것만 담당, 속성 자체는 확인 불가 |
| Refresh Token을 Local Storage에 저장하지 않음 | O | ✅ 전체 소스에 `localStorage`/`sessionStorage` 사용 자체가 없음(grep 확인) |
| 서명키/소셜 인증키를 소스코드에 미포함 | O | ✅ FE는 `NEXT_PUBLIC_KAKAO_MAP_APP_KEY`(지도용 공개 키)만 env로 노출하고, OAuth client secret/JWT 서명키는 애초에 FE에 존재하지 않음 |
| 인증 실패 사유 과다 노출 방지 | O | ⚠️ FE는 백엔드가 내려준 메시지를 그대로 표시만 함 — 메시지 수위 조절은 전적으로 백엔드 책임, FE 자체 필터링 없음 |
| 운영 환경 HTTPS | O | 배포 인프라 영역, FE 코드 범위 밖 |
| 이해 가능한 오류 메시지 | O | ⚠️ 부분적 — URL 파라미터 기반 에러(`oauth_login_failed`, `session_expired`)는 FE가 직접 한글 매핑(`ERROR_MESSAGES`), 로그인/회원가입 폼 실패는 백엔드 메시지 그대로 노출 |
| Access Token 만료 시 자동 재발급 시도 | O | ⚠️ 위 "토큰 재발급" 표 참고 — 화면 전환 시점만 커버, 클라이언트 사이드 호출 전반은 미커버 |
| Refresh Token까지 만료 시 재로그인 안내 | O | ✅ `/login`으로 리다이렉트 |
| 소셜 로그인 실패 시 재시도 가능 | O | ✅ `/login` 화면에 구글/카카오 버튼이 항상 노출돼 있어 실패해도 즉시 재시도 가능 |
| 소셜 로그인 장애 시 일관된 실패 응답 | O | FE는 `error` 쿼리 파라미터가 매핑 테이블에 없으면 기본 문구로 폴백 ✅ |
| 공통 인증 예외 형식 | O | ✅ `ApiError`(status, body.error) 하나로 모든 인증 실패를 통일 처리 |
| 동일 소셜 계정 중복 생성 방지 | O | Backend 책임, FE 범위 밖 |
| 불필요한 외부 API 호출 없이 토큰 검증 | O | FE는 토큰을 자체 검증하지 않고 항상 백엔드에 위임 — 범위 밖 |
| 인증 API 응답시간/실패율 모니터링 | O | Backend 인프라(Actuator/Prometheus) 영역, FE 범위 밖 |

## 요구사항에 없던 추가 구현

- **개발용 "관리자로 로그인" 버튼**(`DevLoginButton.tsx`, `devLogin()`) — `NEXT_PUBLIC_ENABLE_DEV_LOGIN=true`일 때만 렌더링. 백엔드가 `DEV_LOGIN_ENABLED=false`(운영 기본값)면 404를 반환해 운영에서는 무력화됨
- **`notice=account_linked` 안내 배너** — 소셜 로그인이 신규 계정이 아니라 기존 계정에 방금 연동됐을 때, 홈 화면에 안내를 띄우기 위해 콜백이 전달하는 파라미터. 외부에서 접근 가능한 콜백 진입점이라 허용된 값인지 화이트리스트 검증 후에만 전달
- **이메일 로그인에도 온보딩 분기 적용** — 요구사항 문서엔 소셜 로그인 섹션에만 있는 "신규는 온보딩, 기존은 홈" 분기를, 이메일 로그인에도 동일하게 적용(일관성 목적)

## 남은 이슈 / 확인 필요 총정리

1. **`proxy.ts`의 `matcher`에 `/checklists`(신규 "내 체크리스트 목록" 화면)가 빠져 있음** — `/checklist/:path*`만 등록돼 있고 복수형 경로는 매칭되지 않는다. `(main)/layout.tsx`가 모든 하위 화면에서 이중으로 `GET /auth/me`를 호출해 최종 인증을 확인하기 때문에 실제 보안 구멍은 아니지만, `/checklists`는 미들웨어 단계의 가벼운 쿠키 체크(+조기 refresh)를 건너뛰고 매번 무거운 API 호출로만 인증이 처리된다. 새 보호 라우트를 추가할 때 이 matcher 배열 갱신을 팀 체크리스트에 넣을 필요가 있음
2. **클라이언트 사이드 호출은 Access Token 자동 재발급 대상이 아님** — httpOnly 쿠키 구조상 근본적 한계. 체크리스트 항목 체크처럼 화면에 오래 머무는 동안 발생하는 호출이 대표 사례이며, 지금은 `PasswordUpdateFormClient`만 `COMMON_401`을 개별적으로 감지해 재로그인 유도하는 패턴을 갖고 있음(코드 주석에 "반복되면 공통 처리로 끌어올릴 것"이라고 이미 명시돼 있음)
3. **로그인/회원가입 실패 메시지가 백엔드 원문 그대로 노출됨** — "실패 사유를 보안상 과도하게 노출하지 않는다"는 요구사항 충족 여부가 전적으로 백엔드 메시지 내용에 달려 있고, FE 쪽엔 별도 필터링/일반화 로직이 없음
4. **비밀번호 정책이 FE(정규식)와 Backend 양쪽에 각각 하드코딩돼 있음** — 두 정책이 어긋나면 클라이언트 통과 후 서버에서 거부당하는 이중 실패를 사용자가 겪을 수 있음. 정책이 바뀌면 두 곳을 함께 수정해야 함
