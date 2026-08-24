// 계약분석 이력 목록에서 매물과 연결되지 않은 항목(propertyTitle 없음)에 사용자가 직접 붙이는
// 라벨. 서버에는 저장하지 않고 이 브라우저에만 남긴다(다른 기기/브라우저에서는 안 보임) -
// sessionStorage(contractResultStorage.ts)와 달리 새로고침/재방문 후에도 남아있어야 해서
// localStorage를 쓴다. 두 함수 모두 클라이언트 전용 호출부(이벤트 핸들러/이미 클라이언트에서만
// 렌더링되는 목록의 렌더 중)에서만 쓰여 SSR 중에는 실행되지 않으므로 별도 가드가 필요 없다.
const STORAGE_KEY_PREFIX = 'contract-history-label:';

export function getContractHistoryLabel(historyId: number): string | null {
  return localStorage.getItem(`${STORAGE_KEY_PREFIX}${historyId}`);
}

export function removeContractHistoryLabel(historyId: number): void {
  localStorage.removeItem(`${STORAGE_KEY_PREFIX}${historyId}`);
}

// 앞뒤 공백을 정리한 뒤 빈 문자열이면 "라벨 삭제"로 보고 key 자체를 지운다(빈 문자열을 값으로
// 저장하지 않음 - 라벨 초기화 수단을 겸한다).
export function saveContractHistoryLabel(historyId: number, label: string): void {
  const trimmed = label.trim();
  if (trimmed) {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${historyId}`, trimmed);
  } else {
    removeContractHistoryLabel(historyId);
  }
}
