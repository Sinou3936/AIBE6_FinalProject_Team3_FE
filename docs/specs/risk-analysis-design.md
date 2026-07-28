# 위험도 분석(risk-analysis) 도메인 — Frontend 설계 제안

## 배경 / 성격

다른 도메인 문서(`auth-design.md` 등)는 **이미 있는 구현을 요구사항과 대조**하는 문서지만, 이 도메인은 소스 코드 확인 결과 **Frontend에 화면·타입·서비스가 전혀 없습니다.** `checkSignalCount`/`jeonseRatio` 필드가 존재하긴 하지만 mock 전용 타입(`PropertySummaryDto`)에만 있고, 실제 API를 타는 `PropertyListItemDto`/`PropertyDetailResponseDto`에는 아예 없습니다 — 즉 지금은 순수 자리표시자(placeholder)일 뿐 실제 연동 지점이 없습니다.

그래서 이 문서는 대조표 대신, **요구사항 명세서를 기준으로 나중에 이 도메인을 붙일 때 참고할 설계 제안**으로 작성합니다. Backend도 아직 이 도메인을 구현하지 않은 것으로 보입니다(`CLAUDE.md` "Current state"에 auth/contract-analysis만 언급, risk-analysis 없음) — 그래서 API 계약도 확정이 아니라 **요구사항 문서를 그대로 옮긴 제안**입니다.

## 지금 있는 것 (재사용 가능한 뼈대)

- `PropertyDetailClient.tsx`의 "확인 필요 신호" 카드 — `property.checkSignalCount !== undefined`일 때 `riskSummaries`(정적 데이터)를 아이콘+제목+설명으로 나열하는 구조가 이미 있음. `undefined`면 "준비 중" 배지 + "허위매물 의심 신호와 보증금 안전성 체크는 아직 준비 중이에요" 문구로 대체됨
- `PropertiesClient.tsx`(목록)와 `home/page.tsx`도 같은 패턴(`checkSignalCount !== undefined ? ... : '준비 중'`)으로 이미 분기가 짜여 있어, 실제 데이터가 들어오면 이 조건만 자연히 참이 되는 구조
- 카피 정책(`AGENTS.md`)이 이미 "허위매물입니다"/"위험도" 같은 단정적 표현을 금지하고 "확인 필요 신호 N개", "시세보다 20% 낮은 가격이에요 — 이유를 확인해보세요" 같은 사실 나열형 문구를 쓰도록 정해둬서, 이 도메인 요구사항의 "판정이 아닌 의심 신호" 톤과 이미 맞음

## 제안: 데이터 계약

```ts
// app/types/api.ts에 추가 제안
export type RiskSignalTypeDto = 'PRICE_OUTLIER' | 'DUPLICATE_LISTING' | 'MULTIPLE_LISTINGS' | 'RELISTED_PATTERN';

export type RiskSignalDto = {
  id: number;
  signalType: RiskSignalTypeDto;
  description: string;
  detectedAt: string;
};

export type DepositSafetyStatusDto = 'CALCULATED' | 'UNAVAILABLE' | 'FAILED';
export type DepositSafetyUnavailableReasonDto =
  | 'NO_MARKET_PRICE'
  | 'NO_DEPOSIT_INFO'
  | 'NOT_APPLICABLE_TRANSACTION_TYPE' // 월세
  | 'INSUFFICIENT_MARKET_DATA';

export type DepositSafetyCheckDto = {
  status: DepositSafetyStatusDto;
  jeonseRatio: number | null; // 0.82 = 82%
  seniorDeposit: number | null;
  maxClaimAmount: number | null;
  explanation: string | null;
  unavailableReason: DepositSafetyUnavailableReasonDto | null;
  exceedsRecommendedRatio: boolean; // 150% 초과 시 "입력값을 다시 확인해주세요"
  calculatedAt: string | null;
};
```

`market-data-design.md`에서 이미 지적했듯, **판정불가/실패 사유를 세분화하려면 문자열 status 하나가 아니라 이렇게 사유를 담을 필드가 반드시 필요**합니다 — 같은 실수를 이 도메인에서 반복하지 않으려면 처음부터 사유 필드를 계약에 넣는 게 좋습니다.

## 제안: 화면 반영 지점

