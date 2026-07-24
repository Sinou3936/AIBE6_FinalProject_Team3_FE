import { createOrGetChecklist } from '../../../../services/checklist';
import { type Checklist } from '../../../../types/domain';
import { ChecklistClient } from './ChecklistClient';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  let checklist: Checklist | undefined;
  let loadError: string | undefined;

  try {
    checklist = await createOrGetChecklist(Number(id));
  } catch {
    loadError = '체크리스트를 불러오지 못했습니다. API 설정을 확인해 주세요.';
  }

  return <ChecklistClient propertyId={Number(id)} checklist={checklist} loadError={loadError} />;
}
