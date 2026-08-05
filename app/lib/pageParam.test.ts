import { describe, expect, it } from 'vitest';
import { parsePageParam } from './pageParam';

describe('parsePageParam', () => {
  it('유효한 정수 문자열은 숫자로 파싱한다', () => {
    expect(parsePageParam('0')).toBe(0);
    expect(parsePageParam('3')).toBe(3);
  });

  it('undefined는 첫 페이지(0)로 취급한다', () => {
    expect(parsePageParam(undefined)).toBe(0);
  });

  // Number('abc')는 NaN이고, mock 저장소의 Array.prototype.slice(NaN, NaN)은 조용히 slice(0, 0)으로
  // 취급돼 빈 목록이 뜬다 - 에러 없이 잘못된 화면이 나오는 실제 회귀 버그였다.
  it('숫자가 아닌 문자열은 첫 페이지로 되돌린다', () => {
    expect(parsePageParam('abc')).toBe(0);
  });

  it('음수는 첫 페이지로 되돌린다', () => {
    expect(parsePageParam('-1')).toBe(0);
  });

  it('소수는 첫 페이지로 되돌린다', () => {
    expect(parsePageParam('1.5')).toBe(0);
  });
});
