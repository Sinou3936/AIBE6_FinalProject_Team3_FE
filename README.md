# 알고계약 (algogyeyak) — Frontend

사회초년생과 대학생을 위한 부동산 계약 안전 확인 서비스 프론트엔드입니다.

## Stack

- Next.js App Router
- TypeScript
- TailwindCSS
- React 18

## Getting Started

```bash
npm install
npm run dev
```

## Environment Variables

`.env.local`에 설정하는 `NEXT_PUBLIC_*` 변수 전체 목록입니다(전부 클라이언트 번들에 노출되므로 비밀값을 넣으면 안 됩니다).

| 변수 | 사용 위치 | 미설정 시 동작 | 설명 |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_API_BASE_URL` | `app/lib/api/http.ts` | mock 모드가 아니면 `getApiBaseUrl()`이 `ApiError`를 던짐 | Spring Boot 백엔드 origin. `/api` 접두사 없이 origin만(예: `http://localhost:8080`) |
| `NEXT_PUBLIC_USE_MOCK_DATA` | `app/config/dataSource.ts` | `'true'`가 아니면 항상 false로 취급(기본 false) | `true`면 `app/services`가 실 API 대신 `app/repositories` + `app/mocks/init`을 사용 |
| `NEXT_PUBLIC_KAKAO_MAP_APP_KEY` | `app/ui/KakaoMap.tsx` | 지도 대신 안내 fallback UI 표시 | 매물 상세 지도 표시용 Kakao Maps JavaScript 키 |
| `NEXT_PUBLIC_CROSS_ORIGIN_AUTH` | `app/config/auth.ts` | `'true'`가 아니면 false(기존 서버측 게이트 사용) | 프론트/백엔드가 등록 도메인을 공유하지 않는 배포(시나리오 C)에서만 `true`. 아래 Cross-origin 절 참고 |
| `NEXT_PUBLIC_ENABLE_DEV_LOGIN` | `app/DevLoginButton.tsx` | `'true'`가 아니면 버튼이 렌더링되지 않음(기본 비노출) | 로그인 화면에 "개발자용 관리자/일반회원 로그인" 버튼 노출. 아래 설명 참고 |

`NEXT_PUBLIC_API_BASE_URL`/`NEXT_PUBLIC_USE_MOCK_DATA`/`NEXT_PUBLIC_KAKAO_MAP_APP_KEY`/`NEXT_PUBLIC_CROSS_ORIGIN_AUTH`는 아래 각 절(Kakao Map/API Environment/Cross-origin)에서 더 자세히 설명합니다.

`NEXT_PUBLIC_ENABLE_DEV_LOGIN`은 값만으로는 버튼이 뜨지 않습니다 — 브라우저가 `<프론트주소>/#devkey=<secret>` 부트스트랩 링크를 한 번 방문해 그 key를 localStorage에 저장해둬야 합니다(`app/lib/devLoginKey.ts`). 그 key는 백엔드 `DEV_LOGIN_SECRET`과 일치해야 실제로 로그인되고, 값이 없거나 불일치하면 백엔드가 404로 거부합니다(프론트/백엔드 이중 방어). 로그아웃 시 저장된 key는 지워지지 않으므로 공유 기기에서는 `clearStoredDevLoginKey()` 호출 지점을 확인하세요.

## Architecture

`page.tsx`는 기본적으로 Server Component로 두고, 브라우저 상태(검색/필터, 탭 전환, 지도/차트 렌더링, optimistic update 등)가 필요한 부분만 `*Client.tsx`로 분리합니다. 화면은 `fetch`를 직접 호출하지 않고 항상 `app/services`를 거치는데, 이렇게 하면 백엔드 엔드포인트가 바뀌거나 mock ↔ 실 API 전환이 필요할 때 `services` 파일 하나만 고치면 되고 화면 컴포넌트는 도메인 타입(`app/types/domain.ts`)만 알면 됩니다. `app/types/api.ts`(백엔드 DTO)와 domain 타입을 분리해두는 이유도 같습니다 — 백엔드 필드명 변경이나 표시용 가공(Tailwind className 매핑 등)이 있어도 그 변화가 `app/mappers` 레이어에서 흡수되고 컴포넌트까지 전파되지 않습니다. 아래 "데이터 흐름" 다이어그램이 이 전체 그림입니다.

## Project Structure

