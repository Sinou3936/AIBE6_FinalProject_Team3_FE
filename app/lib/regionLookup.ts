import { regions } from '../data/regions_nested';

// regions_nested.ts는 시·군·구 안에 읍·면·동뿐 아니라 그 하위 리(里) 단위 세부 코드까지 행으로
// 갖고 있어(예: "강동면"이 코드만 다르게 여러 번 나옴), 화면에 필요한 건 이름 집합뿐이라
// 중복을 제거해서 돌려준다. Route Handler(app/api/regions/*)에서만 쓰는 서버 전용 조회 함수라,
// 이 파일은 클라이언트 컴포넌트에서 import하면 안 된다(그러면 regions_nested.ts 전체가 다시
// 클라이언트 번들에 딸려 들어간다).
function uniqueNames(items: readonly { name: string }[]): string[] {
  return Array.from(new Set(items.map((item) => item.name)));
}

export function findSigunguNames(sido: string | null): string[] {
  const sidoItem = sido ? regions.find((region) => region.name === sido) : undefined;
  return sidoItem ? uniqueNames(sidoItem.sigungu) : [];
}

export function findEupmyeondongNames(sido: string | null, sigungu: string | null): string[] {
  const sidoItem = sido ? regions.find((region) => region.name === sido) : undefined;
  const sigunguItem = sigungu ? sidoItem?.sigungu.find((item) => item.name === sigungu) : undefined;
  return sigunguItem ? uniqueNames(sigunguItem.eupmyeondong) : [];
}
