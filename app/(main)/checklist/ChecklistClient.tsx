'use client';

import { useState } from 'react';
import { ArrowLeft, Info, Save } from 'lucide-react';
import Link from 'next/link';
import { checklistCategories as categories, checklistStatusOptions as statusOptions } from '../../data/checklist';
import { cn } from '../../lib/cn';
import { type ChecklistItem, type ChecklistStatus } from '../../types/domain';
import { NoticeBox } from '../../ui/NoticeBox';

type ChecklistClientProps = {
  initialItems: ChecklistItem[];
  loadError?: string;
};

export function ChecklistClient({ initialItems, loadError }: ChecklistClientProps) {
  const [items, setItems] = useState<ChecklistItem[]>(initialItems);
  const [activeCategory, setActiveCategory] = useState(categories[0].id);

  const updateStatus = (id: number, status: ChecklistStatus) => {
    setItems((currentItems) => currentItems.map((item) => (item.id === id ? { ...item, status } : item)));
  };

  const completedCount = items.filter((item) => item.status !== null).length;
  const progress = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;
  const cautionCount = items.filter((item) => item.status === 'caution').length;
  const problemCount = items.filter((item) => item.status === 'problem').length;
  const activeItems = items.filter((item) => item.category === activeCategory);

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <div className="sticky top-0 z-30 border-b border-slate-200 bg-white">
        <div className="container mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link href="/properties/1" className="-ml-2 p-2 text-slate-500 hover:text-slate-950">
              <ArrowLeft className="h-6 w-6" />
            </Link>
            <h1 className="text-lg font-bold text-slate-950">현장 체크리스트</h1>
          </div>
          <button className="flex items-center gap-1 text-sm font-bold text-teal-700">
            <Save className="h-4 w-4" /> 저장
          </button>
        </div>
        <div className="h-1 w-full bg-slate-100">
          <div className="h-full bg-teal-500 transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="container mx-auto max-w-3xl px-4 py-6">
        {loadError && (
          <div className="ansim-card mb-6 border-red-100 bg-red-50 p-4 text-sm text-red-700">{loadError}</div>
        )}

        <div className="ansim-card mb-6 bg-white p-4">
          <div className="mb-3 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-bold text-slate-950">신림역 도보권 원룸 전세</h2>
              <p className="mt-1 text-xs text-slate-500">원룸 · 전세 기준 자동 생성 항목</p>
            </div>
            <span className="shrink-0 text-xs text-slate-400">2026.07.13 방문</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            {[
              ['진행률', `${progress}%`],
              ['주의 항목', `${cautionCount}개`],
              ['문제 항목', `${problemCount}개`],
            ].map(([label, value]) => (
              <div key={label} className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-400">{label}</p>
                <p className="mt-1 font-bold text-slate-950">{value}</p>
              </div>
            ))}
          </div>
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
            <div key={item.id} className="ansim-card bg-white p-4">
              <p className="mb-4 font-medium leading-relaxed text-slate-900">{item.text}</p>
              <div className="grid grid-cols-3 gap-2">
                {statusOptions.map((option) => {
                  const OptionIcon = option.icon;
                  const isActive = item.status === option.status;
                  return (
                    <button
                      key={option.status}
                      onClick={() => updateStatus(item.id, option.status)}
                      className={cn(
                        'flex items-center justify-center gap-1 rounded-lg border px-3 py-2 text-sm font-bold transition',
                        isActive ? option.className : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50',
                      )}
                    >
                      <OptionIcon className="h-4 w-4" />
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <NoticeBox icon={Info} iconClassName="text-slate-400" className="mt-6">
          체크리스트 결과는 점수나 안전 등급이 아닙니다. 확인한 항목과 주의가 필요한 항목을 정리하는 참고용 기록이며,
          실제 계약 전 등기부등본과 보증보험 가능 여부를 함께 확인하세요.
        </NoticeBox>
      </div>
    </div>
  );
}