```txt
app/
  (main)/        주요 화면 라우트와 공통 레이아웃 (마이페이지, 체크리스트, 계약분석, 관리자 등)
  api/           Route Handler (예: regions/sigungu, regions/eupmyeondong - 관심지역 3단 select용 지역 조회)
  config/        환경변수 기반 설정
  data/          화면 구성용 정적 데이터 (regions_nested.ts/sido.ts 등 지역 데이터 포함)
  lib/           공통 유틸리티와 API 클라이언트 (regionLookup.ts, contractResultStorage.ts 등)
  mappers/       API DTO -> domain 변환
  mocks/init/    개발 초기 mock DTO
  repositories/  mock 모드 데이터 제공
  services/      실제 API 호출 진입점
  types/         api/domain 타입
  ui/            공통 UI 컴포넌트 (KakaoMap, AddressSearchField 등)
```

각 폴더의 세부 규칙은 아래 Frontend Structure Guide 참고.

## Services

`app/services/*.ts` 파일 하나가 백엔드 도메인 하나에 대응합니다. mock 모드가 있는 서비스는 `useMockData` 분기로 같은 함수 안에서 실 API/mock을 나눕니다.

- **`auth.ts`** — 로그인/회원가입/소셜 로그인: `login`, `signup`, `logout`, `getCurrentUser`, `getGoogleLoginUrl`/`getKakaoLoginUrl`, `requestEmailVerification`/`confirmEmailVerification`, `requestPasswordReset`/`confirmPasswordReset`, `updatePassword`, `devLogin`. 세션/보안 흐름이라 mock 분기 없음.
- **`user.ts`** — 프로필: `getMyProfile`, `registerProfile`, `updateMyProfile`, `uploadProfileImage`/`resetProfileImage`(presigned S3 업로드), `checkNicknameAvailability`, `getNicknamePolicy`, `withdraw`.
- **`properties.ts`** — 매물 CRUD: `getProperties`(검색/필터/페이지네이션), `getPropertyById`, `createProperty`, `updateProperty`, `deleteProperty`, `reportProperty`.
- **`propertyImages.ts`** — 매물 이미지 업로드(presigned URL 발급 → S3 PUT → confirm 3단계): `uploadPropertyImage`.
- **`checklist.ts`** — 체크리스트: `createOrGetChecklist`(없으면 생성, 동시 호출 중복 방지), `getChecklistResult`, `updateChecklistItem`, `getMyChecklistOverviews`.
- **`contract-analysis.ts`** — 계약 특약사항 분석 4단계 파이프라인 + 이력: `submitContractInput`, `extractOcrText`, `maskContractText`, `analyzeContract`, `sendContractClauseQuestion`(조항별 미니 채팅), `getMyContractHistory`, `getContractHistoryClauses`, `deleteContractHistory`.
- **`risk-analysis.ts`** — 위험 신호/전세가율: `checkRiskSignals`, `getRiskSignals`, `getDepositSafety`, `recalculateDepositSafety`.
- **`region.ts`** — 관심지역 3단 select용 지역명 조회: `fetchSigunguOptions`, `fetchEupmyeondongOptions`(둘 다 `app/api/regions/*` Route Handler를 상대경로로 호출, 백엔드/mock 분기 없음).
- **`admin.ts`** — 관리자 조회(GET) 전용: `getAdminUsers`, `getAdminPropertyReports`, `getAdminDashboardStats`, `getAdminChecklistItemTemplates`, `getAdminChecklistTemplateImages`.
- **`adminActions.ts`** — 관리자 변경(mutation) 전용: `updateAdminUserRole`/`updateAdminUserStatus`/`bulkUpdateAdminUserStatus`, `reviewAdminPropertyReport`/`bulkReviewAdminPropertyReports`, `createAdminChecklistItemTemplate`/`updateAdminChecklistItemTemplate`/`deleteAdminChecklistItemTemplate`, `addAdminChecklistTemplateImage`/`deleteAdminChecklistTemplateImage`. `admin.ts`와 파일이 나뉜 이유는 admin 화면들이 전부 Client Component(크로스오리진 배포 대응)라 조회/변경을 파일 단위로 분리해 추적하기 쉽게 한 것.

마이페이지는 별도 `mypage.ts` 서비스 없이 `user.ts`/`properties.ts`/`checklist.ts`/`contract-analysis.ts`를 조합해서 씁니다(`app/(main)/mypage/page.tsx`, `ContractHistorySection.tsx` 참고).

## Client Components

`*Client.tsx`(및 브라우저 상태를 갖는 주요 컴포넌트)만 나열합니다 — 나머지는 Server Component입니다.

