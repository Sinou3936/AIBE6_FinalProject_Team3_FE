import { useMockData } from '../config/dataSource';
import { ApiError, requestJson } from '../lib/api/http';
import { mapProfileFormInputToRegisterDto, mapProfileUpdateInputToDto, mapUserProfileDto } from '../mappers/user';
import {
  checkMockNicknameAvailable,
  getMockUserProfile,
  registerMockUserProfile,
  updateMockUserProfile,
  uploadMockProfileImage,
} from '../repositories/userRepository';
import {
  type NicknameCheckResponseDto,
  type ProfileImageConfirmRequestDto,
  type ProfileImagePresignRequestDto,
  type ProfileImagePresignResponseDto,
  type UserProfileDto,
} from '../types/api';
import { type ProfileUpdateInput, type UserProfile } from '../types/domain';

export async function getMyProfile(cookieHeader?: string): Promise<UserProfile> {
  if (useMockData) {
    return getMockUserProfile();
  }

  const dto = await requestJson<UserProfileDto>(
    '/users/me',
    cookieHeader ? { headers: { Cookie: cookieHeader } } : undefined,
  );
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

export async function uploadProfileImage(file: File): Promise<UserProfile> {
  if (useMockData) {
    return uploadMockProfileImage(URL.createObjectURL(file));
  }

  // "image/jpeg" -> "jpeg", "image/png" -> "png". 둘 다 백엔드 PROFILE 허용 확장자(jpg/jpeg/png)에
  // 포함되므로, 신뢰할 수 없는 원본 파일명 대신 이미 검증된 MIME 타입에서 바로 뽑아 쓴다.
  const fileExtension = file.type.split('/')[1] ?? '';

  const presigned = await requestJson<ProfileImagePresignResponseDto>('/users/me/profile-image/presign', {
    method: 'POST',
    body: JSON.stringify({
      fileExtension,
      contentType: file.type,
      fileSize: file.size,
    } satisfies ProfileImagePresignRequestDto),
  });

  await putFileToPresignedUrl(presigned.uploadUrl, file);

  const dto = await requestJson<UserProfileDto>('/users/me/profile-image/confirm', {
    method: 'POST',
    body: JSON.stringify({ key: presigned.key } satisfies ProfileImageConfirmRequestDto),
  });
  return mapUserProfileDto(dto);
}

const UPLOAD_FAILED_MESSAGE = '프로필 사진 업로드에 실패했습니다. 잠시 후 다시 시도해 주세요.';

// presigned URL은 우리 API 서버가 아니라 S3 버킷을 직접 가리키므로 requestJson(항상 API_BASE_URL과
// credentials을 붙임)을 쓸 수 없다 - 인증 쿠키 없이, 서명이 요구하는 Content-Type/바이트만 그대로 보낸다.
async function putFileToPresignedUrl(uploadUrl: string, file: File): Promise<void> {
  let response: Response;
  try {
    response = await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
  } catch {
    throw new ApiError(UPLOAD_FAILED_MESSAGE, 0);
  }

  if (!response.ok) {
    throw new ApiError(UPLOAD_FAILED_MESSAGE, response.status);
  }
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
