import { createOrGetChecklist, getChecklistResult } from '../../../../services/checklist';
import { type ChecklistSummary } from '../../../../lib/checklistSummary';
import { type Checklist } from '../../../../types/domain';
import { ChecklistClient } from './ChecklistClient';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  let checklist: Checklist | undefined;
  let summary: ChecklistSummary | undefined;
  let loadError: string | undefined;

  try {
    checklist = await createOrGetChecklist(Number(id));
    summary = await getChecklistResult(checklist.id);
  } catch {
    loadError = '체크리스트를 불러오지 못했습니다. API 설정을 확인해 주세요.';
  }

  return (
    <ChecklistClient propertyId={Number(id)} checklist={checklist} initialSummary={summary} loadError={loadError} />
  );
}
