import { cookies } from 'next/headers';
import { ApiError } from '../../lib/api/http';
import { getProperties, type GetPropertiesParams } from '../../services/properties';
import { type PropertyTransactionTypeDto, type PropertyTypeDto } from '../../types/api';
import { type PropertyListPage } from '../../types/domain';
import { PropertiesClient, type PropertiesFilter } from './PropertiesClient';

export const dynamic = 'force-dynamic';

type PageProps = {
  searchParams: Promise<{
    notice?: string;
    page?: string;
    region?: string;
    minArea?: string;
    maxArea?: string;
    transactionType?: string;
    propertyType?: string;
    minDeposit?: string;
    maxDeposit?: string;
    minMonthlyRent?: string;
    maxMonthlyRent?: string;
    sort?: string;
  }>;
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

const VALID_TRANSACTION_TYPES: PropertyTransactionTypeDto[] = ['JEONSE', 'MONTHLY_RENT'];
const VALID_PROPERTY_TYPES: PropertyTypeDto[] = ['OFFICETEL', 'MULTI_FAMILY', 'DETACHED_HOUSE'];
// BE가 허용하는 정렬 필드는 createdAt/deposit/area 뿐이다(PageableUtils.validateSort 참고).
// createdAt,desc(최신순)는 BE 기본값이라 굳이 명시적으로 보낼 값 목록에 넣지 않았다 - sort를
// 생략해도 동일한 결과가 나온다.
const VALID_SORT_VALUES = ['deposit,asc', 'deposit,desc', 'area,asc', 'area,desc'];

function parsePositiveNumber(value: string | undefined): number | undefined {
  if (!value) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export default async function Page({ searchParams }: PageProps) {
  const cookieHeader = (await cookies()).toString();
  const {
    notice,
    page: pageParam,
    region,
    minArea,
    maxArea,
    transactionType,
    propertyType,
    minDeposit,
    maxDeposit,
    minMonthlyRent,
    maxMonthlyRent,
    sort,
  } = await searchParams;

  // 잘못되거나 없는 page 값은 0페이지로 취급 - URL을 직접 건드려도 안전하게 첫 페이지를 보여준다.
  const parsedPage = Number(pageParam);
  const page = Number.isInteger(parsedPage) && parsedPage >= 0 ? parsedPage : 0;

  // URL 쿼리로 넘어온 enum 값이 BE가 허용하지 않는 값이면(직접 URL 조작 등) 조건 자체를 무시한다.
  const filter: PropertiesFilter = {
    region: region?.trim() ? region.trim() : undefined,
    minArea: parsePositiveNumber(minArea),
    maxArea: parsePositiveNumber(maxArea),
    transactionType: VALID_TRANSACTION_TYPES.includes(transactionType as PropertyTransactionTypeDto)
      ? (transactionType as PropertyTransactionTypeDto)
      : undefined,
    propertyType: VALID_PROPERTY_TYPES.includes(propertyType as PropertyTypeDto)
      ? (propertyType as PropertyTypeDto)
      : undefined,
    minDeposit: parsePositiveNumber(minDeposit),
    maxDeposit: parsePositiveNumber(maxDeposit),
    minMonthlyRent: parsePositiveNumber(minMonthlyRent),
    maxMonthlyRent: parsePositiveNumber(maxMonthlyRent),
    sort: sort && VALID_SORT_VALUES.includes(sort) ? sort : undefined,
  };

  const requestParams: GetPropertiesParams = { page, size: PAGE_SIZE, ...filter };

  let propertyPage: PropertyListPage = emptyPage;
  let loadError: string | undefined;

  try {
    propertyPage = await getProperties(cookieHeader, requestParams);
  } catch (error) {
    const errorBody = error instanceof ApiError ? error.body : null;
    if (errorBody && errorBody.code === 'PROPERTY_INVALID_SEARCH_CONDITION') {
      loadError = errorBody.message;
    } else {
      loadError = '매물 정보를 불러오지 못했습니다. API 설정을 확인해 주세요.';
    }
  }

  return <PropertiesClient propertyPage={propertyPage} loadError={loadError} notice={notice} filter={filter} />;
}
