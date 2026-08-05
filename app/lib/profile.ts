import { type UserProfile } from '../types/domain';

export function hasRegisteredProfile(profile: UserProfile): boolean {
  return Boolean(profile.interestRegion) && Boolean(profile.transactionType);
}
