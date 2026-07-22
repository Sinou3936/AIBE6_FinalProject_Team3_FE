import { getApiBaseUrl, requestJson } from '../lib/api/http';
import { type MeResponseDto } from '../types/api';

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
