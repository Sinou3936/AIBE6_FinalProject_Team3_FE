import { cookies } from 'next/headers';
import { getProperties } from '../../services/properties';
import { type PropertyListPage } from '../../types/domain';
import { PropertiesClient } from './PropertiesClient';

export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams: Promise<{ notice?: string; page?: string }>;
};

// BE 기본값(20)과 별개로, 목록 화면 UI상 한 페이지에 보여줄 카드 개수는 FE가 정한다.
const PAGE_SIZE = 5;

const emptyPage: PropertyListPage = {
  items: [],
  page: 0,
  size: PAGE_SIZE,
  totalElements: 0,
  totalPages: 0,
  hasNext: false,
};

export default async function Page({ searchParams }: PageProps) {
  const cookieHeader = (await cookies()).toString();
  const { notice, page: pageParam } = await searchParams;

  // 잘못되거나 없는 page 값은 0페이지로 취급 - URL을 직접 건드려도 안전하게 첫 페이지를 보여준다.
  const parsedPage = Number(pageParam);
  const page = Number.isInteger(parsedPage) && parsedPage >= 0 ? parsedPage : 0;

  let propertyPage: PropertyListPage = emptyPage;
  let loadError: string | undefined;

  try {
    propertyPage = await getProperties(cookieHeader, { page, size: PAGE_SIZE });
  } catch {
    loadError = '매물 정보를 불러오지 못했습니다. API 설정을 확인해 주세요.';
  }

  return <PropertiesClient propertyPage={propertyPage} loadError={loadError} notice={notice} />;
}
