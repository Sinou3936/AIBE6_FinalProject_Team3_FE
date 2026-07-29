import { redirect } from 'next/navigation';
import { ApiError, isSessionInvalidErrorCode } from './api/http';

export type ProfileLoadFailure = 'not-found' | 'unknown';

// getMyProfile() 실패를 세 갈래로 나눈다:
// - 세션 무효(401): 여기서 바로 로그인 화면으로 리다이렉트한다(throw이므로 값을 반환하지 않음).
// - 존재하지 않음/탈퇴(404): UserService.getActiveUserOrThrow()가 둘을 같은 코드로 합쳐서 내려주므로
//   FE에서도 더 세분화할 방법이 없다 — 'not-found'로 반환해, 호출부가 세션을 정리하고 랜딩 페이지로
//   보내게 한다(AccountUnavailableRedirect 참고).
// - 그 외(네트워크 오류, 5xx 등): 'unknown'으로 반환해, 호출부가 기존처럼 "잠시 후 다시 시도" 문구를
//   보여주게 한다.
export function classifyProfileLoadError(error: unknown): ProfileLoadFailure {
  if (error instanceof ApiError) {
    if (isSessionInvalidErrorCode(error.body?.code)) {
      redirect('/login?error=session_expired');
    }
    if (error.status === 404) {
      return 'not-found';
    }
  }
  return 'unknown';
}
