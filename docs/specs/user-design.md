# 사용자(user) 도메인 — Frontend 구현 현황 정리

## 배경 / 성격

`auth-design.md`와 같은 성격의 **요구사항 명세서 대비 실제 구현 대조 문서**입니다. User 도메인은 프로필 등록/조회/수정/탈퇴와, 그 정보(특히 `currentStage`)를 홈 화면 우선순위 노출에 쓰는 부분까지 포함하므로 `/mypage/*`뿐 아니라 `/home`도 같이 확인했습니다.

**범위**: `app/(main)/mypage/profile`, `app/(main)/mypage/MyPageClient.tsx`, `app/(main)/home/page.tsx`, `app/services/user.ts`, `app/mappers/user.ts`, `app/lib/priorityAction.ts`만 다룹니다. 비밀번호 설정/변경은 Auth 쪽 문서(`auth-design.md`)에서 이미 다뤘으므로 여기서는 제외합니다.

## 주요 화면 / 파일

| 파일 | 역할 |
| --- | --- |
| `app/(main)/mypage/profile/page.tsx` + `ProfileClient.tsx` | 프로필 등록(온보딩)/수정 폼 — 하나의 컴포넌트가 `mode`로 분기 |
| `app/(main)/mypage/page.tsx` + `MyPageClient.tsx` | 프로필 조회, 로그아웃, 회원 탈퇴. **(2026-08-11 완료)** 탈퇴는 `WithdrawConfirmModal.tsx`(같은 디렉터리, `PropertyDeleteConfirmModal.tsx`와 동일 패턴)로 확인 후 실행 |
| `app/(main)/home/page.tsx` + `app/lib/priorityAction.ts` | `currentStage` 기반 홈 화면 우선 안내 카드. **(2026-07-29)** 체크리스트 상태 판단에 checklist 도메인의 `app/services/checklist.ts`(`getMyChecklistOverviews`)도 함께 사용하게 됨 — user 도메인 문서지만 참고용으로 명시 |
| `app/services/user.ts` | `GET /users/me`, `POST /users/me/profile`, `PATCH /users/me`, `GET /users/nickname-check` 호출. **(2026-08-03~04 추가)** `uploadProfileImage(file)`(presign → S3 직접 PUT → confirm), `resetProfileImage()`(`DELETE /users/me/profile-image`, 기본 이미지로 초기화). **(2026-08-11 추가)** `withdraw()`(`DELETE /users/me`) — `logout()`과 동일한 이유로 목데이터 분기 없음. **(`feat/user-nickname-format` 브랜치 — 아직 `dev` 미머지·미배포)** `getNicknamePolicy()`(`GET /users/nickname-policy`) |
| `app/mappers/user.ts` | DTO ↔ domain 변환 |
| `app/lib/sessionErrors.ts` **(2026-07-29 신규)** | `redirectIfSessionInvalid(error)`(401이면 즉시 `/login?error=session_expired`)와 `classifyProfileLoadError(error)`(`getMyProfile()` 실패를 `'not-found'`\|`'unknown'`으로 분류, 내부적으로 앞의 함수 재사용) |
| `app/ui/AccountUnavailableRedirect.tsx` **(2026-07-29 신규)** | `getMyProfile()`이 404(존재하지 않음/탈퇴)를 반환했을 때 렌더링하는 클라이언트 컴포넌트. 마운트 시 `logout()` 호출 후 결과와 무관하게 랜딩 페이지(`/`)로 이동 |
| `app/signup/SignupFormClient.tsx` **(2026-07-31 참고)** | Auth 문서 범위지만, 닉네임을 여기서 "중복확인"까지 거쳐 정하게 되면서 `app/(main)/mypage/profile/ProfileClient.tsx`의 등록 화면에서 닉네임 섹션이 빠지게 됨 — 아래 "프로필 등록" 표 참고 |

## 프로필 등록 — 요구사항 대비

