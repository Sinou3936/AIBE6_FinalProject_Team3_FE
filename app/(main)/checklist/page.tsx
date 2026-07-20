import { getChecklistTemplate } from '../../services/checklist';
import { type ChecklistItem } from '../../types/domain';
import { ChecklistClient } from './ChecklistClient';

export const dynamic = 'force-dynamic';

export default async function Page() {
  let initialItems: ChecklistItem[] = [];
  let loadError: string | undefined;

  try {
    initialItems = await getChecklistTemplate();
  } catch {
    loadError = '체크리스트를 불러오지 못했습니다. API 설정을 확인해 주세요.';
  }

  return <ChecklistClient initialItems={initialItems} loadError={loadError} />;
}
