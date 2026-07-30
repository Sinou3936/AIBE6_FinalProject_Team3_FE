'use client';

import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { type ChecklistOverview } from '../../types/domain';
import { Badge } from '../../ui/Badge';

const statusLabelMap: Record<ChecklistOverview['status'], string> = {
  NOT_STARTED: '시작 전',
  IN_PROGRESS: '진행 중',
  COMPLETED: '완료',
};

const statusColorMap: Record<ChecklistOverview['status'], string> = {
  NOT_STARTED: 'bg-slate-100 text-slate-600',
  IN_PROGRESS: 'bg-teal-50 text-teal-700',
  COMPLETED: 'bg-emerald-50 text-emerald-700',
};

type ChecklistOverviewClientProps = {
  overviews: ChecklistOverview[];
  loadError?: string;
};

export function ChecklistOverviewClient({ overviews, loadError }: ChecklistOverviewClientProps) {
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="border-b border-slate-200 bg-white py-10">
        <div className="container mx-auto max-w-3xl px-4">
          <h1 className="ansim-page-title mb-3">내 체크리스트</h1>
          <p className="ansim-page-description">등록한 매물별로 현장 체크리스트 진행 상황을 확인하세요.</p>
        </div>
      </div>

      <div className="container mx-auto max-w-3xl px-4 py-8">
        {loadError && (
          <div className="ansim-card mb-4 border-red-100 bg-red-50 p-4 text-sm text-red-700">{loadError}</div>
        )}

        {!loadError && overviews.length === 0 && (
          <div className="ansim-card flex flex-col items-center gap-4 p-8 text-center text-sm text-slate-500">
            등록된 매물이 없습니다. 매물을 먼저 등록해 주세요.
            <Link href="/properties/register" className="ansim-button-primary px-5 py-3">
              매물 등록하러 가기
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 gap-4">
          {overviews.map((overview) => (
            <Link
              key={overview.propertyId}
              href={`/properties/${overview.propertyId}/checklist`}
              className="ansim-card group block p-5 transition hover:border-teal-200"
            >
              <div className="mb-2 flex items-start justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-teal-50 text-teal-700">{overview.tradeType}</Badge>
                  <Badge className={statusColorMap[overview.status]}>{statusLabelMap[overview.status]}</Badge>
                </div>
                {/* TODO: 실제 최종 점검일 데이터 연동 필요 — Backend GET /checklists 응답에 필드 추가 후 채움 */}
                <span className="shrink-0 text-xs text-slate-400">최종 점검일: -</span>
              </div>
              <h2 className="mb-1 text-lg font-bold text-slate-950 group-hover:text-teal-700">
                {overview.propertyTitle}
              </h2>
              <p className="flex items-center gap-1 text-sm text-slate-500">
                <MapPin className="h-4 w-4" /> {overview.address}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
