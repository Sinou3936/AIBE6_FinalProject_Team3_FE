import { cookies } from 'next/headers';
import { getAdminChecklistItemTemplates } from '../../../services/admin';
import { type AdminChecklistItemTemplateDto } from '../../../types/api';
import { AdminChecklistTemplatesClient } from './AdminChecklistTemplatesClient';

export const dynamic = 'force-dynamic';

export default async function AdminChecklistsPage() {
  const cookieHeader = (await cookies()).toString();

  let data: AdminChecklistItemTemplateDto[] | undefined;
  let loadError: string | undefined;

  try {
    data = await getAdminChecklistItemTemplates(cookieHeader);
  } catch {
    loadError = '체크리스트 문항을 불러오지 못했습니다.';
  }

  return <AdminChecklistTemplatesClient data={data} loadError={loadError} />;
}