| 요구사항 | 실제 구현 |
| --- | --- |
| 관심지역, 거래 유형, 자취/취업 여부 입력 | ⚠️ **"취업 여부" 항목 자체가 없음** — FE엔 `currentStage`(`'자취 처음' \| '자취 경험 있음'`)만 있고, 코드 전체에 취업 관련 필드/문구가 전혀 없음(grep 결과 0건). 관심지역(시·도/시·군·구/읍·면·동 3단 select)과 거래 유형(전세/월세 버튼)은 있음 |
| AI 기반 서비스 운용 사전 고지 | ✅ `mode === 'register'`일 때만 `NoticeBox`로 "생성형 AI를 활용해... 참고용 정보" 문구 노출 |
| 입력값 검증 | ⚠️ **(2026-07-31 변경)** 닉네임은 더 이상 이 화면에서 입력받지 않음(바로 아래 "실패: 중복된 닉네임" 참고). 관심지역·거래유형은 `required`로 빈 값 제출만 막고, 형식 자체에 대한 검증은 없음(애초에 select라 필요 없음) |
| `currentStage`에 따라 홈 위젯 우선순위 결정 | ⚠️ 아래 "홈 위젯 우선순위" 항목 참고 — 실제로는 위젯 재배치가 아니라 카드 문구 일부만 분기 |
| 성공 시 온보딩 반영된 홈 화면으로 이동 | ✅ **(2026-07-29 해결)** `mode === 'register'`일 때는 `router.push('/home')`으로 이동. 프로필 **수정**은 기존대로 `/mypage`로 돌아가도록 분기해, 온보딩 요구사항과 "편집 후 원래 화면으로" 관례를 모두 만족시킴 |
| 실패: 필수 입력값 누락 | ✅ `required` 속성 + `transactionType` 미선택 시 자체 에러 문구로 제출 차단 |
| 실패: 중복된 닉네임 | ✅ **(2026-07-31 변경)** 프로필 등록 화면엔 더 이상 닉네임 섹션이 없음 — 닉네임은 회원가입 시점(`app/signup/SignupFormClient.tsx`)에 동일한 "중복확인" 플로우로 이미 정해진다. 애초에 (마이페이지 온보딩이 아니라) 회원가입 때 정하는 이유는, 등록 전까지 닉네임이 비어 있으면 전역 헤더의 "{nickname}님" 표시가 빈 채로 보이는 문제가 있어서다(`MainLayoutClient.tsx`). 닉네임 변경은 이제 프로필 **수정** 화면에서만 가능(아래 "프로필 수정" 표 참고) — 회원가입 화면 자체는 Auth 문서 범위라 여기선 이 정도만 기록 |
| 실패: 허용되지 않는 닉네임 | ⚠️ **부분 구현, `feat/user-nickname-format` 브랜치 — 아직 `dev` 미머지·미배포.** `SignupFormClient.tsx`가 `getNicknamePolicy()`로 받은 패턴(`pattern`/`title` 속성 + "중복확인" 클릭 시 정규식 선제 검사, 위반 시 `invalid` 상태로 서버 안내 문구 노출)을 반영해 한글/영문/숫자 형식은 이제 클라이언트에서도 막는다. **머지 전까지는 `dev`/배포판에서 여전히 클라이언트 쪽 형식 검증이 없다.** 그리고 머지 여부와 무관하게 욕설/금칙어는 클라이언트·백엔드 둘 다 아직 못 거름(Backend `docs/specs/user-design.md` 남은 이슈 9번 참고) — 백엔드가 거부하면 에러 메시지를 그대로 노출하는 pass-through 패턴은 유지됨 |
| 실패: 입력값 길이 초과 | ✅ 닉네임 `maxLength={20}` |
| 실패: 인증되지 않은 사용자 | ✅ `(main)/layout.tsx`가 상위에서 이미 막음(Auth 문서 참고) — 이 화면까지 도달했다면 인증된 상태가 보장됨 |

## 프로필 조회 — 요구사항 대비

| 요구사항 | 실제 구현 |
| --- | --- |
| 인증된 사용자 정보 확인 | ✅ `getMyProfile(cookieHeader)` — `(main)/layout.tsx`의 인증 게이트 통과 후에만 도달 |
| 프로필 + 관심 정보 조회 | ✅ `MyPageClient`가 닉네임/프로필사진/관심지역/거래유형/현재단계를 모두 표시 |
| 실패: 인증 실패 / 존재하지 않는 사용자 / 탈퇴·비활성화된 사용자 | ✅ **(2026-07-29 해결)** `app/lib/sessionErrors.ts`의 `classifyProfileLoadError()`가 3갈래로 분류한다. ① 세션 무효(401, `isSessionInvalidErrorCode`) — 즉시 `redirect('/login?error=session_expired')`, 원래 화면은 렌더링될 기회조차 없이 곧장 로그인 화면으로 넘어가고(로그인 화면에 도착해서야 "로그인 세션을 확인할 수 없습니다" 문구가 뜸) ② 존재하지 않음/탈퇴(404) — 백엔드 `UserService.getActiveUserOrThrow()`가 이 둘을 같은 `NOT_FOUND` 코드로 합쳐서 내려줘서 FE도 더는 세분화할 수 없다(확인 완료). `'not-found'`로 반환하면 `AccountUnavailableRedirect`가 마운트되어 `logout()` 호출 후 랜딩 페이지(`/`)로 이동 — Server Component는 쿠키를 지울 수 없어(Route Handler/미들웨어만 가능, `proxy.ts` 확인) 클라이언트에서 실제 로그아웃 API를 호출하는 방식을 택함 ③ 그 외(네트워크 오류 등) — 기존처럼 "프로필 정보를 불러오지 못했습니다" 문구 유지. `mypage/page.tsx`/`mypage/profile/page.tsx`/`home/page.tsx` 세 곳 모두 적용. `home/page.tsx`의 `getProperties`/`getMyPageOverview`/`getMyChecklistOverviews`, `mypage/page.tsx`의 `getMyPageOverview`에도 `redirectIfSessionInvalid()`를 추가해 세션 무효 시 동일하게 즉시 로그인으로 보냄(단, `getProperties`/`getMyPageOverview`/`getMyChecklistOverviews`는 user 도메인이 아니라 별도 서비스이므로 property/checklist 문서 참고) |
| (2026-07-31 추가 발견) 프로필 조회 실패가 마이페이지 계정관리 카드의 다른 표시까지 오염시킴 | ✅ 해결. `MyPageClient.tsx`의 "비밀번호 설정/변경" 링크는 `profile.hasPassword \|\| profile.email !== null` 조건으로 노출 여부를 정하는데, 프로필 조회가 일시적으로 실패해 `profile`이 `emptyProfile`(`email: null`, `hasPassword: false`)로 폴백된 경우도 조건이 거짓이 되어 이메일이 실제로 있는 사용자까지 "이메일 미연동"으로 잘못 안내되고 있었다. `profileLoadError`가 있을 때는 "이메일 미연동"이 아니라 "정보를 불러오지 못함"으로 별도 표시하도록 분기를 추가해, 조회 실패(모르는 상태)와 진짜 이메일 미연동(확인된 상태)을 구분함 |

