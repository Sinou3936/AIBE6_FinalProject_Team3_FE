import { type PriorityAction, type UserCurrentStage } from '../types/domain';

type PriorityActionInput = {
  currentStage: UserCurrentStage | null;
  hasProperty: boolean;
  hasChecklist: boolean;
  propertyTitle?: string;
};

export function getPriorityAction({
  currentStage,
  hasProperty,
  hasChecklist,
  propertyTitle,
}: PriorityActionInput): PriorityAction {
  if (!hasProperty) {
    return currentStage === '자취 처음'
      ? {
          title: '자취가 처음이신가요? 매물을 아직 등록하지 않으셨어요',
          description: '관심 매물을 등록하면 시세 대비 가격과 확인 필요 신호를 바로 확인할 수 있어요.',
          ctaLabel: '매물 검증하기',
          ctaHref: '/properties/register',
        }
      : {
          title: '매물을 아직 등록하지 않으셨어요',
          description: '관심 매물을 등록하고 계약 전 확인할 항목을 순서대로 점검해보세요.',
          ctaLabel: '매물 검증하기',
          ctaHref: '/properties/register',
        };
  }

  if (!hasChecklist) {
    return {
      title: `${propertyTitle ?? '등록한 매물'} 체크리스트를 시작해보세요`,
      description: '현장 방문 시 확인할 항목을 순서대로 기록할 수 있어요.',
      ctaLabel: '체크리스트 시작하기',
      ctaHref: '/checklist',
    };
  }

  return {
    title: '진행 중인 체크리스트를 이어서 확인하세요',
    description: '아직 확인하지 않은 항목이 남아 있어요.',
    ctaLabel: '체크리스트 이어하기',
    ctaHref: '/checklist',
  };
}
