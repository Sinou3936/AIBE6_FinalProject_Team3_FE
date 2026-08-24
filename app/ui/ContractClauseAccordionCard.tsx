'use client';

import { Check, ChevronDown, Copy, FileText, HelpCircle, MessageSquare } from 'lucide-react';
import { type ReactNode, useEffect, useRef } from 'react';
import { cn } from '../lib/cn';
import { type ContractClause } from '../types/domain';
import { Badge } from './Badge';

// contract/result(ContractResultClient.tsx)의 위험 조항 아코디언 카드를 마이페이지 계약분석
// 이력 상세에서도 그대로 재사용하기 위해 뽑아낸 컴포넌트. 헤더는 원문 대신 AI가 붙인 짧은
// title을 보여준다(둘 다 항상 값이 있지만 방어적으로 fallback을 둔다) - 원문(originalText)은
// 이력 상세엔 아예 없을 수 있어, 있을 때만 펼친 본문 위쪽에 인용구로 보여준다.
// 채팅(미니 챗봇)은 실시간 분석 화면 전용이라 이 컴포넌트에 포함하지 않고, 필요한 쪽(결과 화면)이
// children으로 펼쳐진 영역 맨 아래에 얹는다.
const FALLBACK_TITLE = '제목 없음';

type ContractClauseAccordionCardProps = {
  clause: ContractClause;
  isExpanded: boolean;
  onToggle: () => void;
  copiedKey: string | null;
  onCopy: (key: string, value: string) => void;
  questionCopyKey: string;
  suggestionCopyKey: string;
  children?: ReactNode;
};

export function ContractClauseAccordionCard({
  clause,
  isExpanded,
  onToggle,
  copiedKey,
  onCopy,
  questionCopyKey,
  suggestionCopyKey,
  children,
}: ContractClauseAccordionCardProps) {
  // 카드를 펼치면 그 카드가 화면 위쪽으로 스크롤되어 펼쳐진 내용이 보일 자리를 확보한다.
  // isExpanded가 바뀌는 즉시 scrollIntoView를 부르면(block 옵션과 무관하게) grid-rows 트랜지션이
  // 이제 막 시작해 카드 높이가 계속 바뀌는 도중이라, 브라우저의 smooth 스크롤이 "움직이는 목표"를
  // 쫓다가 트랜지션과 서로 간섭해 스크롤이 아예 안 움직이거나 중간에 멈추는 문제가 있었다 - 카드
  // 높이가 최종 값으로 자리잡은 뒤(트랜지션이 끝난 뒤)에 스크롤해야 안정적으로 동작한다.
  const cardRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isExpanded) {
      return;
    }
    const bodyElement = bodyRef.current;
    if (!bodyElement) {
      return;
    }

    const scrollCardIntoView = (event: TransitionEvent) => {
      if (event.propertyName === 'grid-template-rows') {
        cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
    bodyElement.addEventListener('transitionend', scrollCardIntoView);
    return () => bodyElement.removeEventListener('transitionend', scrollCardIntoView);
  }, [isExpanded]);

  return (
    <div
      ref={cardRef}
      className="ansim-card overflow-hidden border-l-4 border-l-slate-200 transition-all hover:border-l-teal-500"
    >
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={isExpanded}
        className="flex w-full items-center gap-4 p-6 text-left"
      >
        <Badge className={`shrink-0 rounded border ${clause.levelColor}`}>{clause.levelLabel}</Badge>
        <p className="flex-1 text-sm font-bold text-slate-900">{clause.title || FALLBACK_TITLE}</p>
        <ChevronDown
          className={cn('h-5 w-5 shrink-0 text-slate-400 transition-transform', isExpanded && 'rotate-180')}
        />
      </button>

      {/* CSS grid의 fr 트랙 크기(0fr <-> 1fr)를 애니메이션해 펼침/접힘을 구현한다. max-height를 임의의
          큰 값(예: 2000px)으로 잡는 방식은 실제 콘텐츠 높이가 그보다 훨씬 작을 때 트랜지션 시간 대부분
          동안 아무 변화가 없다가 초반에 "뚝" 끊기듯 다 펼쳐져 보이는 문제가 있다 - 이 grid-rows 방식은
          실제 콘텐츠 높이에 맞춰 처음부터 끝까지 고르게 트랜지션되어 훨씬 부드럽다. 조항 본문은 항상
          DOM에 있고(접혀 있을 때는 0fr 트랙이라 높이 0으로 시각적으로만 감춤) 안쪽 overflow-hidden이
          트랜지션 중 넘치는 콘텐츠를 잘라낸다. */}
      <div
        ref={bodyRef}
        aria-hidden={!isExpanded}
        className={cn(
          'grid transition-[grid-template-rows] duration-300 ease-in-out',
          isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
        )}
      >
        <div className="overflow-hidden">
          <div className="border-t border-slate-100 p-6">
            {clause.originalText && (
              <div className="mb-4 rounded-xl bg-slate-50 p-4">
                <p className="text-sm italic text-slate-600">
                  <span aria-hidden="true">&quot;</span>
                  {clause.originalText}
                  <span aria-hidden="true">&quot;</span>
                </p>
              </div>
            )}
            <div>
              <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-950">
                <MessageSquare className="h-4 w-4 text-teal-600" /> 설명
              </h4>
              <p className="text-sm leading-relaxed text-slate-600">{clause.explanation}</p>
            </div>
            <div className="mt-8 rounded-xl border border-teal-100 bg-teal-50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-teal-600" />
                <span className="text-sm font-bold text-teal-950">중개사에게 이렇게 확인해 보세요</span>
              </div>
              <p className="mb-4 text-sm text-teal-800">
                <span aria-hidden="true">&quot;</span>
                {clause.question}
                <span aria-hidden="true">&quot;</span>
              </p>
              <button
                type="button"
                onClick={() => onCopy(questionCopyKey, clause.question)}
                className="flex items-center gap-2 text-xs font-bold text-teal-700"
              >
                {copiedKey === questionCopyKey ? (
                  <>
                    <Check className="h-3 w-3" /> 복사됨
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" /> 질문 문구 복사하기
                  </>
                )}
              </button>
            </div>
            <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="mb-3 flex items-center gap-2">
                <FileText className="h-4 w-4 text-slate-600" />
                <span className="text-sm font-bold text-slate-950">수정 요청 문구 예시</span>
              </div>
              <p className="mb-4 text-sm text-slate-700">
                <span aria-hidden="true">&quot;</span>
                {clause.suggestedText}
                <span aria-hidden="true">&quot;</span>
              </p>
              <button
                type="button"
                onClick={() => onCopy(suggestionCopyKey, clause.suggestedText)}
                className="flex items-center gap-2 text-xs font-bold text-slate-600"
              >
                {copiedKey === suggestionCopyKey ? (
                  <>
                    <Check className="h-3 w-3" /> 복사됨
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" /> 문구 복사하기
                  </>
                )}
              </button>
            </div>

            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