## 프로필 수정 — 요구사항 대비

| 요구사항 | 실제 구현 |
| --- | --- |
| 본인 프로필인지 확인 | ✅(간접) — `PATCH /users/me`가 인증 쿠키 기준으로 본인만 대상이 되는 구조라 FE가 별도로 확인할 게 없음 |
| 입력값 길이/형식 검증 | ⚠️ **(2026-07-31)** 닉네임 길이(2~20자)만 클라이언트 검증 — 등록 화면엔 이제 이 필드가 없어(위 "프로필 등록" 표 참고) 수정 화면에서만 적용됨. **(추가, `feat/user-nickname-format` 브랜치 — 아직 `dev` 미머지·미배포)** `ProfileClient.tsx`도 같은 방식(`getNicknamePolicy()` + `pattern`/`title` + "중복확인" 선제 검사)으로 형식 검증을 추가함 — 머지 전까지는 `dev`/배포판에서 여전히 길이만 검증됨 |
| 닉네임 변경 시 중복 확인 | ✅ **(2026-07-31)** `isNicknameUnchanged`로 안 바꿨으면 재확인 생략, 바꿨으면 강제 — 닉네임 관련 UI는 이제 이 수정 화면에만 있음(등록 화면에는 없음, 위 "프로필 등록" 표 참고) |
| 변경된 정보 저장 | ✅ `updateMyProfile` |
| 실패: 인증 실패 / 중복 닉네임 / 잘못된 입력값 | ⚠️ 백엔드 메시지 그대로 노출(Auth 문서와 동일 패턴) |
| 실패: 지원하지 않는 이미지 형식 / 이미지 크기 초과 | ✅ **(2026-08-03~04 완료)** 클라이언트 단 검증(`ProfileClient.tsx`, JPG/PNG·5MB 이하, 위반 시 인라인 에러)에 더해 실제 업로드/저장 연동까지 완료됨(아래 "남은 이슈" 6번 참고) — 백엔드가 presign/confirm 양쪽에서 형식·크기를 재검증하므로, 클라이언트 검증을 우회해도 서버가 `FILE_CONTENT_TYPE_NOT_ALLOWED`/`FILE_TOO_LARGE`로 거부하며 이 경우 저장 버튼의 에러 문구(`saveError`)로 그대로 노출됨(백엔드 메시지 pass-through 패턴, Auth 문서와 동일) |

## 회원 탈퇴 — 요구사항 대비

**(2026-08-11 완료)** Backend가 `DELETE /users/me`(익명화 + 연관 데이터 정리 + 세션 무효화까지 한 번에 처리 — Backend `docs/specs/user-design.md` 참고)를 완성하면서, 그동안 빈 함수였던 `handleWithdrawClick`을 실제로 연결했다.

1. "회원 탈퇴" 클릭 → `WithdrawConfirmModal`(`PropertyDeleteConfirmModal.tsx`와 동일 패턴 — 처리 중엔 배경 클릭으로 안 닫힘) 오픈, "탈퇴하면 되돌릴 수 없다"는 안내와 함께 확인/취소
2. 확인 시 `withdraw()`(`DELETE /users/me`) 호출 → 성공하면 방어적으로 `logout()`을 한 번 더 호출한 뒤(아래 참고) 랜딩 페이지(`/`)로 이동
3. 실패하면 모달 안에 서버 에러 메시지를 그대로 노출(`ApiError.message` pass-through, 다른 화면과 동일 패턴)

