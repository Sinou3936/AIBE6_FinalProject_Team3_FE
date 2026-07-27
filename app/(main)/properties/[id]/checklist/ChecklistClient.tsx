'use client';

import { useState } from 'react';
import { ArrowLeft, ArrowRight, Info } from 'lucide-react';
import Link from 'next/link';
import { checklistCategories as categories } from '../../../../data/checklist';
import { type ChecklistSummary } from '../../../../lib/checklistSummary';
import { cn } from '../../../../lib/cn';
import { getChecklistResult, updateChecklistItem } from '../../../../services/checklist';
import { type ChecklistItemUpdateRequestDto } from '../../../../types/api';
import { type Checklist, type ChecklistItem, type PropertyDetail } from '../../../../types/domain';
import { NoticeBox } from '../../../../ui/NoticeBox';

const EMPTY_SUMMARY: ChecklistSummary = {
  progressPercent: 0,
  missingRequiredCount: 0,
  cautionCount: 0,
  hasStarted: false,
};

type ChecklistClientProps = {
  propertyId: number;
  checklist?: Checklist;
  initialSummary?: ChecklistSummary;
  loadError?: string;
  property?: PropertyDetail;
};

export function ChecklistClient({ propertyId, checklist, initialSummary, loadError, property }: ChecklistClientProps) {
  const [items, setItems] = useState<ChecklistItem[]>(checklist?.items ?? []);
  const [summary, setSummary] = useState<ChecklistSummary>(initialSummary ?? EMPTY_SUMMARY);
  const [activeCategory, setActiveCategory] = useState(categories[0].id);
  const [itemErrors, setItemErrors] = useState<Record<number, string>>({});

  const checklistId = checklist?.id;
  const activeItems = items.filter((item) => item.category === activeCategory);

  async function applyUpdate(
    item: ChecklistItem,
    patch: Partial<ChecklistItem>,
    request: ChecklistItemUpdateRequestDto,
  ) {
    if (!checklistId) {
      return;
    }

    setItems((currentItems) =>
      currentItems.map((current) => (current.id === item.id ? { ...current, ...patch } : current)),
    );
    setItemErrors((current) => {
      const next = { ...current };
      delete next[item.id];
      return next;
    });

    try {
      const updated = await updateChecklistItem(checklistId, item.id, request);
      setItems((currentItems) => currentItems.map((current) => (current.id === item.id ? updated : current)));

      try {
        setSummary(await getChecklistResult(checklistId));
      } catch {
        // 결과 재조회 실패는 문항 저장 자체와는 무관하므로 조용히 무시한다 (다음 변경 때 다시 시도됨).
      }
    } catch {
      setItems((currentItems) => currentItems.map((current) => (current.id === item.id ? item : current)));
      setItemErrors((current) => ({ ...current, [item.id]: '저장하지 못했어요. 다시 시도해 주세요.' }));
    }
  }

  const handleComplete = (item: ChecklistItem) => {
    void applyUpdate(item, { checked: true, userNote: null }, { checked: true });
  };

  const handleMarkInsufficient = (item: ChecklistItem, note: string) => {
    void applyUpdate(item, { checked: true, userNote: note }, { userNote: note });
  };

  const handleAnswer = (item: ChecklistItem, value: string) => {
    void applyUpdate(item, { checked: true, value }, { value });
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="container mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link href={`/properties/${propertyId}`} className="-ml-2 p-2 text-slate-500 hover:text-slate-950">
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-slate-950">현장 체크리스트</h1>
              {property && (
                <p className="text-xs text-slate-500">
                  {property.type} · {property.title} · {property.address}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="h-1 w-full bg-slate-100">
          <div
            className="h-full bg-teal-500 transition-all duration-500"
            style={{ width: `${summary.progressPercent}%` }}
          />
        </div>
      </div>

      <div className="container mx-auto max-w-3xl px-4 py-6">
        {loadError && (
          <div className="ansim-card mb-6 border-red-100 bg-red-50 p-4 text-sm text-red-700">{loadError}</div>
        )}

        <div className="ansim-card mb-6 bg-white p-4">
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-400">진행률</p>
              <p className="mt-1 font-bold text-slate-950">{summary.progressPercent}%</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-3">
              <p className="text-xs text-slate-400">주의 항목</p>
              <p className="mt-1 font-bold text-slate-950">{summary.cautionCount}개</p>
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-slate-500">
            {summary.hasStarted
              ? `필수 확인 누락 ${summary.missingRequiredCount}개`
              : (summary.message ?? '체크리스트를 시작해보세요')}
          </p>
        </div>

        <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={cn(
                'ansim-filter-pill flex items-center gap-2',
                activeCategory === category.id ? 'bg-slate-950 text-white' : 'ansim-filter-pill-muted',
              )}
            >
              <category.icon className="h-4 w-4" />
              {category.name}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {activeItems.map((item) => (
            <div
              key={item.id}
              className={cn('ansim-card bg-white p-4', item.issueFound && 'border-orange-200 bg-orange-50/40')}
            >
              <p className="mb-1 font-medium leading-relaxed text-slate-900">{item.content}</p>
              {item.guideText && <p className="mb-3 text-xs text-slate-500">{item.guideText}</p>}

              {item.itemType === 'check' && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleComplete(item)}
                      className={cn(
                        'rounded-lg border px-3 py-2 text-sm font-bold transition',
                        item.checked && item.userNote === null
                          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                          : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50',
                      )}
                    >
                      완료
                    </button>
                    <button
                      onClick={() => handleMarkInsufficient(item, item.userNote ?? '')}
                      className={cn(
                        'rounded-lg border px-3 py-2 text-sm font-bold transition',
                        item.userNote !== null
                          ? 'border-orange-200 bg-orange-50 text-orange-700'
                          : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50',
                      )}
                    >
                      미흡
                    </button>
                  </div>
                  {item.userNote !== null && (
                    <textarea
                      key={item.id}
                      defaultValue={item.userNote}
                      onBlur={(event) => handleMarkInsufficient(item, event.target.value)}
                      placeholder="어떤 점이 미흡했나요? (선택)"
                      rows={2}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                    />
                  )}
                </div>
              )}

              {item.itemType === 'yesNo' && (
                <div className="grid grid-cols-2 gap-2">
                  {(['Y', 'N'] as const).map((option) => (
                    <button
                      key={option}
                      onClick={() => handleAnswer(item, option)}
                      className={cn(
                        'rounded-lg border px-3 py-2 text-sm font-bold transition',
                        item.value === option
                          ? 'border-teal-200 bg-teal-50 text-teal-700'
                          : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50',
                      )}
                    >
                      {option === 'Y' ? '예' : '아니오'}
                    </button>
                  ))}
                </div>
              )}

              {item.itemType === 'date' && (
                <input
                  type="date"
                  value={item.value ?? ''}
                  onChange={(event) => handleAnswer(item, event.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                />
              )}

              {item.itemType === 'documentRequest' && (
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      ['PROVIDED', '제공받음'],
                      ['NOT_PROVIDED', '미제공'],
                    ] as const
                  ).map(([option, label]) => (
                    <button
                      key={option}
                      onClick={() => handleAnswer(item, option)}
                      className={cn(
                        'rounded-lg border px-3 py-2 text-sm font-bold transition',
                        item.value === option
                          ? 'border-teal-200 bg-teal-50 text-teal-700'
                          : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50',
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              )}

              {itemErrors[item.id] && <p className="mt-2 text-xs text-red-600">{itemErrors[item.id]}</p>}
            </div>
          ))}
        </div>

        {summary.hasStarted && summary.missingRequiredCount === 0 && (
          <Link
            href="/contract/upload"
            className="ansim-button-primary mt-6 flex items-center justify-center gap-2 px-5 py-3"
          >
            다음 단계: 특약사항 분석하기 <ArrowRight className="h-4 w-4" />
          </Link>
        )}

        <NoticeBox icon={Info} iconClassName="text-slate-400" className="mt-6">
          체크리스트 결과는 점수나 안전 등급이 아닙니다. 확인한 항목과 주의가 필요한 항목을 정리하는 참고용 기록이며,
          실제 계약 전 등기부등본과 보증보험 가능 여부를 함께 확인하세요.
        </NoticeBox>
      </div>
    </div>
  );
}
