'use client';

import { AlertTriangle } from 'lucide-react';
import { Modal } from '../../ui/Modal';
import { NoticeBox } from '../../ui/NoticeBox';

type ContractHistoryDeleteConfirmModalProps = {
  open: boolean;
  isDeleting: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: () => void;
};

// PropertyDeleteConfirmModal.tsx와 동일한 패턴 - 하드 삭제라 되돌릴 수 없다는 걸 명확히 알리고,
// 삭제 중에는 배경 클릭으로 닫히지 않게 onClose를 넘기지 않는다.
export function ContractHistoryDeleteConfirmModal({
  open,
  isDeleting,
  error,
  onClose,
  onConfirm,
}: ContractHistoryDeleteConfirmModalProps) {
  return (
    <Modal open={open} onClose={isDeleting ? undefined : onClose}>
      <h2 className="mb-1 text-lg font-bold text-slate-950">이 이력을 삭제할까요?</h2>
      <p className="mb-5 text-sm text-slate-500">삭제 후에는 되돌릴 수 없어요.</p>

      {error && (
        <NoticeBox icon={AlertTriangle} iconClassName="text-red-500" className="mb-4 bg-red-50 text-red-600">
          {error}
        </NoticeBox>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onClose}
          disabled={isDeleting}
          className="ansim-button-secondary flex-1 disabled:opacity-60"
        >
          취소
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={isDeleting}
          className="ansim-button-primary flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-60"
        >
          {isDeleting ? '삭제 중...' : '삭제하기'}
        </button>
      </div>
    </Modal>
  );
}