**세션 무효화를 프론트에서 한 번 더 호출하는 이유**: `DELETE /users/me`가 이미 세션 무효화(쿠키 삭제)까지 best-effort로 처리하지만, 그 처리가 실패해도 탈퇴 자체는 성공으로 응답하도록 되어 있다(Backend 쪽 설계). 확실히 하기 위해 성공 후 `logout()`을 방어적으로 한 번 더 호출하는데, 이 시점엔 이미 쿠키/토큰이 없는 상태라 실질적으로는 아무 것도 안 하는 호출이다(`SessionLogoutService.logout()`이 토큰이 없으면 즉시 스킵 — Backend 확인 완료). 그래서 이 호출이 실패해도 에러를 삼키고 항상 랜딩 페이지로 이동한다 — 탈퇴 자체는 이미 끝난 뒤라 이 방어 호출의 실패가 사용자에게 "탈퇴 실패"로 잘못 보이면 안 되기 때문.

| 요구사항 | 실제 구현 |
| --- | --- |
| 탈퇴 요청 | ✅ 위 흐름대로 완료 |
| 본인 여부 확인 / 상태 변경 / 개인정보 삭제·익명화 / 클라이언트 인증 정보 제거 | ✅ 전부 Backend가 한 트랜잭션(+best-effort 세션 무효화)으로 처리, FE는 결과만 받아 이동 |
| 성공/실패 결과 처리 | ✅ 위 3번 참고 |

## 홈 위젯 우선순위 — 요구사항 대비

요구사항 예시: `"자취 처음"이면 체크리스트/계약서분석 위젯 상단 노출`