| 요구사항 | 제안 위치 |
| --- | --- |
| 매물 상세에서 허위매물 의심 신호 확인 | `PropertyDetailClient`의 "확인 필요 신호" 카드 — 지금 정적 `riskSummaries`를 `property.riskSignals`(API 응답)로 교체 |
| "확인 필요 신호 N개 발견" 요약 | 이미 있는 `checkSignalCount` 배지를 실데이터로 채우기만 하면 됨 |
| 판정 불가 사유 안내 | 지금은 "준비 중" 고정 문구뿐 — `unavailableReason`을 받으면 그에 맞는 문구로 분기 필요(예: "주소 정보가 부족해 비교할 수 없어요") |
| 보증금 안전성(전세가율) 확인 | 매물 상세뿐 아니라 요구사항이 명시한 대로 계약 문구 분석 화면(`/contract/result`)에도 필요 — 지금 `/contract/result`의 "보증금" 탭은 완전 정적 데이터(`contract-analysis-design.md` 참고)라 여기 실데이터를 연결하는 게 자연스러운 통합 지점 |
| 선순위보증금/근저당 채권최고액 선택 입력 | **완전히 새로 만들어야 하는 UI** — 지금 매물 등록/체크리스트 어디에도 이 값을 입력받는 폼이 없음. "논의중" 항목(입력 시점을 매물 등록 때 받을지, 체크리스트 서류·행정 카테고리에서 받을지)이 확정돼야 어느 화면에 넣을지 정해짐 |
| 150% 초과 시 "입력값을 다시 확인해주세요" | 신규 — 지금 어떤 폼에도 이런 경고 배너 패턴이 없어 새로 만들어야 함 |
| "전세만 대상, 월세는 판정불가" 명확 안내 | 신규 — 지금 매물 상세 어디에도 "이 계산은 전세 매물에만 적용됩니다" 같은 문구가 없음. 월세 매물 상세에서는 이 섹션 자체를 다르게 보여줘야 함(판정불가 사유: 거래유형) |
| checklist 소유권취득일 + 높은 전세가율 조합 보조 신호 | 신규 — `checklist-design.md`에서도 이미 "화면에 자리 자체가 없다"고 지적한 부분과 동일. 이 신호를 매물 상세 어디에 넣을지(체크리스트 화면 vs 매물 상세) 설계 필요 |

## 요구사항의 "논의중"(🔶) 항목 — FE 관점에서도 그대로 미확정으로 남겨둠

요구사항 문서 자체가 3곳을 "논의중"으로 표시해뒀습니다. FE 설계도 이 확정을 기다려야 하는 지점이라 그대로 옮겨 적습니다:

1. **동일 계정 다수 등록 탐지 기준(계정 수/기간/지역 다양성 임계값)** — 확정되기 전까지는 이 신호 타입 자체를 노출할지 말지 판단 불가. 요구사항도 "정책 플래그로 켜고 끌 수 있게" 구현하라고 되어 있으므로, FE도 신호 목록에 이 타입이 오면 표시하고 안 오면 표시 안 하는 식으로(신호 유무 기반 렌더링) 만들면 이 확정 여부와 무관하게 동작 가능
2. **전세 전용 계산이라는 점을 어떻게 화면에서 안내할지 문구 미확정**
3. **선순위보증금/근저당 입력을 어느 화면 흐름에서 받을지 미확정** — 매물 등록 vs 체크리스트 서류·행정 카테고리

## 남은 이슈 / 확인 필요 총정리

1. **이 도메인은 Frontend에 구현이 전혀 없음** — 이 문서는 구현 후 재검증이 필요한 "제안" 단계
2. **Backend API 계약이 먼저 확정돼야 함** — 특히 판정불가/실패 사유를 구분할 수 있는 필드가 처음부터 있어야, market-data 도메인에서 겪은 "사유 구분 불가" 문제를 반복하지 않음
3. **선순위보증금/근저당 채권최고액 입력 폼이 완전히 새로 필요** — 어느 화면(매물 등록/체크리스트)에 넣을지는 위 "논의중 3번" 확정이 선행 조건
4. **`/contract/result`의 "보증금" 탭이 이 도메인의 실제 진입점이 될 가능성이 높음** — 지금 그 탭이 완전 정적 데이터라는 걸 `contract-analysis-design.md`에서 이미 지적했는데, 이 도메인이 실제로 붙으면 그 탭을 채우는 데이터 소스가 됨
