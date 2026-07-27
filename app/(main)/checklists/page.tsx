import { cookies } from 'next/headers';
import { getMyChecklistOverviews } from '../../services/checklist';
import { type ChecklistOverview } from '../../types/domain';
import { ChecklistOverviewClient } from './ChecklistOverviewClient';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const cookieHeader = (await cookies()).toString();
  let overviews: ChecklistOverview[] = [];
  let loadError: string | undefined;

  try {
    overviews = await getMyChecklistOverviews(cookieHeader);
  } catch {
    loadError = '체크리스트 목록을 불러오지 못했습니다. API 설정을 확인해 주세요.';
  }

  return <ChecklistOverviewClient overviews={overviews} loadError={loadError} />;
}
