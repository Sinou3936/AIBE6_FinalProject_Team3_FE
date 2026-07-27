import { cookies } from 'next/headers';
import { createOrGetChecklist, getChecklistResult } from '../../../../services/checklist';
import { getPropertyById } from '../../../../services/properties';
import { type ChecklistSummary } from '../../../../lib/checklistSummary';
import { type Checklist, type PropertyDetail } from '../../../../types/domain';
import { ChecklistClient } from './ChecklistClient';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const cookieHeader = (await cookies()).toString();
  const propertyId = Number(id);

  let checklist: Checklist | undefined;
  let summary: ChecklistSummary | undefined;
  let loadError: string | undefined;

  try {
    checklist = await createOrGetChecklist(propertyId, cookieHeader);
    summary = await getChecklistResult(checklist.id, cookieHeader);
  } catch {
    loadError = '체크리스트를 불러오지 못했습니다. API 설정을 확인해 주세요.';
  }

  // 매물 정보는 헤더 표시용 부가 정보라, 조회 실패해도 체크리스트 본문은 그대로 보여준다.
  let property: PropertyDetail | undefined;
  try {
    property = await getPropertyById(propertyId, cookieHeader);
  } catch {
    property = undefined;
  }

  return (
    <ChecklistClient
      propertyId={propertyId}
      checklist={checklist}
      initialSummary={summary}
      loadError={loadError}
      property={property}
    />
  );
}