- `MainLayoutClient.tsx` / `MainLayoutGate.tsx` — 상단/하단 네비게이션, 로그아웃, crossOriginAuth 배포용 클라이언트 로그인 게이트
- `LoginFormClient.tsx` / `SignupFormClient.tsx` / `ForgotPasswordFormClient.tsx` / `ResetPasswordFormClient.tsx` / `PasswordUpdateFormClient.tsx` — 인증 폼
- `DevLoginButton.tsx` — 개발자용 관리자/일반회원 로그인 버튼(`NEXT_PUBLIC_ENABLE_DEV_LOGIN` 참고)
- `PropertiesClient.tsx` — 매물 목록 검색/필터/페이지네이션
- `PropertyDetailClient.tsx` — 매물 상세: 지도/차트/삭제/신고 모달 트리거
- `PropertyEditClient.tsx` — 매물 수정 폼
- `PropertyReportModal.tsx` / `PropertyDeleteConfirmModal.tsx` — 매물 신고/삭제 확인 모달
- `AddressSearchField.tsx`(`app/ui/`) — 매물 등록/수정 주소 입력, Daum(다음) 우편번호 팝업으로 존재하는 주소만 선택하게 강제
- `KakaoMap.tsx`(`app/ui/`) — 매물 위치 지도 렌더링
- `ChecklistClient.tsx` — 체크리스트 항목 체크/입력(optimistic update)
- `ChecklistOverviewClient.tsx` — 내 체크리스트 목록 카드
- `RiskAnalysisClient.tsx` — 위험 신호 확인 + 선순위보증금 입력으로 전세가율 재계산
- `ContractResultClient.tsx` — 마스킹 확인 → AI 분석 호출/로딩 → 결과 탭 전환·아코디언·조항별 미니 채팅
- `ProfileClient.tsx` — 프로필 등록/수정(관심지역 3단 select, 닉네임 중복확인)
- `MyPageClient.tsx` — 마이페이지 레이아웃(프로필 요약 + 하위 섹션 조합)
- `PropertyListSection.tsx` / `ContractHistorySection.tsx`(`app/(main)/mypage/`) — 마이페이지의 "내 매물 목록"/"계약분석 이력" 섹션, 각자 자기 페이지네이션 상태를 가짐
- `ContractHistoryDetailAccordion.tsx` / `ContractHistoryDeleteConfirmModal.tsx` — 계약분석 이력 항목의 위험 조항 아코디언, 삭제 확인 모달
- `WithdrawConfirmModal.tsx` — 회원 탈퇴 확인 모달
- `AdminDashboardClient.tsx` / `AdminNav.tsx` — 관리자 대시보드 통계, 관리자 네비게이션
- `AdminUsersClient.tsx` — 관리자: 유저 목록/역할·상태 변경(단건/일괄)
- `AdminReportsClient.tsx` — 관리자: 매물 신고 검토(단건/일괄)
- `AdminChecklistTemplatesClient.tsx` — 관리자: 체크리스트 문항 템플릿 CRUD + 예시 이미지 관리
- `PreviewClient.tsx` — 기능 미리보기 모달 트리거
- `OnboardingIntroModal.tsx` / `Modal.tsx`(`app/ui/`) — 공용 모달 베이스

## 주요 화면

```txt
/                          랜딩
/login                     로그인
/signup                    회원가입
/forgot-password           비밀번호 찾기
/reset-password            비밀번호 재설정
/oauth/callback            소셜 로그인 콜백(Route Handler)
/home                      홈
/checklists                내 체크리스트 목록(매물별 진행 상태)
/properties                매물 목록
/properties/register       매물 등록
/properties/[id]           매물 상세
/properties/[id]/edit      매물 수정
/properties/[id]/checklist 현장 체크리스트
/properties/[id]/risk-analysis  위험 신호 확인
/contract/upload           계약서 특약사항 입력/업로드
/contract/result           계약서 분석 결과
/mypage                    마이페이지(매물 목록, 계약분석 이력 - ContractHistorySection)
/mypage/profile            프로필 등록/수정(관심지역 시/도-시/군/구-읍/면/동 3단 select)
/mypage/password           비밀번호 변경
/admin, /admin/users, /admin/reports, /admin/checklists  관리자 대시보드/유저 관리/매물 신고 검토/체크리스트 템플릿 관리
/api/regions/sigungu       시/군/구 목록 조회 Route Handler
/api/regions/eupmyeondong  읍/면/동 목록 조회 Route Handler
```

## 데이터 흐름

```txt
page.tsx -> services -> requestJson -> Spring Boot API -> mapper -> domain -> component
```

mock 모드(`NEXT_PUBLIC_USE_MOCK_DATA=true`)는 `services` 대신 `repositories` -> `mocks/init`을 거칩니다.
지역(시/군/구, 읍/면/동) 조회는 예외적으로 백엔드를 타지 않고, 자체 Route Handler(`app/api/regions/*`)가
정적 데이터(`app/data/regions_nested.ts`)를 바로 내려줍니다.

## 문구 정책 (Wording Policy)

이 서비스는 확정적인 위험 판정, 안전 보장, 허위매물 단정을 내리지 않습니다 — 사실 기반·개수 기반 표현만 사용합니다.

