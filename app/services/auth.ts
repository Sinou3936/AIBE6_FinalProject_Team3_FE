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
