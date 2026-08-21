import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { cn } from '../lib/cn';

type PaginationProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  const prevButtonRef = useRef<HTMLButtonElement>(null);
  const nextButtonRef = useRef<HTMLButtonElement>(null);
  // 방금 클릭한 버튼이 어느 쪽인지 기록해둔다 - 예를 들어 마지막에서 두 번째 페이지에서
  // "다음"을 눌러 마지막 페이지로 넘어가면, 그 버튼이 disabled로 바뀌면서 브라우저가 강제로
  // blur시켜 키보드 포커스가 body로 떨어졌다(2026-08-20 전수조사에서 지적) - 방금 클릭한
  // 버튼이 disabled가 됐다면 포커스를 남아있는 반대쪽 버튼으로 되돌린다.
  const lastClickedButtonRef = useRef<'prev' | 'next' | null>(null);

  useEffect(() => {
    if (lastClickedButtonRef.current === 'prev' && prevButtonRef.current?.disabled) {
      if (!nextButtonRef.current?.disabled) nextButtonRef.current?.focus();
    } else if (lastClickedButtonRef.current === 'next' && nextButtonRef.current?.disabled) {
      if (!prevButtonRef.current?.disabled) prevButtonRef.current?.focus();
    }
  }, [page, totalPages]);

  if (totalPages <= 1) {
    return null;
  }

  return (
    <div className="flex items-center justify-center gap-2 py-4">
      <button
        ref={prevButtonRef}
        onClick={() => {
          lastClickedButtonRef.current = 'prev';
          onPageChange(page - 1);
        }}
        disabled={page <= 0}
        aria-label="이전 페이지"
        className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {/* 페이지 번호만 바뀌고 컴포넌트 자체는 그대로라 화면을 보는 사용자는 바로 알아채지만,
      스크린리더 사용자에게는 이 변화를 알려줄 방법이 없었다(2026-08-20 전수조사에서 지적). */}
      <span aria-live="polite" className="text-sm font-medium text-slate-600">
        {page + 1} / {totalPages}
      </span>
      <button
        ref={nextButtonRef}
        onClick={() => {
          lastClickedButtonRef.current = 'next';
          onPageChange(page + 1);
        }}
        disabled={page >= totalPages - 1}
        aria-label="다음 페이지"
        className={cn(
          'rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40',
        )}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
