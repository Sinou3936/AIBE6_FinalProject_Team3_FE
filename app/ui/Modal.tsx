'use client';

import { useEffect, useRef, type ReactNode } from 'react';

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

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (element) => !element.hasAttribute('disabled') && element.getAttribute('aria-hidden') !== 'true',
  );
}

export function Modal({ open, onClose, children, maxWidthClassName = 'max-w-sm' }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedElementRef = useRef<HTMLElement | null>(null);

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

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" onClick={onClose}>
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        tabIndex={-1}
        className={`ansim-card w-full ${maxWidthClassName} p-6`}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