피해야 할 표현: `안전합니다`, `위험 매물입니다`, `허위매물입니다`, `위험도`, `LOW`/`MEDIUM`/`HIGH` 등급, 점수화(예: `점수 80점`).

권장 표현: `확인 필요 신호 N개`, `전세가율 82%`, `시세보다 20% 낮은 가격이에요 — 이유를 확인해보세요`, `이 결과는 참고용 정보이며 안전을 보장하지 않습니다`.

UI 문구, 에러 메시지, mock 데이터 전부 이 기준을 따라야 합니다.

## Project Docs

- [Frontend Structure Guide](docs/FRONTEND_STRUCTURE.md): 작업 시작용 요약 문서
- [Frontend Structure Detail](docs/FRONTEND_STRUCTURE_DETAIL.md): API/mock 흐름, 타입, mapper, service 상세 기준

## Kakao Map

매물 위치 표시는 Kakao Maps JavaScript API를 사용합니다.

```bash
NEXT_PUBLIC_KAKAO_MAP_APP_KEY=your_kakao_javascript_key
```

이 값을 `.env.local`에 설정하면 지도가 표시됩니다. 값이 없으면 안내 fallback UI가 표시됩니다.

## API Environment

백엔드 API 주소와 mock 사용 여부는 다음 환경변수로 설정합니다.

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080
NEXT_PUBLIC_USE_MOCK_DATA=false
```

`NEXT_PUBLIC_USE_MOCK_DATA=true`로 설정한 경우에만 `app/mocks/init`의 초기 mock 데이터를 사용합니다.
기본 흐름은 Spring Boot API에서 데이터를 받는 구조입니다.

## Cross-origin 배포 (`NEXT_PUBLIC_CROSS_ORIGIN_AUTH`)

```bash
NEXT_PUBLIC_CROSS_ORIGIN_AUTH=false
```

프론트(Vercel 등)와 백엔드(EC2 등)가 등록 도메인을 전혀 공유하지 않는 배포(백엔드 README의 "시나리오
C")에서만 `true`로 설정합니다. `proxy.ts`/`(main)/layout.tsx`(Server Component)는 이 경우 백엔드가
발급한 access/refresh 쿠키를 받을 수 없어(쿠키는 발급 도메인에만 종속) 로그인 여부를 서버에서 판단하지
못합니다 — `true`로 설정하면 그 판단을 건너뛰고, 브라우저가 직접 크로스오리진
fetch(`credentials:'include'`)로 백엔드에 확인하는 클라이언트 게이트(`(main)/MainLayoutGate.tsx`)로
넘깁니다. 이때 백엔드는 `COOKIE_SAME_SITE=None` + `COOKIE_SECURE=true`로 배포돼 있어야 브라우저가
실제로 쿠키를 주고받습니다. 로컬 개발이나 서브도메인 공유 배포에서는 `false`(또는 미설정)로 두면 기존
서버측 게이트가 그대로 동작합니다.

API 응답은 다음 공통 포맷을 기준으로 unwrap합니다.

```ts
type ApiResponse<T> = {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
  } | null;
};
```

개발 서버 기본 주소는 `http://localhost:3000`입니다.

## Scripts

- `npm run dev`: Next.js 개발 서버 실행
- `npm run build`: 프로덕션 빌드 및 타입 검사
- `npm run lint`: ESLint 검사
- `npm run format:check`: Prettier 포맷 검사
- `npm run format`: Prettier 포맷 적용
- `npm run start`: 빌드 결과 실행
- `npm run test`: Vitest 테스트 실행
- `npm run test:watch`: Vitest watch 모드

## Testing

`vitest.config.ts` 설정: `environment: 'jsdom'`, `globals: true`(describe/it/expect를 import 없이 사용), `setupFiles: ['./vitest.setup.ts']`(`@testing-library/jest-dom/vitest` matcher 확장).

`app/` 전체에 26개의 `*.test.ts`/`*.test.tsx` 파일이 있고, 크게 세 영역을 다룹니다.

- `app/lib/**`(`nextPath`, `pageParam`, `devLoginKey`, `profile`, `useLogout`)와 `app/lib/api/**`(`http.refresh`, `http.invalidResponse`) — 순수 유틸/http 클라이언트 로직(refresh-then-retry 흐름, 세션 에러 분류 등)
- `app/services/auth.test.ts` — 서비스 함수
- 나머지(다수) — `*Client.tsx`/인증 폼/관리자 화면 등 `@testing-library/react` 기반 컴포넌트 테스트

## Backend Integration

Java 21, Spring Boot, JPA, MySQL 백엔드와 REST API 방식으로 연동하는 구조입니다.
