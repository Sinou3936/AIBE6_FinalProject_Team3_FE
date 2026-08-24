import {
  type ProfileRegisterRequestDto,
  type ProfileUpdateRequestDto,
  type UserProfileDto,
  type UserTransactionTypeDto,
} from '../types/api';
import { type ProfileUpdateInput, type UserProfile, type UserTransactionType } from '../types/domain';

const transactionTypeDtoToDomain: Record<UserTransactionTypeDto, UserTransactionType> = {
  JEONSE: '전세',
  MONTHLY_RENT: '월세',
};

const transactionTypeDomainToDto: Record<UserTransactionType, UserTransactionTypeDto> = {
  전세: 'JEONSE',
  월세: 'MONTHLY_RENT',
};

export function mapUserProfileDto(dto: UserProfileDto): UserProfile {
  return {
    nickname: dto.nickname,
    email: dto.email,
    profileImageUrl: dto.profileImageUrl,
    interestRegion: dto.interestRegion,
    transactionType: dto.transactionType ? transactionTypeDtoToDomain[dto.transactionType] : null,
    hasPassword: dto.hasPassword,
  };
}

export function mapProfileUpdateInputToDto(input: ProfileUpdateInput): ProfileUpdateRequestDto {
  return {
    nickname: input.nickname,
    interestRegion: input.interestRegion,
    transactionType: input.transactionType ? transactionTypeDomainToDto[input.transactionType] : undefined,
  };
}

export function mapProfileFormInputToRegisterDto(input: ProfileUpdateInput): ProfileRegisterRequestDto {
  if (!input.transactionType) {
    throw new Error('거래 유형을 선택해 주세요.');
  }

  return {
    interestRegion: input.interestRegion,
    transactionType: transactionTypeDomainToDto[input.transactionType],
  };
}
