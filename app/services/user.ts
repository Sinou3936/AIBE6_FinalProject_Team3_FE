import { useMockData } from '../config/dataSource';
import { requestJson } from '../lib/api/http';
import { mapProfileFormInputToRegisterDto, mapProfileUpdateInputToDto, mapUserProfileDto } from '../mappers/user';
import {
  checkMockNicknameAvailable,
  getMockUserProfile,
  registerMockUserProfile,
  updateMockUserProfile,
} from '../repositories/userRepository';
import { type NicknameCheckResponseDto, type UserProfileDto } from '../types/api';
import { type ProfileUpdateInput, type UserProfile } from '../types/domain';

export async function getMyProfile(): Promise<UserProfile> {
  if (useMockData) {
    return getMockUserProfile();
  }

  const dto = await requestJson<UserProfileDto>('/users/me');
  return mapUserProfileDto(dto);
}

export async function registerProfile(input: ProfileUpdateInput): Promise<UserProfile> {
  if (useMockData) {
    return registerMockUserProfile(input);
  }

  const dto = await requestJson<UserProfileDto>('/users/me/profile', {
    method: 'POST',
    body: JSON.stringify(mapProfileFormInputToRegisterDto(input)),
  });
  return mapUserProfileDto(dto);
}

export async function updateMyProfile(input: ProfileUpdateInput): Promise<UserProfile> {
  if (useMockData) {
    return updateMockUserProfile(input);
  }

  const dto = await requestJson<UserProfileDto>('/users/me', {
    method: 'PATCH',
    body: JSON.stringify(mapProfileUpdateInputToDto(input)),
  });
  return mapUserProfileDto(dto);
}

export async function checkNicknameAvailability(nickname: string): Promise<boolean> {
  if (useMockData) {
    return checkMockNicknameAvailable(nickname);
  }

  const dto = await requestJson<NicknameCheckResponseDto>(
    `/users/nickname-check?nickname=${encodeURIComponent(nickname)}`,
  );
  return dto.available;
}