| 요구사항 | 실제 구현 |
| --- | --- |
| `currentStage`에 따라 대시보드 위젯 우선순위 결정 | ⚠️ **위젯 재배치가 아니라, 최상단 카드 하나(`PriorityActionCard`)의 문구만 조건부로 바뀜.** `getPriorityAction()`은 매물이 아예 없을 때만 `currentStage === '자취 처음'` 여부로 제목/설명 문구를 다르게 보여주고, 그 아래 "요약 정보", "체크리스트 진행률 위젯", "중요 확인사항" 섹션들은 `currentStage`와 무관하게 항상 같은 순서로 렌더링됨. "위젯 상단 노출"이라는 요구사항의 재배치 뉘앙스는 구현되지 않음. **(2026-07-29)** 재배치 방향 4안(강조만 추가 / 체크리스트 위젯 위치만 승격 / 기능 카드 순서 동적 재정렬 / 진행 스텝퍼로 카드 확장)을 정리했으나 실제 구현은 아직 미착수 — 방향 결정 필요 |
| ~~🐛 **버그 발견**~~ | ✅ **(2026-07-29 해결)** `getPriorityAction()`이 이제 `checklistOverviews`(매물별 실제 체크리스트 상태 — `getMyChecklistOverviews()`가 내려주는 `NOT_STARTED`/`IN_PROGRESS`/`COMPLETED`)를 받아 `/properties/{id}/checklist` 또는 `/checklists`로 정확히 연결한다. 매물이 여러 개인 경우 상태별 개수에 따라 특정 매물로 바로 연결할지 목록(`/checklists`)으로 유도할지도 분기하도록 확장됨(진행 중 1개→직접 연결, 2개 이상→목록, 전부 완료→별도 문구) |
| (2026-07-29 추가 발견) 매물/체크리스트 조회 실패 처리 | ✅ 해결. 예전엔 `getProperties()`/`getMyChecklistOverviews()`가 실패해도 그냥 빈 배열로 넘어가서, 카드가 "매물이 없다"/"체크리스트를 아직 시작 안 했다"처럼 **확인되지 않은 사실을 그대로 단정**할 수 있었다(조회 실패와 진짜 빈 상태를 구분하지 못함). `propertiesLoadFailed` 플래그를 추가하고, `hasProperty === true`인데 `checklistOverviews`가 비어 있으면 조회 실패로 간주하는 판단을 분리해, 실패 시엔 "불러오지 못했어요 + 새로고침" 문구로 정직하게 표시하도록 수정. 같은 파일에서 `getProperties()` 호출에 `cookieHeader`가 누락되어 실제 API 모드에서 항상 401로 실패하던 버그도 함께 발견해 수정함(이 버그 때문에 위 실패 케이스가 상시 재현되고 있었음). 세션 무효(401)인 경우엔 위 "프로필 조회" 표에 정리한 대로 `redirectIfSessionInvalid()`가 즉시 로그인 화면으로 보냄 |
| (2026-07-31 추가 발견) 마이페이지 "등록 매물"이 실제로는 절대 표시되지 않던 문제 + 홈 화면 상시 오류 배너 | ✅ 해결. `getMyPageOverview()`가 호출하던 `/mypage` 엔드포인트가 백엔드에 애초에 구현된 적이 없음을 확인(컨트롤러/서비스/DTO 전체를 브랜치 전수 검색해도 없음). 그 결과 ① 마이페이지의 "등록 매물" 섹션은 실제 API 모드에서 매물이 있어도 항상 조회 실패 배너만 보여줬고, ② 홈 화면도 같은 호출에 얹혀 있던 "분석한 특약사항" 카운트/알림 계산 때문에 "일부 정보를 불러오지 못했습니다" 배너가 모든 사용자에게 상시 노출되고 있었다. 마이페이지의 "등록 매물"은 홈 화면과 동일하게 실제로 동작하는 `getProperties()`(`/properties`, 최대 페이지 크기 100으로 요청, 개수 표시는 `items.length`가 아니라 `totalElements` 기준이라 100개를 넘어도 정확 — 다만 "확인 필요 신호" 등 항목별 집계는 가져온 최대 100개, `createdAt DESC` 기준 안에서만 계산되어 101번째 이후 오래된 매물은 반영되지 않음, 실사용 규모상 감수)로 교체했다. 특약사항 분석 이력 전용 호출은 `getActivityHistory()`(`app/services/activityHistory.ts`로 리네임 — 이름이 "마이페이지 전체 요약"처럼 들려 혼동을 줬던 `getMyPageOverview`/`/mypage`를 실제 역할에 맞게 정리, 죽은 필드였던 `bookmarkedProperties`도 함께 제거)로 분리해, 홈 화면에서는 이 호출이 실패해도 배너 없이 조용히 빈 상태로만 처리하도록 변경(상시 실패하는 상태를 매번 "오류"로 알리는 게 오히려 배너의 신뢰도를 떨어뜨리므로). 특약사항 분석 결과를 저장·조회하는 기능 자체가 백엔드에 아직 없어(`POST /contract-analysis/analyze` 같은 1회성 분석 API만 존재, 목록 조회 엔드포인트 없음) 이 활동 내역은 엔드포인트가 생긴 뒤에도 당분간 계속 비어있을 수 있음 |
| (2026-07-31 추가 발견) 체크리스트 진행 위젯/카운트가 실제로 진행 중이어도 절대 반영되지 않던 문제 | ✅ 해결. `hasChecklist`(위젯 노출 여부)와 "요약 정보"의 `activeChecklistCount`, 마이페이지 매물 카드(`PropertyListItem`)의 체크리스트 상태 표시가 전부 `property.checklist` 필드에 의존하고 있었는데, 이 필드는 실제 `/properties` 응답(`mapPropertyListItemDto`)엔 없어서 항상 `undefined`였다 — 그래서 체크리스트를 아무리 진행해도 절대 반영될 수 없는 구조였다. `checklistOverviews`(`getMyChecklistOverviews()`)의 실제 status로 교체하고, 진행률(%)·주의 개수는 체크리스트별로 `getChecklistResult()`를 추가 조회해서 채운다. `getChecklistResult()`는 체크리스트 하나당 진행률(%)만 주고 원본 문항 개수(X/Y)는 안 줘서 여러 매물의 체크리스트를 하나의 숫자로 합칠 수 없다 — 그래서 홈 화면은 진행 중인 체크리스트마다 위젯을 하나씩(매물명 + 진행률% + 주의 개수, `/properties/{id}/checklist`로 링크) 리스트로 보여주도록 재설계했다(기존엔 위젯 1개 고정 + mock 숫자). 마이페이지도 매물 카드마다 같은 방식으로 실제 상태를 보여주고, 조회 자체가 실패한 경우엔 "시작 전"으로 단정하지 않고 "체크리스트 상태를 불러오지 못함"으로 구분해 표시한다. 부수적으로 위젯의 `href="/checklist"`(존재하지 않는 경로)도 실제 경로로 고쳤다 |

## 비기능 요구사항 — 대조

