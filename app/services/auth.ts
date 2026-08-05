import { getApiBaseUrl, requestJson } from '../lib/api/http';
import { type MeResponseDto, type PasswordPolicyDto } from '../types/api';

export function getGoogleLoginUrl(): string {
  return `${getApiBaseUrl()}/oauth2/authorization/google`;
}

export function getKakaoLoginUrl(): string {
  return `${getApiBaseUrl()}/oauth2/authorization/kakao`;
}

export async function getCurrentUser(cookieHeader?: string): Promise<MeResponseDto> {
  return requestJson<MeResponseDto>('/auth/me', cookieHeader ? { headers: { Cookie: cookieHeader } } : undefined);
}

// 회원가입/비밀번호 변경 폼의 <input pattern="..."> 값을 여기서 받아온다 — backend
// PasswordPolicy가 유일한 소스이고, 프론트는 이 값을 하드코딩해두지 않는다.
export async function getPasswordPolicy(): Promise<PasswordPolicyDto> {
  return requestJson<PasswordPolicyDto>('/auth/password-policy');
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

// 개발 편의용 "관리자로 로그인" 버튼 전용. 백엔드가 DEV_LOGIN_ENABLED=false(기본값)면 404를
// 반환하므로, 이 함수 자체는 운영에서 호출돼도 아무 계정에도 로그인시키지 못한다.
export async function devLogin(): Promise<MeResponseDto> {
  return requestJson<MeResponseDto>('/auth/dev-login', { method: 'POST' });
}
