'use client';

import { ChevronLeft, ChevronRight, Loader2, Plus } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { cn } from '../../lib/cn';
import { getProperties } from '../../services/properties';
import { type ChecklistProgress, type PropertyListPage } from '../../types/domain';
import { PropertyListItem } from '../../ui/PropertyListItem';

// BE 기본값(20)과 별개로, 목록 화면 UI상 한 섹션에 보여줄 카드 개수는 FE가 정한다
// (checklists/page.tsx, ContractHistorySection.tsx와 동일 패턴).
const PAGE_SIZE = 5;
// 페이지 번호를 5개씩 묶어서 보여준다(PropertiesClient.tsx #195/6-2와 동일한 UX) - "이전"/"다음"은
// 그 묶음 단위로 이동한다.
const PAGE_GROUP_SIZE = 5;

const emptyPage: PropertyListPage = {
  items: [],
  page: 0,
  size: PAGE_SIZE,
  totalElements: 0,
  totalPages: 0,
  hasNext: false,
};

type PropertyListSectionProps = {
  // "등록 매물 N개 · 확인 필요 신호 N개" 요약 줄은 매물 전체를 봐야 계산할 수 있는 합계라
  // (신호 개수 합산에 전체 매물이 필요), 5개씩 페이지네이션되는 이 컴포넌트의 조회만으로는
  // 알 수 없다 - 부모(mypage/page.tsx)가 이미 하고 있는 전체 조회 결과를 그대로 props로 받는다.
  totalCount: number;
  signalCount: number;
  countLoadError?: string;
  checklistProgressByPropertyId: Record<number, ChecklistProgress>;
};

// ContractHistorySection.tsx와 같은 이유로 이 섹션이 자체 page state로 목록을 따로 불러온다
// (마이페이지 전체 URL을 이 섹션 하나의 페이지네이션에 묶고 싶지 않아서).
export function PropertyListSection({
  totalCount,
  signalCount,
  countLoadError,
  checklistProgressByPropertyId,
}: PropertyListSectionProps) {
  const [page, setPage] = useState(0);
  const [propertyPage, setPropertyPage] = useState<PropertyListPage>(emptyPage);
  const [loadError, setLoadError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // page가 바뀌어 이 effect가 재실행될 때만 의미 있는 재설정이다(최초 실행 시 초기값과 동일) -
    // 페이지 변경 시 새 로딩 상태를 보여줘야 하므로 의도적으로 동기 호출한다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);

    getProperties(undefined, { page, size: PAGE_SIZE })
      .then((result) => {
        if (!cancelled) {
          setPropertyPage(result);
          setLoadError(undefined);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError('등록 매물을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page]);

  const { items, totalPages } = propertyPage;

  const currentGroupStart = Math.floor(page / PAGE_GROUP_SIZE) * PAGE_GROUP_SIZE;
  const currentGroupEnd = Math.min(currentGroupStart + PAGE_GROUP_SIZE - 1, totalPages - 1);
  const pageNumbers = Array.from(
    { length: Math.max(currentGroupEnd - currentGroupStart + 1, 0) },
    (_, index) => currentGroupStart + index,
  );
  const hasPrevGroup = currentGroupStart > 0;
  const hasNextGroup = currentGroupEnd < totalPages - 1;

  return (
    <div className="mb-8">
      <div className="mb-1 flex items-center justify-between">
        <h2 className="text-lg font-bold text-slate-950">등록 매물</h2>
        <Link
          href="/properties/register"
          className="flex items-center gap-1 text-sm font-bold text-teal-700 hover:text-teal-800"
        >
          <Plus className="h-4 w-4" /> 매물 등록
        </Link>
      </div>

      {countLoadError ? (
        <p className="mb-4 text-sm text-red-600">{countLoadError}</p>
      ) : (
        <p className="mb-4 text-sm text-slate-500">
          등록 매물 {totalCount}개 · 확인 필요 신호 {signalCount}개
        </p>
      )}

      {loadError && (
        <div className="ansim-card mb-4 border-red-100 bg-red-50 p-4 text-sm text-red-700">{loadError}</div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
        </div>
      ) : (
        <>
          {!loadError && items.length === 0 && (
            <div className="ansim-card p-6 text-center text-sm text-slate-500">
              <p className="mb-4">아직 등록한 매물이 없어요</p>
              <Link href="/properties/register" className="ansim-button-primary inline-flex w-fit px-5 py-3">
                <Plus className="h-4 w-4" /> 매물 등록하기
              </Link>
            </div>
          )}

          {items.length > 0 && (
            <div className="space-y-4">
              {items.map((property) => (
                <PropertyListItem
                  key={property.id}
                  property={property}
                  checklistProgress={checklistProgressByPropertyId[property.id]}
                />
              ))}
            </div>
          )}

          {!loadError && totalPages > 1 && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setPage(0)}
                disabled={page === 0}
                className={cn(
                  'rounded-xl border px-3 py-2 text-sm font-bold transition',
                  page === 0
                    ? 'cursor-not-allowed border-slate-100 text-slate-300'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                )}
              >
                처음
              </button>
              <button
                type="button"
                onClick={() => setPage(currentGroupStart - 1)}
                disabled={!hasPrevGroup}
                className={cn(
                  'flex items-center gap-1 rounded-xl border px-3 py-2 text-sm font-bold transition',
                  hasPrevGroup
                    ? 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    : 'cursor-not-allowed border-slate-100 text-slate-300',
                )}
              >
                <ChevronLeft className="h-4 w-4" /> 이전
              </button>

              {pageNumbers.map((pageNumber) => (
                <button
                  type="button"
                  key={pageNumber}
                  onClick={() => setPage(pageNumber)}
                  aria-current={pageNumber === page ? 'page' : undefined}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-xl border text-sm font-bold transition',
                    pageNumber === page
                      ? 'border-slate-950 bg-slate-950 text-white'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                  )}
                >
                  {pageNumber + 1}
                </button>
              ))}

              <button
                type="button"
                onClick={() => setPage(currentGroupEnd + 1)}
                disabled={!hasNextGroup}
                className={cn(
                  'flex items-center gap-1 rounded-xl border px-3 py-2 text-sm font-bold transition',
                  hasNextGroup
                    ? 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    : 'cursor-not-allowed border-slate-100 text-slate-300',
                )}
              >
                다음 <ChevronRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setPage(totalPages - 1)}
                disabled={page === totalPages - 1}
                className={cn(
                  'rounded-xl border px-3 py-2 text-sm font-bold transition',
                  page === totalPages - 1
                    ? 'cursor-not-allowed border-slate-100 text-slate-300'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                )}
              >
                마지막
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
