# 시세 데이터(market-data) 도메인 — Frontend 구현 현황 정리

## 배경 / 성격

`auth-design.md`/`user-design.md`/`property-design.md`와 같은 성격의 **요구사항 명세서 대비 실제 구현 대조 문서**입니다. 이 도메인은 국토부 API 호출·반경 확장·중앙값 계산 전부가 Backend 책임이라, Frontend가 실제로 관여하는 부분은 **Backend가 계산해서 내려준 결과를 얼마나 제대로 보여주는가** 하나뿐입니다.

**범위**: `MarketComparisonDto`를 소비하는 지점(`app/mappers/property.ts`, `app/(main)/properties/[id]/PropertyDetailClient.tsx`)만 다룹니다.

**이 문서의 이전 버전(초판)은 `radiusMeters`/`message` 필드가 DTO에 추가되기 전, FE가 결과를 화면에 반영하기 전 시점의 스냅샷이었습니다.** 이후 BE 작업(WBS "radiusMeters 노출 + 정책값 설정화")과 FE 작업(WBS "실거래가 비교 결과 UI + 서비스범위 안내 문구")이 모두 완료되어 아래는 그 시점 기준으로 다시 작성한 내용입니다.

## 현재 `MarketComparisonDto`

```ts
export type MarketComparisonDto = {
  status: 'UNAVAILABLE' | 'AVAILABLE';
  referencePrice: number | null;
  differenceRate: number | null;
  sampleCount: number | null;
  referenceDate: string | null;
  radiusMeters: number | null;   // 실제 적용된 반경 단계(300/600). UNAVAILABLE이면 null
  message: string | null;        // UNAVAILABLE 사유를 사람이 읽을 문장으로. AVAILABLE이면 null
};
```

`status`가 `AVAILABLE`/`UNAVAILABLE` 두 값뿐이라 "판정불가(표본부족)"와 "판정불가(주소정보 부족)"·"실패(외부 API 장애)" 같은 세부 유형을 코드값으로는 구분하지 않지만, `message`가 사유별로 다른 문장을 내려주기 때문에 **사용자에게 보여지는 결과 기준으로는 사실상 구분이 됨**(코드로 분기하고 싶은 경우에만 여전히 한계).

## 실거래가 조회 및 매물 가격 비교 — 요구사항 대비

| 요구사항 | 실제 구현 |
| --- | --- |
| 매물 등록/상세 조회 시 자동 트리거 | ✅ `POST /properties`/`GET /properties/{id}` 응답에 `marketComparison`이 항상 같이 옴 |
| 매물유형별 국토부 API 분리 호출 / 반경 확장 / 면적오차 / 표본기준 / 중앙값 계산 / 조회기간 고정 | Backend 책임 — FE는 결과만 받음 |
| 성공: 대표시세/가격차이/차이율/표본수/기준일/적용반경 제공 | ✅ `mapMarketComparisonDto`(`app/mappers/property.ts`)가 `referencePrice`/`differenceRate`/`sampleCount`/`referenceDate`/`radiusMeters` 전부 옮기고, `PropertyDetailClient`가 "인근 실거래 N건 기준 (반경 Xm)" · "시세보다 X% 높은/낮은 가격이에요" · "기준 시세(중앙값)" · "기준일"로 전부 화면에 표시함 |
| 판정불가: "시세정보 없음" + 사유 제공 | ✅ `message` 필드를 그대로 화면에 보여줌(월세/단독다가구/좌표없음/표본부족 등 사유별 문장이 그대로 전달됨) |
| 실패: 외부 API 장애/타임아웃/호출제한/응답형식오류 각각의 사유 제공 | ⚠️ BE가 `status` 코드로는 성공/판정불가/실패를 2단계(`AVAILABLE`/`UNAVAILABLE`)로만 구분해서 내려주므로, FE가 코드값으로 실패 유형을 분기하는 건 여전히 불가능. 다만 `message` 문장 자체는 사유별로 다르게 내려오므로 사용자에게 보여지는 결과는 사유가 구분되어 보임 |

## 비기능 요구사항 — 대조

