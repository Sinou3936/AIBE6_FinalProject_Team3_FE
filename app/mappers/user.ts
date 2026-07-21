import {
  type ProfileRegisterRequestDto,
  type ProfileUpdateRequestDto,
  type UserProfileDto,
  type UserTransactionTypeDto,
} from '../types/api';
import { type ProfileUpdateInput, type UserProfile, type UserTransactionType } from '../types/domain';

const transactionTypeDtoToDomain: Record<UserTransactionTypeDto, UserTransactionType> = {
  JEONSE: '전세',
  WOLSE: '월세',
  MAEMAE: '매매',
};

const transactionTypeDomainToDto: Record<UserTransactionType, UserTransactionTypeDto> = {
  전세: 'JEONSE',
  월세: 'WOLSE',
  매매: 'MAEMAE',
};

export function mapUserProfileDto(dto: UserProfileDto): UserProfile {
  return {
    nickname: dto.nickname,
    profileImageUrl: dto.profileImageUrl,
    interestRegion: dto.interestRegion,
    transactionType: dto.transactionType ? transactionTypeDtoToDomain[dto.transactionType] : null,
    currentStage: dto.currentStage,
  };
}

export function mapProfileUpdateInputToDto(input: ProfileUpdateInput): ProfileUpdateRequestDto {
  return {
    nickname: input.nickname,
    interestRegion: input.interestRegion,
    transactionType: input.transactionType ? transactionTypeDomainToDto[input.transactionType] : undefined,
    currentStage: input.currentStage,
  };
}

export function mapProfileFormInputToRegisterDto(input: ProfileUpdateInput): ProfileRegisterRequestDto {
  if (!input.transactionType) {
    throw new Error('거래 유형을 선택해 주세요.');
  }

  return {
    nickname: input.nickname,
    interestRegion: input.interestRegion,
    transactionType: transactionTypeDomainToDto[input.transactionType],
    currentStage: input.currentStage,
  };
}
