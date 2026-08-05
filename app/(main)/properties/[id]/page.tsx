import { cookies } from 'next/headers';
import { getPropertyById } from '../../../services/properties';
import { type PropertyDetail } from '../../../types/domain';
import { PropertyDetailClient } from './PropertyDetailClient';

export const dynamic = 'force-dynamic';

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const cookieHeader = (await cookies()).toString();

  let property: PropertyDetail | undefined;
  let loadError: string | undefined;

  try {
    property = await getPropertyById(Number(id), cookieHeader);
  } catch {
    loadError = '매물 정보를 불러오지 못했습니다. API 설정을 확인해 주세요.';
  }

  return <PropertyDetailClient property={property} loadError={loadError} />;
}
