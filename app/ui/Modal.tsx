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

      if (event.shiftKey) {
        if (active === first || !container.contains(active)) {
          event.preventDefault();
          last.focus();
        }
      } else if (active === last || !container.contains(active)) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

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
        className={`ansim-card w-full ${maxWidthClassName} p-6`}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
