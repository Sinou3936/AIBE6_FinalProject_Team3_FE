import { MapPin } from 'lucide-react';
import Link from 'next/link';
import { getJeonseRatioDisplay } from '../lib/jeonseRatio';
import { type ChecklistProgress, type PropertySummary } from '../types/domain';
import { Badge } from './Badge';

type PropertyListItemProps = {
  property: PropertySummary;
  // undefined는 "시작 전"이 아니라 조회 자체에 실패했다는 뜻이다(mypage/page.tsx 참고) -
  // 성공했다면 활성 매물마다 최소 NOT_STARTED 항목이라도 항상 들어있다.
  checklistProgress?: ChecklistProgress;
};

function getChecklistStatusText(checklistProgress: ChecklistProgress | undefined): string {
  if (!checklistProgress) {
    return '체크리스트 상태를 불러오지 못함';
  }
  if (checklistProgress.status === 'NOT_STARTED') {
    return '체크리스트 시작 전';
  }
  if (checklistProgress.progressPercent === undefined) {
    // status는 확보했지만 진행률(%) 조회는 실패한 경우 - 숫자 없이 상태만 보여준다.
    return checklistProgress.status === 'COMPLETED' ? '체크리스트 완료' : '체크리스트 진행 중';
  }
  return `${checklistProgress.progressPercent}% 확인, 주의 ${checklistProgress.cautionCount ?? 0}개`;
}

export function PropertyListItem({ property, checklistProgress }: PropertyListItemProps) {
  return (
    <Link href={`/properties/${property.id}`} className="ansim-card block p-4 transition hover:border-teal-200">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Badge className="bg-teal-50 text-teal-700">{property.type}</Badge>
        {property.propertyType ? (
          <Badge className="bg-slate-100 text-slate-600">{property.propertyType}</Badge>
        ) : (
          <Badge className="bg-slate-100 text-slate-400">주택유형 정보 없음</Badge>
        )}
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
          <p className="text-sm font-bold text-slate-950">{getChecklistStatusText(checklistProgress)}</p>
        </div>
      </div>
    </Link>
  );
}
