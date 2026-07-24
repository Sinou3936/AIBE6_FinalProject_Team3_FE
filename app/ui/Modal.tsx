'use client';

import { type ReactNode } from 'react';

type ModalProps = {
  open: boolean;
  onClose?: () => void;
  children: ReactNode;
};

export function Modal({ open, onClose, children }: ModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4" onClick={onClose}>
      <div className="ansim-card w-full max-w-sm p-6" onClick={(event) => event.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}