| 항목 | 요구사항 | 실제 |
| --- | --- | --- |
| 자신의 프로필만 조회/수정 | O | Backend 책임(인증 쿠키 기준 본인 데이터만 응답) — FE는 별도 접근 제어 없이 응답을 그대로 신뢰 |
| 이메일/소셜 식별 정보 비공개 | O | ✅ `MyPageClient`/`ProfileClient` 어디에도 이메일이나 provider 식별자를 화면에 표시하는 코드가 없음(닉네임/이미지/관심정보만 노출) |
| 이미지 업로드 시 형식/크기 검증 | O | ✅ **(2026-08-03~04 완료)** 클라이언트 단 검증(JPG/PNG, 5MB 이하)에 이어 실제 업로드까지 연동됨 — 위 "프로필 수정" 표 참고 |
| 불필요한 개인정보 미수집 | O | FE는 화면에 입력받는 필드(닉네임/이미지 URL/지역/거래유형/현재단계) 외엔 아무것도 수집하지 않음 — 이 항목 자체는 준수 |
| 탈퇴 시 개인정보 삭제/익명화 | O | ✅ **(2026-08-11)** Backend가 처리, FE는 `DELETE /users/me` 호출 후 랜딩으로 이동만 담당 — 위 "회원 탈퇴" 절 참고 |
| 탈퇴 사용자 OAuth 연동 정보 처리 기준 | O | Backend 정책 영역, FE 범위 밖(단 탈퇴 요청 자체는 이제 FE에서 정상 발생함) |
| 선택 정보는 건너뛸 수 있음 | O | ⚠️ 어떤 필드가 "선택"인지 요구사항에 명시가 없는 상태에서, 실제 구현은 관심지역·거래유형은 `required`로 강제하고 `currentStage`(자취 단계)만 별도 필수 체크가 없어 사실상 선택처럼 동작 — 의도된 설계인지 우연인지 불명확 |
| 입력값 오류 항목과 수정 방법을 명확히 표시 | O | ✅ 닉네임 중복확인 결과, 거래유형 미선택 등은 필드 근처에 인라인 문구로 표시됨 |
| 미활용 정보는 필수로 요구하지 않음 | O | 확인 불가 — 백엔드가 실제로 각 필드를 어디에 쓰는지 이 문서만으로는 알 수 없음 |
| 닉네임 중복 = 앱 검증 + DB 제약 동시 적용 | O | FE는 "중복확인" API 호출 결과만 신뢰 — DB 제약 존재 여부는 Backend 문서 참고 |
| 탈퇴 사용자 식별자 재사용 방지 | O | Backend 책임, FE 범위 밖 |
| 프로필 조회 시 매물/계약서 상세 데이터 미조회 | O | ✅ `getMyProfile`은 `UserProfileDto`(프로필 필드만)만 요청 — 매물/체크리스트는 `getProperties`/`getMyPageOverview` 등 별도 호출로 분리돼 있음 |
| 프로필 이미지는 화면에 적합한 크기로 제공 | O | ⚠️ 이미지가 외부 URL 그대로 `<img>`에 렌더링됨(리사이징/최적화 없음). **(2026-07-31)** 파일 선택 시 `URL.createObjectURL`로 클라이언트 미리보기는 생겼지만, 이 역시 원본 그대로 보여줄 뿐 리사이징은 없음 — 서버(S3) 업로드 연동 시점에 처리할 문제로 남겨둠 |

## 요구사항에 없던 추가 구현

- 닉네임 미리보기 이미지 오류 처리(`imagePreviewError`) — URL이 깨진 이미지일 때 아이콘으로 폴백
- 관심지역을 시·도/시·군·구/읍·면·동 3단계로 나눠 입력받고 문자열로 합치는 로직(`parseInterestRegion`/`buildInterestRegion`) — 요구사항엔 "관심지역"이라고만 되어 있고 3단 구조라는 언급은 없음
- 홈 화면 "요약 정보" 4개 카드(관심 매물/확인 필요 신호/진행 중 체크리스트/분석한 특약사항) — User 도메인 요구사항엔 없고, 다른 도메인 데이터를 모아 보여주는 홈 전용 집계
- **(2026-07-31)** 프로필 사진 선택 시 클라이언트 미리보기(`URL.createObjectURL`)와 형식(JPG/PNG)·크기(5MB) 검증, "선택 취소" — 요구사항엔 없었지만 향후 S3 업로드 연동을 위한 선행 작업으로 추가
- **(2026-08-03~04)** "기본 이미지로 변경" 버튼 — 기존에 등록된 프로필 사진을 지우고 기본(미설정) 상태로 되돌리는 기능. 요구사항엔 명시되지 않은 케이스이며, 새 파일 선택과 마찬가지로 저장(`저장하기`/`등록하기`) 버튼을 눌러야 실제로 반영되고, 둘은 상호 배타적이다(새 파일을 고르면 되돌리기 요청은 자동 취소)

## 남은 이슈 / 확인 필요 총정리

