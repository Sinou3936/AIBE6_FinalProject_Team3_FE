import { MapPin } from 'lucide-react';
import Link from 'next/link';
import { getJeonseRatioDisplay } from '../lib/jeonseRatio';
import { type PropertySummary } from '../types/domain';
import { Badge } from './Badge';

type PropertyListItemProps = {
  property: PropertySummary;
};

// TODO: 체크리스트 항목별 저장 API가 추가되면 실제 전체 문항 수/확인 개수/주의 개수로 교체하세요.
const CHECKLIST_TOTAL_ITEMS_MOCK = 20;

export function PropertyListItem({ property }: PropertyListItemProps) {
  const checklist = property.checklist ?? 0;
  const checklistStarted = checklist > 0;
  const checkedCount = Math.round((checklist / 100) * CHECKLIST_TOTAL_ITEMS_MOCK);
  const cautionCount = property.checkSignalCount ?? 0;

  return (
    <Link href={`/properties/${property.id}`} className="ansim-card block p-4 transition hover:border-teal-200">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge className="bg-teal-50 text-teal-700">{property.type}</Badge>
        {/* TODO: 백엔드에 주택유형(원룸/오피스텔 등) 필드가 추가되면 실제 값으로 교체하세요. */}
        <Badge className="bg-slate-100 text-slate-400">주택유형 정보 준비 중</Badge>
        <Badge className={property.statusColor}>
          {property.checkSignalCount !== undefined
            ? `확인 필요 신호 ${property.checkSignalCount}개`
            : '신호 확인 준비 중'}
        </Badge>
      </div>
      <h3 className="mb-1 font-bold text-slate-950">{property.title}</h3>
      <p className="mb-3 flex items-center gap-1 text-sm text-slate-500">
        <MapPin className="h-4 w-4" /> {property.address}
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="mb-1 text-xs text-slate-400">보증금 안전성</p>
          <p className="text-sm font-bold text-slate-950">
            전세가율 {getJeonseRatioDisplay(property.type, property.jeonseRatio)}
          </p>
        </div>
        <div className="rounded-xl bg-slate-50 p-3">
          <p className="mb-1 text-xs text-slate-400">체크리스트</p>
          <p className="text-sm font-bold text-slate-950">
            {checklistStarted
              ? `${checkedCount}/${CHECKLIST_TOTAL_ITEMS_MOCK} 확인, 주의 ${cautionCount}개`
              : '체크리스트 시작 전'}
          </p>
        </div>
      </div>
    </Link>
  );
}
