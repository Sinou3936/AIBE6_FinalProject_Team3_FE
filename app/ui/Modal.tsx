'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';

type ModalProps = {
  open: boolean;
  onClose?: () => void;
  children: ReactNode;
  // 확인창류(신고/삭제 등)는 좁은 기본값(max-w-sm)이 적당하지만, 갤러리처럼 더 넓은 컨텐츠가
  // 필요한 호출부는 이 값으로 오버라이드한다.
  maxWidthClassName?: string;
};

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

const HEADING_SELECTOR = 'h1, h2, h3, h4, h5, h6';

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true',
  );
}

export function Modal({ open, onClose, children, maxWidthClassName = 'max-w-sm' }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);
  // Modal은 children의 실제 마크업을 모르는 범용 래퍼라, 호출부마다 title/aria-labelledby prop을
  // 추가하는 대신 열려 있는 동안 컨텐츠 안의 첫 heading(h1~h6)을 직접 찾아 그 요소에 안정적인 id를
  // 붙이고 dialog에 aria-labelledby로 연결한다 - 모든 호출부가 이미 확인창 제목을 h2 등으로 넣고
  // 있으므로(AdminUsersClient의 "관리자로 지정할까요?" 등) 호출부 수정 없이 한 번에 접근 가능한
  // 이름을 갖게 된다. heading이 아예 없는 컨텐츠(드묾)는 aria-labelledby 없이 렌더링되는 게
  // 맞는 동작이다.
  const fallbackHeadingId = useId();
  const [headingId, setHeadingId] = useState<string | undefined>(undefined);

  // 열릴 때: 트리거 엘리먼트를 기억해두고 포커스를 다이얼로그 안으로 옮긴다.
  // 닫힐 때: 기억해둔 트리거 엘리먼트로 포커스를 되돌린다.
  useEffect(() => {
    if (open) {
      previouslyFocusedElementRef.current = document.activeElement as HTMLElement | null;

      const container = dialogRef.current;
      if (container) {
        const [firstFocusable] = getFocusableElements(container);
        (firstFocusable ?? container).focus();
      }
    } else {
      previouslyFocusedElementRef.current?.focus();
      previouslyFocusedElementRef.current = null;
    }
  }, [open]);

  // Escape로 닫기 + Tab/Shift+Tab 포커스 트랩. open일 때만 리스너를 붙인다.
  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose?.();
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const container = dialogRef.current;
      if (!container) {
        return;
      }

      const focusableElements = getFocusableElements(container);
      if (focusableElements.length === 0) {
        event.preventDefault();
        container.focus();
        return;
      }

      const first = focusableElements[0];
      const last = focusableElements[focusableElements.length - 1];
      const active = document.activeElement;

      // container.contains(active)만 확인하면 안 된다 - 다이얼로그 컨테이너 자신이나(포커스 유실
      // 복구 시 fallback 대상, tabIndex={-1}) heading(포커스 유실 복구가 tabindex="-1"을 부여해
      // 포커스시키는 경우)은 container 안에 있지만 focusableElements 목록에는 없다(선택자가
      // [tabindex]:not([tabindex="-1"])이므로 제외됨). 이 두 요소는 브라우저의 자연스러운 탭
      // 순서에 아예 없어서, 여기서 Shift+Tab을 가로채지 않으면 포커스가 모달 밖으로 새어나간다
      // (2026-08-20 전수조사에서 지적 - 정확히 오늘 고친 대량처리 결과화면 포커스 복구 직후에
      // 재현됨). focusableElements에 포함된 요소에 포커스가 있을 때만 "트랩 안에 있다"고 본다.
      const activeIsTrapped = active !== null && focusableElements.includes(active as HTMLElement);

      if (event.shiftKey) {
        if (!activeIsTrapped || active === first) {
          event.preventDefault();
          last.focus();
        }
      } else if (!activeIsTrapped || active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  // 포커스 유실 감지 - 위 open 전환 effect는 [open]에만 반응하므로, 같은 Modal 인스턴스가 열린
  // 채로 내부 컨텐츠만 완전히 바뀌는 경우(예: AdminUsersClient/AdminReportsClient의 대량처리
  // 확인 화면 -> 결과 화면 전환)는 포커스를 옮기지 않았다. 그 전환에서는 포커스를 갖고 있던
  // "확인" 버튼 자체가 통째로 언마운트되면서 브라우저가 포커스를 body로 떨어뜨려, 스크린리더
  // 사용자가 "성공 3명, 실패 1명" 같은 결과를 놓치는 문제가 있었다. children을 의존성으로 두면
  // 이 effect는 다이얼로그가 열린 동안의 모든 리렌더(예: 폼 입력 중 매 keystroke)마다 실행되므로,
  // activeElement가 실제로 다이얼로그 밖으로 밀려났을 때만 되돌린다 - 안 그러면 입력 중인 필드의
  // 포커스를 매 타이핑마다 빼앗아가 버린다.
  useEffect(() => {
    if (!open) return;
    const container = dialogRef.current;
    if (!container) return;
    if (document.activeElement && container.contains(document.activeElement)) return;
    const heading = container.querySelector<HTMLElement>(HEADING_SELECTOR);
    // heading(h1~h6)은 기본적으로 포커스를 받을 수 없는 엘리먼트라 tabindex 없이 .focus()를
    // 호출하면 조용히 무시된다(activeElement가 그대로 body에 남음) - 이 effect가 고치려던 포커스
    // 유실이 재현되고 만다. firstFocusable보다 heading을 우선하는 이유(대량처리 결과 화면처럼
    // 포커스 가능한 요소가 없거나 있어도 heading을 먼저 읽어주는 게 자연스러운 경우가 있음)를
    // 유지하려면 heading에 tabindex="-1"을 직접 부여해 실제로 포커스 가능하게 만들어야 한다.
    if (heading && !heading.hasAttribute('tabindex')) {
      heading.setAttribute('tabindex', '-1');
    }
    const [firstFocusable] = getFocusableElements(container);
    (heading ?? firstFocusable ?? container).focus();
  }, [open, children]);

  // 컨텐츠 안의 첫 heading을 찾아 dialog의 접근 가능한 이름으로 연결한다. children을 의존성에
  // 넣어, 같은 Modal 인스턴스가 열린 채로 내부 컨텐츠만 바뀌는 경우(예: AdminReportsClient의
  // 로딩 -> 상세 전환)에도 다시 찾는다 - DOM(다이얼로그 안의 실제 heading 엘리먼트)을 읽어야만
  // 알 수 있는 값이라 렌더링 중에는 계산할 수 없고, 커밋 이후 이 effect에서 동기적으로
  // 반영해야 한다.
  useEffect(() => {
    if (!open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHeadingId(undefined);
      return;
    }
    const container = dialogRef.current;
    const heading = container?.querySelector<HTMLElement>(HEADING_SELECTOR);
    if (!heading) {
      setHeadingId(undefined);
      return;
    }
    if (!heading.id) {
      heading.id = fallbackHeadingId;
    }
    setHeadingId(heading.id);
  }, [open, children, fallbackHeadingId]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        tabIndex={-1}
        // ansim-card의 overflow-hidden만으로는 세로 스크롤이 없어, 관리자 체크리스트 문항 수정
        // 모달처럼 필드가 많은 폼은 뷰포트보다 길어지면 위/아래 내용이 화면 밖으로 잘리고 스크롤할
        // 방법이 없었다(2026-08-20 전수조사에서 지적). max-h/overflow-y-auto는 Tailwind
        // 유틸리티(@layer utilities)라 ansim-card의 overflow-hidden(@layer components)보다
        // 캐스케이드 순서상 항상 이긴다.
        className={`ansim-card w-full ${maxWidthClassName} max-h-[calc(100dvh-2rem)] overflow-y-auto p-6`}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