1. ~~**회원 탈퇴가 완전히 미구현 상태**~~ — ✅ **2026-08-11 해결.** 버튼은 있지만 클릭해도 아무 동작이 없던 TODO 스텁이었음. **(2026-07-29)** 팀 논의 결과 property/checklist 등 타 도메인 작업이 더 진행된 뒤 다시 검토하기로 하고 보류했다가, Backend 탈퇴 API가 완성되면서 이어서 구현 완료 — 위 "회원 탈퇴" 절 참고
2. **"취업 여부" 항목이 요구사항에는 있는데 구현에는 없음** — `currentStage`가 자취 경험만 다루고 취업 상태는 어디에도 없음. 요구사항이 잘못 적힌 건지, 스코프에서 빠진 건지 확인 필요. **(2026-07-29 검토)** Backend `docs/specs/user-design.md`에도 원 요구사항이 "자취/취업여부(currentStage)"로 두 개념이 한 필드명에 뭉뚱그려 있음을 확인 — FE만의 누락이 아니라 요구사항 자체의 모호함일 가능성. 온보딩 분기 영향은, 지금처럼 콘텐츠 차별화(취업 여부별 안내 문구 등) 없이 필드만 추가해서는 분기 효과가 없고, 4번(위젯 우선순위 재설계)과 묶어 다차원 분기로 설계해야 의미가 있다고 판단 — 아직 코드 변경은 없음
3. ~~**`getPriorityAction()`의 `ctaHref: '/checklist'`가 존재하지 않는 경로를 가리킴**~~ — ✅ 2026-07-29 해결 (위 "홈 위젯 우선순위" 표 참고)
4. **`currentStage` 기반 "위젯 우선순위"가 요구사항만큼 구현되지 않음** — 실제로는 카드 하나의 문구 분기 수준. 위젯을 실제로 재배치할지, 지금 수준으로 충분한지 확인 필요. **(2026-07-29)** 재배치 방향 아이디어는 정리했으나 미구현 — 위 표 참고
5. ~~**프로필 등록 성공 후 목적지가 `/mypage`**~~ — ✅ 2026-07-29 해결. 등록(온보딩)은 `/home`으로, 수정은 `/mypage`로 분기
6. ~~**프로필 이미지가 URL 입력 방식이라 "업로드/형식·크기 검증" 요구사항 자체가 무의미해짐**~~ — ✅ **2026-08-04 해결.** 파일 업로드 플로우를 실제로 만들지, 지금처럼 URL 입력으로 갈지 방향 확인 필요했던 항목. **(2026-07-29 검토)** S3 등 실제 저장소 연동 방식이 정해지기 전엔 전송(업로드) 로직을 짜도 다시 갈아엎을 가능성이 높음 — 파일 선택 UI/클라이언트 미리보기/형식·검증 로직처럼 저장소 방식과 무관한 부분만 먼저 만들고, 실제 전송 로직은 저장소 연동 방식이 정해진 뒤 붙이는 방향을 제안. **(2026-07-31 진행중)** 검토 결론대로 클라이언트 단만 먼저 구현 — `ProfileClient.tsx`가 `<input type="file" accept="image/jpeg,image/png">`로 파일을 선택받아 즉시 `URL.createObjectURL`로 미리보기하고, JPG/PNG·5MB 이하만 클라이언트에서 검증한다(위반 시 인라인 에러, object URL은 재선택/취소/언마운트 시 해제). 선택한 파일은 아직 폼 제출값에 반영하지 않아 저장 시엔 기존 이미지가 그대로 유지되며 실제로는 반영되지 않고, 화면에도 "사진 업로드 저장은 곧 지원될 예정"이라고 명시해둠 — S3 등 저장소 연동이 정해지면 선택된 파일을 업로드 API로 전송하는 로직만 이어 붙이면 되는 구조로 남겨둠. **(2026-08-03~04 완료)** 백엔드가 S3 presign/confirm 플로우를 갖추면서(Backend `docs/specs/user-design.md`의 동일 절 참고) 실제 전송 로직을 이어 붙임 — 저장(`저장하기`/`등록하기`) 버튼을 누르는 시점에 `uploadProfileImage(file)`이 presign(`POST /users/me/profile-image/presign`) → 브라우저가 S3에 직접 PUT → confirm(`POST /users/me/profile-image/confirm`) 순으로 실행되고(그 전까지는 여전히 로컬 미리보기만 보여줌 — 저장 전엔 서버에 아무것도 반영되지 않음), presign에 넘길 확장자는 신뢰할 수 없는 원본 파일명 대신 이미 검증된 MIME 타입에서 뽑아 쓴다(`image/jpeg` → `jpeg`). 여기에 더해 요구사항엔 없던 "기본 이미지로 변경" 버튼(`resetProfileImage()` → `DELETE /users/me/profile-image`)도 추가해 기존 사진을 지우고 기본 상태로 되돌릴 수 있으며, 새 파일 선택과 저장 버튼을 눌러야 반영되는 방식으로 통일했고 둘은 상호 배타적이다. 다만 presign으로 S3 PUT까지 끝내고 confirm 전에 이탈하는 경우 S3에 고아 객체가 남을 수 있는 문제는 아직 Backend 쪽에 미해결로 남아있음(Backend 문서의 "남은 이슈" 9번 참고, 태그+Lifecycle 방식으로 해결 예정이나 미적용). **(2026-08-04 해결)** 태그+Lifecycle 방식으로 위 문제를 해소함 — Backend가 presign 시 S3 객체에 `status=pending` 태그를 서명에 포함시켜 걸어두고(버킷엔 이 태그가 붙은 객체를 일정 기간 뒤 자동 삭제하는 Lifecycle 규칙을 AWS 콘솔에서 별도로 걸어둠 — 코드가 아니라 인프라 설정), confirm이 성공하면 그 태그를 제거해 영구 보관으로 전환한다(`S3PresignService.PENDING_UPLOAD_TAG`). FE는 이에 맞춰 `ProfileImagePresignResponseDto`에 새로 내려오는 `tagging` 값을 S3 PUT 요청의 `x-amz-tagging` 헤더에 그대로 실어 보내도록 `uploadProfileImage()`/`putFileToPresignedUrl()`을 수정함 — 이 값도 비밀번호 정책과 같은 이유로 프론트가 하드코딩하지 않고 매번 서버 응답을 그대로 쓴다(어긋나면 S3가 서명 불일치로 403 거부). PUT까지 성공하고 confirm 전에 이탈하는 경우 자체는 여전히 가능하지만, 이제 그렇게 방치된 객체는 버킷 Lifecycle 규칙에 의해 며칠 내 자동 정리된다 — "취소/뒤로가기 버튼에 직접 삭제를 트리거"하는 방식은 브라우저 강제 종료·네트워크 단절처럼 클라이언트 코드가 아예 실행될 기회조차 없는 이탈 경로를 커버하지 못해 채택하지 않음(검토 결과)
7. ~~**프로필 조회 실패 시 "인증 실패/존재하지 않는 사용자/탈퇴한 사용자"를 구분하지 않고 하나의 에러 문구로 처리됨**~~ — ✅ 2026-07-29 해결. 위 "프로필 조회" 표 참고 — 401은 즉시 로그인 리다이렉트, 404(존재하지 않음/탈퇴, 백엔드가 같은 코드로 합쳐서 구분 불가)는 로그아웃 후 랜딩 이동, 그 외는 기존 문구 유지
8. **(2026-07-29 발견·해결) 홈 화면이 매물/체크리스트 조회 실패를 "진짜 빈 상태"와 구분하지 못했음** — `getProperties()` 인증 쿠키 누락 버그와 함께 발견. 위 "홈 위젯 우선순위" 표의 "매물/체크리스트 조회 실패 처리" 항목 참고
9. **(2026-07-29 확인) property/checklist 도메인 자체 화면은 세션 만료 시 로그인으로 리다이렉트되지 않음** — `properties/*`, `properties/[id]/checklist`, `checklists` 페이지는 여전히 일반 catch만 있고 `redirectIfSessionInvalid()`를 안 씀(일부는 "...API 설정을 확인해 주세요" 구식 문구도 남아있음). user 도메인 범위 밖이라 이번엔 보류 — property/checklist 문서에서 다룰 것
10. **(2026-07-31 발견·해결) 마이페이지 "등록 매물" 미표시 + 홈 화면 상시 오류 배너** — 백엔드에 없는 `/mypage` 엔드포인트에 기대고 있던 게 원인. 위 "홈 위젯 우선순위" 표의 마지막 항목 참고. 관련해서 `getMyPageOverview`/`services/mypage.ts`는 실제 역할(특약사항 분석 등 최근 활동 내역)에 맞게 `getActivityHistory`/`services/activityHistory.ts`로 전체 리네임함
11. **(2026-07-31 발견·해결) 체크리스트 진행 위젯/카운트가 실제 진행 상황과 무관하게 항상 "시작 전"으로 보였음** — 존재하지 않는 `property.checklist` 필드에 의존한 게 원인. 위 "홈 위젯 우선순위" 표의 마지막 항목 참고
12. **(2026-07-31 발견·해결) 구글 계정으로 로그인 시 커스텀 프로필 사진이 깨져 보이는 경우가 있었음** — 구글 사진 서버(`lh3.googleusercontent.com`)가 실제 업로드된 사진에 한해 브라우저의 `Referer` 헤더를 이유로 요청을 차단하는 경우가 있는 것으로 보임(기본 생성 아바타는 영향 없음, 백엔드는 구글 `picture` 값을 가공 없이 그대로 전달함 — `GoogleOAuth2UserInfo.java`). `profileImageUrl`을 렌더링하는 세 곳(`MainLayoutClient.tsx`, `MyPageClient.tsx`, `ProfileClient.tsx`) 모두 `<img referrerPolicy="no-referrer">`로 수정해 브라우저가 이 헤더를 보내지 않도록 회피함
13. **닉네임 욕설/금칙어 필터링 미구현** — 위 "프로필 등록"/"프로필 수정" 표에 추가한 형식 검증(`feat/user-nickname-format` 브랜치)도 한글/영문/숫자 형식만 막고 욕설은 못 거른다. Backend `docs/specs/user-design.md` 남은 이슈 9번과 동일한 사안 — 어근 목록 + 정규화 방식으로 방향만 정했고 코드는 아직 없음
