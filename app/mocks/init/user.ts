import { type UserProfileDto } from '../../types/api';

export const initUserProfileDto: UserProfileDto = {
  id: 1,
  email: 'ansim@example.com',
  nickname: '김안심',
  profileImageUrl: null,
  status: 'ACTIVE',
  interestRegion: '서울 관악구',
  transactionType: 'MONTHLY_RENT',
  hasPassword: false,
};
