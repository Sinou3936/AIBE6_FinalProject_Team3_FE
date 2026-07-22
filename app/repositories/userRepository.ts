import { initUserProfileDto } from '../mocks/init/user';
import { mapProfileFormInputToRegisterDto, mapProfileUpdateInputToDto, mapUserProfileDto } from '../mappers/user';
import { type ProfileUpdateInput, type UserProfile } from '../types/domain';

let mockUserProfileDto = { ...initUserProfileDto };

// 목데이터 환경에서 중복확인 데모용으로 사용 중이라고 가정하는 닉네임 목록
const reservedMockNicknames = ['관리자', 'admin', 'test'];

export function getMockUserProfile(): UserProfile {
  return mapUserProfileDto(mockUserProfileDto);
}

export function checkMockNicknameAvailable(nickname: string): boolean {
  if (nickname === mockUserProfileDto.nickname) {
    return true;
  }
  return !reservedMockNicknames.includes(nickname);
}

export function registerMockUserProfile(input: ProfileUpdateInput): UserProfile {
  const request = mapProfileFormInputToRegisterDto(input);
  mockUserProfileDto = {
    ...mockUserProfileDto,
    ...(request.nickname !== undefined && { nickname: request.nickname }),
    interestRegion: request.interestRegion,
    transactionType: request.transactionType,
    currentStage: request.currentStage ?? null,
  };
  return mapUserProfileDto(mockUserProfileDto);
}

export function updateMockUserProfile(input: ProfileUpdateInput): UserProfile {
  const patch = mapProfileUpdateInputToDto(input);
  mockUserProfileDto = {
    ...mockUserProfileDto,
    ...(patch.nickname !== undefined && { nickname: patch.nickname }),
    ...(patch.profileImageUrl !== undefined && { profileImageUrl: patch.profileImageUrl }),
    ...(patch.interestRegion !== undefined && { interestRegion: patch.interestRegion }),
    ...(patch.transactionType !== undefined && { transactionType: patch.transactionType }),
    ...(patch.currentStage !== undefined && { currentStage: patch.currentStage }),
  };
  return mapUserProfileDto(mockUserProfileDto);
}
