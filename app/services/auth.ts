import { getApiBaseUrl, requestJson } from '../lib/api/http';
import { type MeResponseDto } from '../types/api';

export { refreshSession } from '../lib/api/http';

export function getGoogleLoginUrl(): string {
  return `${getApiBaseUrl()}/oauth2/authorization/google`;
}

export function getKakaoLoginUrl(): string {
  return `${getApiBaseUrl()}/oauth2/authorization/kakao`;
}

export async function getCurrentUser(cookieHeader?: string): Promise<MeResponseDto> {
  return requestJson<MeResponseDto>('/auth/me', cookieHeader ? { headers: { Cookie: cookieHeader } } : undefined);
}

export async function logout(): Promise<void> {
  await requestJson<void>('/auth/logout', { method: 'POST' });
}

export type LocalSignupInput = {
  email: string;
  password: string;
  nickname: string;
};

export type LocalLoginInput = {
  email: string;
  password: string;
};

export async function signup(input: LocalSignupInput): Promise<MeResponseDto> {
  return requestJson<MeResponseDto>('/auth/signup', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function login(input: LocalLoginInput): Promise<MeResponseDto> {
  return requestJson<MeResponseDto>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export type PasswordUpdateInput = {
  // 구글/카카오 전용 계정이 처음 비밀번호를 설정하는 경우엔 비교할 기존 비밀번호가 없으므로 생략한다.
  currentPassword?: string;
  newPassword: string;
};

export async function updatePassword(input: PasswordUpdateInput): Promise<void> {
  await requestJson<void>('/auth/password', {
    method: 'PATCH',
    body: JSON.stringify(input),
  });
}
