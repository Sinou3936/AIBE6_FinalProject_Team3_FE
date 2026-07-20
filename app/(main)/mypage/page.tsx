import { getMyPageOverview } from '../../services/mypage';
import { type MyPageOverview } from '../../types/domain';
import { MyPageClient } from './MyPageClient';

export const dynamic = 'force-dynamic';

const emptyOverview: MyPageOverview = {
  activityHistory: [],
  bookmarkedProperties: [],
};

export default async function Page() {
  let overview = emptyOverview;
  let loadError: string | undefined;

  try {
    overview = await getMyPageOverview();
  } catch {
    loadError = '마이페이지 정보를 불러오지 못했습니다. API 설정을 확인해 주세요.';
  }

  return <MyPageClient overview={overview} loadError={loadError} />;
}