| 항목 | 요구사항 | 실제 |
| --- | --- | --- |
| 서로 다른 거래유형 직접 비교 금지 | O | Backend 책임, FE 범위 밖 |
| 비교 대상 주택유형·면적 기준을 결과에 표시 | O | ❌ DTO에 "몇 ㎡ 오차 범위로 비교했는지" 자체가 없어 여전히 표시 불가 |
| 대표 시세 계산 방식(중앙값) 통일 | O | Backend 책임 |
| 표본 3건 미만이면 판정불가 처리 | O | Backend 책임 — FE는 `message`로 사유 확인 가능 |
| 반경 확장 로직을 정책값으로 관리 | O | Backend 책임 |
| 기준일·마지막 조회 시간 표시 | O | ✅ `referenceDate`(기준일)는 상세화면에 표시됨. "마지막 조회 시간"이라는 개념 자체는 여전히 DTO에 없음(비교가 매 요청 실시간 계산이라 별도 조회시각 기록이 없기 때문 — BE `market-data-design.md` 참고) |
| 주소/가격/거래유형 수정 시 기존 비교 결과 무효화 | O | Backend 책임 — 결과를 저장하지 않고 매번 재계산하므로 "무효화"할 상태 자체가 없음. FE는 애초에 주소/거래유형 수정을 막아뒀고 가격 수정만 가능 |
| 오래된 시세를 최신처럼 표시 금지 | O | ✅ 기준일이 표시되므로 사용자가 최신 여부를 판단할 근거는 생김(다만 "N일 전" 같은 상대 표현은 없음) |
| 조회 기간 6개월 고정 | O | Backend 책임 |
| API 실패가 매물 등록/상세 조회 전체 실패로 안 이어짐 | O | ✅ 등록/상세 조회는 `marketComparison.status`와 무관하게 항상 성공 |
| 외부 API 필드 누락 시 안전 실패 처리 | O | Backend 책임 |
| 호출 제한 시 무제한 재시도 금지 / 반경 확장 최대 2회 | O | Backend 책임 |
| 짧은 시간 반복 조회 시 불필요한 외부 API 호출 축소 | O | Backend 책임(BE `market-data-design.md` 참고 — 지오코딩만 캐싱, 국토부 API 자체는 캐싱 없음) — FE는 페이지 이동마다 새로 요청하며 자체 캐싱 없음 |
| 외부 API 응답시간/성공률/오류율 모니터링 | O | Backend 인프라 영역, FE 범위 밖 |
| 데이터 출처·기준일 표시 | O | ✅ "국토교통부 실거래가 공개시스템 기준이며, 참고용 정보이니 실제 시세는 별도로 확인해보세요." 문구 + 기준일 표시 |
| "정확한 시세를 보장하지 않는다" 안내 | O | ✅ 위 출처 문구가 시세비교 섹션 전용으로 따로 붙어 있음(위험신호 섹션의 일반 면책 문구와 별개) |
| 반경 확장 시 사용자에게 안내("600m까지 확장해서 비교") | O | ✅ "(반경 Xm)"로 실제 적용된 반경을 항상 표시 |
| 판정불가 사유를 이해할 수 있는 문구로 안내 | O | ✅ `message`를 그대로 노출 |
| 서비스범위(전세만 비교, 월세 제외) 안내 | (WBS 추가 항목) | ✅ "전세 매물의 보증금만 국토교통부 실거래가와 비교돼요. 월세 매물은 비교 대상이 아니에요." 문구 추가됨 |

## 남은 이슈 / 확인 필요 총정리

1. ~~`MarketComparisonDto`가 요구사항이 요구하는 상태 구분(성공/판정불가 3종/실패 4종)을 담을 수 없는 구조~~ → `radiusMeters`/`message` 추가로 사용자에게 보여지는 결과 기준으로는 사실상 해소됨. 다만 `status` 코드 자체는 여전히 2단계라, FE가 판정불가/실패를 코드로 분기해야 하는 요구가 생기면 그때는 BE 응답 스키마 확장이 다시 필요함
2. ~~`referencePrice`/`sampleCount`/`referenceDate`가 DTO엔 있는데 매퍼가 옮기지 않아 화면에 전혀 안 나옴~~ → 전부 매핑되어 화면에 표시됨
3. ~~데이터 출처·기준일 안내, 반경 확장 안내, 판정불가 사유 안내가 전부 없음~~ → 전부 추가됨
4. ~~"정확한 시세를 보장하지 않는다"는 시세 비교 전용 면책 문구가 없음~~ → 추가됨
5. 비교 대상 면적오차 범위(±20% 등 구체적 기준)를 사용자에게 보여주진 않음 — DTO 자체에 이 정보가 없어서 BE 응답 확장이 선행돼야 함
6. "마지막 조회 시간"(계산이 실제로 언제 실행됐는지)은 여전히 없음 — 다만 비교가 매 요청 실시간 계산이라 개념적으로 "기준일"과 겹치는 정보라 실익이 있는지는 확인 필요
