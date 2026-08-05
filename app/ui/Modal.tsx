'use client';

import { type ReactNode } from 'react';

type ModalProps = {
  open: boolean;
  onClose?: () => void;
  children: ReactNode;
  // 확인창류(신고/삭제 등)는 좁은 기본값(max-w-sm)이 적당하지만, 갤러리처럼 더 넓은 컨텐츠가
  // 필요한 호출부는 이 값으로 오버라이드한다.
  maxWidthClassName?: string;
};

export function Modal({ open, onClose, children, maxWidthClassName = 'max-w-sm' }: ModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" onClick={onClose}>
      <div
        className={`ansim-card w-full ${maxWidthClassName} p-6`}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
