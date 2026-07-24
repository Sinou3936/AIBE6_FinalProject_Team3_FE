'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  MapPin,
  Plus,
  Search,
  ShieldAlert,
  SlidersHorizontal,
} from 'lucide-react';
import { cn } from '../../lib/cn';
import { type PropertySummary } from '../../types/domain';
import { Badge } from '../../ui/Badge';
import { NoticeBox } from '../../ui/NoticeBox';

type PropertiesClientProps = {
  properties: PropertySummary[];
  loadError?: string;
  notice?: string;
};

export function PropertiesClient({ properties, loadError, notice }: PropertiesClientProps) {
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState('전체');

  const filteredProperties = useMemo(() => {
    return properties.filter((property) => {
      const typeMatches = selectedType === '전체' || property.type === selectedType;
      const queryMatches =
        query.trim().length === 0 ||
        [property.title, property.address, property.type].some((value) => value.includes(query.trim()));
      return typeMatches && queryMatches;
    });
  }, [properties, query, selectedType]);

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="border-b border-slate-200 bg-white py-10">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <h1 className="ansim-page-title mb-3">매물 검증</h1>
              <p className="ansim-page-description">
                관심 매물을 등록하고 실거래가, 허위매물 의심 신호, 보증금 안전성 수치를 함께 확인하세요.
              </p>
            </div>
            <Link href="/properties/register" className="ansim-button-primary w-fit px-5 py-3">
              <Plus className="h-4 w-4" /> 매물 등록
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-[1fr_auto]">
            <div className="relative">
              <Search className="ansim-search-icon" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="매물명, 주소, 유형을 검색하세요"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-4 pl-12 pr-4 text-slate-950 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
              />
            </div>
            <button className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-bold text-slate-600">
              <SlidersHorizontal className="h-4 w-4" /> 상세 필터
            </button>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {['전체', '전세', '월세'].map((type) => (
            <button
              key={type}
              onClick={() => setSelectedType(type)}
              className={cn(
                'ansim-filter-pill',
                selectedType === type ? 'bg-slate-950 text-white' : 'ansim-filter-pill-muted',
              )}
            >
              {type}
            </button>
          ))}
        </div>

        {notice && (
          <div className="ansim-card mb-4 border-teal-100 bg-teal-50 p-4 text-sm text-teal-700">
            매물이 등록됐어요. {notice}
          </div>
        )}

        {loadError && <div className="ansim-card border-red-100 bg-red-50 p-6 text-sm text-red-700">{loadError}</div>}

        {!loadError && filteredProperties.length === 0 && (
          <div className="ansim-card p-6 text-sm text-slate-500">조건에 맞는 매물이 없습니다.</div>
        )}

        <div className="grid grid-cols-1 gap-5">
          {filteredProperties.map((property) => (
            <Link
              key={property.id}
              href={`/properties/${property.id}`}
              className="ansim-card group block p-6 transition hover:border-teal-200"
            >
              <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex-1">
                  <div className="mb-3 flex flex-wrap items-center gap-2">
                    <Badge className="bg-teal-50 text-teal-700">{property.type}</Badge>
                    {property.checkSignalCount !== undefined ? (
                      <Badge className={property.statusColor}>확인 필요 신호 {property.checkSignalCount}개</Badge>
                    ) : (
                      <Badge className="bg-slate-100 text-slate-500">신호 확인 준비 중</Badge>
                    )}
                    {property.jeonseRatio !== undefined ? (
                      <Badge className="bg-slate-100 text-slate-600">전세가율 {property.jeonseRatio}</Badge>
                    ) : (
                      <Badge className="bg-slate-100 text-slate-500">전세가율 준비 중</Badge>
                    )}
                  </div>
                  <h2 className="mb-2 text-xl font-bold text-slate-950 group-hover:text-teal-700">{property.title}</h2>
                  <p className="mb-4 flex items-center gap-1 text-sm text-slate-500">
                    <MapPin className="h-4 w-4" /> {property.address}
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="mb-1 text-xs text-slate-400">가격</p>
                      <p className="font-bold text-slate-950">{property.deposit}</p>
                      <p className="mt-1 text-xs text-slate-500">{property.maintenance ?? '관리비 정보 없음'}</p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="mb-1 text-xs text-slate-400">시세 대비</p>
                      {property.marketDelta !== undefined ? (
                        <p
                          className={cn(
                            'font-bold',
                            property.marketDelta.startsWith('+') ? 'text-orange-600' : 'text-emerald-600',
                          )}
                        >
                          {property.marketDelta}
                        </p>
                      ) : (
                        <p className="font-bold text-slate-400">준비 중</p>
                      )}
                      <p className="mt-1 text-xs text-slate-500">
                        {property.marketDelta !== undefined ? '최근 실거래가 기준' : '실거래가 연동 예정'}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-4">
                      <p className="mb-1 text-xs text-slate-400">체크리스트</p>
                      {property.checklist !== undefined ? (
                        <p className="font-bold text-slate-950">{property.checklist}% 완료</p>
                      ) : (
                        <p className="font-bold text-slate-400">준비 중</p>
                      )}
                      <p className="mt-1 text-xs text-slate-500">
                        {property.checklist !== undefined ? '방문 확인 진행률' : '체크리스트 연동 예정'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 lg:w-56 lg:grid-cols-1">
                  <div className="flex items-center gap-2 rounded-xl border border-slate-100 p-3">
                    <Building2 className="h-4 w-4 text-slate-400" />
                    <span className="text-xs font-medium text-slate-600">주소 중복 확인</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border border-slate-100 p-3">
                    <ShieldAlert className="h-4 w-4 text-orange-500" />
                    <span className="text-xs font-medium text-slate-600">보증금 수치 확인</span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl border border-slate-100 p-3">
                    <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    <span className="text-xs font-medium text-slate-600">현장 점검</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <NoticeBox icon={AlertTriangle} iconClassName="text-orange-500" className="mt-8">
          확인 필요 신호는 확정 판단이 아닌 참고용 정보입니다. 등기부등본, 보증보험 가능 여부, 실제 계약 조건은 별도로
          확인해야 합니다.
        </NoticeBox>
      </div>
    </div>
  );
}
