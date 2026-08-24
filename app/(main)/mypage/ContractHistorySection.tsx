'use client';

import { Check, ChevronDown, ChevronLeft, ChevronRight, Loader2, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { cn } from '../../lib/cn';
import { getContractAnalysisErrorMessage } from '../../lib/contractAnalysisErrors';
import {
  getContractHistoryLabel,
  removeContractHistoryLabel,
  saveContractHistoryLabel,
} from '../../lib/contractHistoryLabels';
import { deleteContractHistory, getMyContractHistory } from '../../services/contract-analysis';
import { type ContractHistoryPage } from '../../types/domain';
import { Badge } from '../../ui/Badge';
import { ContractHistoryDeleteConfirmModal } from './ContractHistoryDeleteConfirmModal';
import { ContractHistoryDetailAccordion } from './ContractHistoryDetailAccordion';

// BE 기본값(20)과 별개로, 목록 화면 UI상 한 섹션에 보여줄 카드 개수는 FE가 정한다
// (checklists/page.tsx의 PAGE_SIZE와 동일 패턴).
const PAGE_SIZE = 5;

// 매물과 연결되지 않은 이력 항목(propertyTitle 없음)에 직접 붙이는 라벨의 최대 길이.
const LABEL_MAX_LENGTH = 30;

const emptyPage: ContractHistoryPage = {
  items: [],
  page: 0,
  size: PAGE_SIZE,
  totalElements: 0,
  totalPages: 0,
  hasNext: false,
};

// 항목을 클릭하면 그 아래 위험 조항 아코디언이 펼쳐진다(ContractHistoryDetailAccordion) - 원문을
// 저장하지 않는 정책이라 별도 상세 "화면"으로 이동할 상세 내용 자체는 없고, 조항 설명/확인 질문/
// 수정 요청 문구만 그 자리에서 보여준다. 한 번에 하나의 항목만 펼칠 수 있다(expandedHistoryId).
// 마이페이지 전체를 재구성하지 않도록, 이 섹션이 자체 page state로 자신의 데이터만 따로 불러온다
// (checklists/page.tsx처럼 URL 쿼리 파라미터를 쓰지 않음 - 마이페이지 전체 URL을 이 섹션 하나의
// 페이지네이션에 묶고 싶지 않아서).
export function ContractHistorySection() {
  const [page, setPage] = useState(0);
  const [historyPage, setHistoryPage] = useState<ContractHistoryPage>(emptyPage);
  const [loadError, setLoadError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [expandedHistoryId, setExpandedHistoryId] = useState<number | null>(null);
  // 한 번이라도 펼친 적 있는 항목의 id 모음 - ContractHistoryDetailAccordion을 조건부 렌더링(첫 클릭
  // 시에만 마운트)해서 안 열어본 항목까지 미리 fetch하지 않으면서도, 한 번 연 뒤에는 계속 마운트해둬
  // 다시 열 때 재요청 없이 그대로 보여준다(분석 이력은 불변 기록이라 캐시가 낡을 일이 없다). 감싸는
  // grid 래퍼 자체는 모든 항목에 항상 렌더링해둬야 처음 펼칠 때도 0fr -> 1fr 트랜지션이 걸린다 -
  // 마운트와 동시에 1fr로 나타나면 트랜지션할 "이전 상태"가 없어 애니메이션되지 않는다.
  const [openedHistoryIds, setOpenedHistoryIds] = useState<Set<number>>(new Set());
  // propertyTitle이 없는 항목에 직접 붙이는 라벨 인라인 편집 상태. localStorage 자체는 값이 바뀌어도
  // 리렌더를 유발하지 않으므로, 저장/취소 시 editingLabelId를 바꾸는 setState 호출이 그 계기가
  // 되어 화면이 localStorage의 최신 값을 다시 읽어오게 만든다(별도 캐시 state를 두지 않음).
  const [editingLabelId, setEditingLabelId] = useState<number | null>(null);
  const [labelDraft, setLabelDraft] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  // 아코디언이 열릴 때 그 카드로 스크롤을 따라가기 위한 항목별 ref - ContractResultClient.tsx의
  // chatContainerRefs와 동일한 패턴. itemBodyRefs는 실제로 펼침/접힘을 트랜지션하는 grid 래퍼
  // (아래 JSX의 grid-rows 요소) - transitionend를 감지하려면 이 요소를 따로 참조해야 한다.
  const itemRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const itemBodyRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // isExpanded가 바뀌는 즉시 scrollIntoView를 부르면 grid-rows 트랜지션이 막 시작해 카드 높이가
  // 계속 바뀌는 도중이라, 브라우저의 smooth 스크롤이 "움직이는 목표"를 쫓다가 트랜지션과 서로
  // 간섭해 스크롤이 아예 안 움직이는 문제가 있었다(ContractClauseAccordionCard.tsx와 동일한 원인) -
  // 카드 높이가 최종 값으로 자리잡은 뒤(트랜지션 종료 후)에 스크롤해야 안정적으로 동작한다.
  useEffect(() => {
    if (expandedHistoryId == null) {
      return;
    }
    const bodyElement = itemBodyRefs.current.get(expandedHistoryId);
    if (!bodyElement) {
      return;
    }

    const scrollCardIntoView = (event: TransitionEvent) => {
      if (event.propertyName === 'grid-template-rows') {
        itemRefs.current.get(expandedHistoryId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };
    bodyElement.addEventListener('transitionend', scrollCardIntoView);
    return () => bodyElement.removeEventListener('transitionend', scrollCardIntoView);
  }, [expandedHistoryId]);

  useEffect(() => {
    let cancelled = false;
    // page가 바뀌어 이 effect가 재실행될 때만 의미 있는 재설정이다(최초 실행 시 초기값과 동일) -
    // 페이지 변경 시 새 로딩 상태를 보여줘야 하므로 의도적으로 동기 호출한다.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsLoading(true);

    getMyContractHistory({ page, size: PAGE_SIZE })
      .then((result) => {
        if (!cancelled) {
          setHistoryPage(result);
          setLoadError(undefined);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError('계약분석 이력을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.');
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page]);

  const { items, totalPages, hasNext } = historyPage;

  const toggleExpanded = (id: number) => {
    setExpandedHistoryId((current) => (current === id ? null : id));
    setOpenedHistoryIds((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));
  };

  const startEditLabel = (id: number) => {
    setLabelDraft(getContractHistoryLabel(id) ?? '');
    setEditingLabelId(id);
  };

  const commitLabel = (id: number) => {
    saveContractHistoryLabel(id, labelDraft);
    setEditingLabelId(null);
  };

  const cancelEditLabel = () => {
    setEditingLabelId(null);
  };

  const handleConfirmDelete = async () => {
    if (deleteTargetId == null) {
      return;
    }
    const id = deleteTargetId;
    // 삭제 전 상태(items)로 판단 - 이 페이지의 마지막 하나였다면 삭제 후 빈 페이지가 되므로
    // 한 페이지 앞으로 물러난다(page 0이면 그대로 둔다).
    const wasLastItemOnPage = items.length === 1 && page > 0;

    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteContractHistory(id);
      // 서버 이력이 지워졌으니 이 브라우저에만 있던 라벨도 같이 정리한다 - 안 그러면 같은 id가
      // 다른 이력에 재사용될 리는 없어도 localStorage에 고아 값으로 계속 남는다.
      removeContractHistoryLabel(id);
      setExpandedHistoryId((current) => (current === id ? null : current));
      setOpenedHistoryIds((prev) => {
        if (!prev.has(id)) {
          return prev;
        }
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setDeleteTargetId(null);
      if (wasLastItemOnPage) {
        // page state가 바뀌면 위 useEffect가 그 페이지를 다시 불러온다.
        setPage((current) => current - 1);
      } else {
        setHistoryPage(await getMyContractHistory({ page, size: PAGE_SIZE }));
      }
    } catch (error) {
      setDeleteError(getContractAnalysisErrorMessage(error, '삭제에 실패했습니다. 잠시 후 다시 시도해 주세요.'));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-bold text-slate-950">계약분석 이력</h2>

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
              <div className="ansim-card p-6 text-center text-sm text-slate-500">아직 분석한 특약사항이 없어요.</div>
            )}

            {items.length > 0 && (
              <div className="space-y-3">
                {items.map((item) => {
                  const isExpanded = expandedHistoryId === item.id;
                  const isEditingLabel = editingLabelId === item.id;
                  return (
                    <div
                      key={item.id}
                      ref={(el) => {
                        if (el) {
                          itemRefs.current.set(item.id, el);
                        } else {
                          itemRefs.current.delete(item.id);
                        }
                      }}
                      className="ansim-card overflow-hidden p-4"
                    >
                      {/* 라벨(왼쪽)과 날짜/삭제(오른쪽)를 한 줄로 - propertyTitle이 없는 항목만
                        클릭해서 직접 라벨을 붙일 수 있다. 토글 버튼 밖에 둬서 라벨 편집/삭제 클릭이
                        아코디언 펼침과 서로 간섭하지 않는다. */}
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          {item.propertyTitle ? (
                            <p className="truncate text-sm font-bold text-slate-900">{item.propertyTitle}</p>
                          ) : isEditingLabel ? (
                            <div className="flex items-center gap-1">
                              <input
                                autoFocus
                                value={labelDraft}
                                maxLength={LABEL_MAX_LENGTH}
                                onChange={(event) => setLabelDraft(event.target.value)}
                                onBlur={() => commitLabel(item.id)}
                                onKeyDown={(event) => {
                                  if (event.key === 'Enter') {
                                    event.preventDefault();
                                    commitLabel(item.id);
                                  } else if (event.key === 'Escape') {
                                    event.preventDefault();
                                    cancelEditLabel();
                                  }
                                }}
                                placeholder="예: 역삼동 투룸 (직접 입력)"
                                aria-label="이 이력에 붙일 라벨 직접 입력"
                                className="ansim-input flex-1 py-1 text-sm font-bold"
                              />
                              {/* onMouseDown(클릭이 아니라)으로 눌러야 input의 onBlur보다 먼저 반응해
                                currentTarget이 사라지기 전에 확정/취소된다. */}
                              <button
                                type="button"
                                onMouseDown={(event) => {
                                  event.preventDefault();
                                  commitLabel(item.id);
                                }}
                                className="rounded-lg p-1.5 text-teal-600 hover:bg-teal-50"
                                aria-label="라벨 저장"
                              >
                                <Check className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onMouseDown={(event) => {
                                  event.preventDefault();
                                  cancelEditLabel();
                                }}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
                                aria-label="라벨 편집 취소"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => startEditLabel(item.id)}
                              className="truncate text-sm font-bold text-slate-900 underline decoration-dotted decoration-slate-300 underline-offset-4 hover:text-teal-700"
                            >
                              {getContractHistoryLabel(item.id) ?? '직접 입력'}
                            </button>
                          )}
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                          <span className="text-xs text-slate-400">{item.createdAt}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteError(null);
                              setDeleteTargetId(item.id);
                            }}
                            className="rounded-lg p-1 text-slate-400 hover:bg-red-50 hover:text-red-500"
                            aria-label="이 이력 삭제"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => toggleExpanded(item.id)}
                        aria-expanded={isExpanded}
                        className="w-full text-left"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-sm text-slate-700">{item.summary}</p>
                          <ChevronDown
                            className={cn(
                              'mt-0.5 h-4 w-4 shrink-0 text-slate-400 transition-transform',
                              isExpanded && 'rotate-180',
                            )}
                          />
                        </div>
                        <div className="mt-3 flex gap-2">
                          <Badge className="bg-slate-100 text-slate-600">조항 {item.clauseCount}개</Badge>
                          <Badge
                            className={
                              item.riskCount > 0 ? 'bg-orange-100 text-orange-700' : 'bg-slate-100 text-slate-500'
                            }
                          >
                            확인 필요 {item.riskCount}개
                          </Badge>
                        </div>
                      </button>

                      <div
                        ref={(el) => {
                          if (el) {
                            itemBodyRefs.current.set(item.id, el);
                          } else {
                            itemBodyRefs.current.delete(item.id);
                          }
                        }}
                        aria-hidden={!isExpanded}
                        className={cn(
                          'grid transition-[grid-template-rows] duration-300 ease-in-out',
                          isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
                        )}
                      >
                        <div className="overflow-hidden">
                          {openedHistoryIds.has(item.id) && <ContractHistoryDetailAccordion historyId={item.id} />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!loadError && totalPages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-4">
                {page > 0 ? (
                  <button
                    type="button"
                    onClick={() => setPage((current) => current - 1)}
                    className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                  >
                    <ChevronLeft className="h-4 w-4" /> 이전
                  </button>
                ) : (
                  <span className="flex items-center gap-1 rounded-xl border border-slate-100 px-4 py-2 text-sm font-bold text-slate-300">
                    <ChevronLeft className="h-4 w-4" /> 이전
                  </span>
                )}
                <span className="text-sm text-slate-500">
                  {page + 1} / {totalPages} 페이지
                </span>
                {hasNext ? (
                  <button
                    type="button"
                    onClick={() => setPage((current) => current + 1)}
                    className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50"
                  >
                    다음 <ChevronRight className="h-4 w-4" />
                  </button>
                ) : (
                  <span className="flex items-center gap-1 rounded-xl border border-slate-100 px-4 py-2 text-sm font-bold text-slate-300">
                    다음 <ChevronRight className="h-4 w-4" />
                  </span>
                )}
              </div>
            )}
          </>
        )}
      </div>

      <ContractHistoryDeleteConfirmModal
        open={deleteTargetId != null}
        isDeleting={isDeleting}
        error={deleteError}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={() => void handleConfirmDelete()}
      />
    </>
  );
}
