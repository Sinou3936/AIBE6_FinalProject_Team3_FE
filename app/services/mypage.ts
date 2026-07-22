import { useMockData } from '../config/dataSource';
import { requestJson } from '../lib/api/http';
import { mapMyPageOverviewDto } from '../mappers/mypage';
import { getMockMyPageOverview } from '../repositories/myPageRepository';
import { type MyPageOverviewDto } from '../types/api';
import { type MyPageOverview } from '../types/domain';

export async function getMyPageOverview(cookieHeader?: string): Promise<MyPageOverview> {
  if (useMockData) {
    return getMockMyPageOverview();
  }

  const dto = await requestJson<MyPageOverviewDto>(
    '/mypage',
    cookieHeader ? { headers: { Cookie: cookieHeader } } : undefined,
  );
  return mapMyPageOverviewDto(dto);
}
