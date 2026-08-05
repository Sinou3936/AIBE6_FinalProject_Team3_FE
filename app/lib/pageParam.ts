// searchParams의 page는 URL을 통해 그대로 들어오는 문자열이라 뭐든 될 수 있다(?page=abc, 음수,
// 소수 등). Number()만 거치면 NaN/음수가 그대로 API 요청에 실려나가 실제 백엔드에서는 400, mock
// 저장소에서는 Array.prototype.slice가 NaN/음수를 조용히 0으로 취급해버려 빈 목록이 잘못 뜬다.
// 항상 0 이상의 정수로 정규화해, 알 수 없는 입력은 첫 페이지로 되돌린다.
export function parsePageParam(raw: string | undefined): number {
  const parsed = Number(raw);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
}
