import { describe, expect, it } from 'vitest';
import { sanitizeNextPath } from './nextPath';

describe('sanitizeNextPath', () => {
  // proxy.ts의 matcher(보호 경로)에 있는 프리픽스는 전부 여기서도 허용돼야 한다 - 하나라도
  // 빠지면 그 경로에서 세션이 만료됐다가 재로그인해도 원래 있던 곳으로 못 돌아가고 /home으로
  // 밀린다. /admin이 proxy.ts matcher에는 있는데 여기 빠져있던 실제 회귀 버그가 있었다.
  it.each(['/home', '/properties', '/checklist', '/checklists', '/contract', '/mypage', '/admin'])(
    '허용 프리픽스 %s는 그대로 통과한다',
    (prefix) => {
      expect(sanitizeNextPath(prefix)).toBe(prefix);
      expect(sanitizeNextPath(`${prefix}/sub-path`)).toBe(`${prefix}/sub-path`);
    },
  );

  it('허용되지 않은 경로는 기본 경로로 대체한다', () => {
    expect(sanitizeNextPath('/unknown')).toBe('/home');
  });

  it('절대 URL이나 프로토콜 상대 URL은 오픈 리다이렉트 방지를 위해 대체한다', () => {
    expect(sanitizeNextPath('http://evil.com')).toBe('/home');
    expect(sanitizeNextPath('//evil.com')).toBe('/home');
  });

  it('null/undefined/빈 문자열은 기본 경로로 대체한다', () => {
    expect(sanitizeNextPath(null)).toBe('/home');
    expect(sanitizeNextPath(undefined)).toBe('/home');
    expect(sanitizeNextPath('')).toBe('/home');
  });
});
