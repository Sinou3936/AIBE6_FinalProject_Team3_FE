import { cookies } from 'next/headers';
import { getProperties } from '../../services/properties';
import { type PropertySummary } from '../../types/domain';
import { PropertiesClient } from './PropertiesClient';

export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams: Promise<{ notice?: string }>;
};

export default async function Page({ searchParams }: PageProps) {
  const cookieHeader = (await cookies()).toString();
  const { notice } = await searchParams;

  let properties: PropertySummary[] = [];
  let loadError: string | undefined;

  try {
    properties = await getProperties(cookieHeader);
  } catch {
    loadError = '매물 정보를 불러오지 못했습니다. API 설정을 확인해 주세요.';
  }

  return <PropertiesClient properties={properties} loadError={loadError} notice={notice} />;
}
