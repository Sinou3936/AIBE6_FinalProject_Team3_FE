'use client';

import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { ApiError } from '../../../lib/api/http';
import { reportProperty } from '../../../services/properties';
import { type PropertyReportReasonDto } from '../../../types/api';
import { Modal } from '../../../ui/Modal';
import { NoticeBox } from '../../../ui/NoticeBox';

type PropertyReportModalProps = {
  propertyId: number;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

const reportReasonOptions: { value: PropertyReportReasonDto; label: string }[] = [
  { value: 'ALREADY_CONTRACTED', label: '이미 계약된 매물이에요' },
  { value: 'PRICE_MISMATCH', label: '실제 가격과 달라요' },
  { value: 'INFO_MISMATCH', label: '매물 정보가 실제와 달라요' },
  { value: 'DUPLICATE', label: '동일 매물이 중복 등록됐어요' },
  { value: 'ETC', label: '기타' },
];

export function PropertyReportModal({ propertyId, open, onClose, onSuccess }: PropertyReportModalProps) {
  const [reason, setReason] = useState<PropertyReportReasonDto | ''>('');
  const [detail, setDetail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetAndClose() {
    setReason('');
    setDetail('');
    setError(null);
    onClose();
  }

  async function handleSubmit() {
    if (!reason) {
      setError('신고 사유를 선택해주세요.');
      return;
    }
    if (reason === 'ETC' && detail.trim().length === 0) {
      setError('기타 사유를 선택한 경우 상세 내용을 입력해주세요.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      await reportProperty(propertyId, {
        reason,
        detail: reason === 'ETC' ? detail.trim() : null,
      });
      resetAndClose();
      onSuccess();
    } catch (submitError) {
      if (submitError instanceof ApiError && submitError.body?.code === 'REPORT_DUPLICATE') {
        setError('이미 신고한 매물이에요.');
      } else {
        setError('신고 접수에 실패했습니다. 잠시 후 다시 시도해주세요.');
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal open={open} onClose={resetAndClose}>
      <h2 className="mb-1 text-lg font-bold text-slate-950">매물 신고</h2>
      <p className="mb-5 text-sm text-slate-500">이 매물에 어떤 문제가 있나요?</p>

      <div className="mb-5 space-y-2">
        {reportReasonOptions.map((option) => (
          <label
            key={option.value}
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 has-[:checked]:border-teal-500 has-[:checked]:bg-teal-50"
          >
            <input
              type="radio"
              name="reportReason"
              value={option.value}
              checked={reason === option.value}
              onChange={() => setReason(option.value)}
              className="h-4 w-4 accent-teal-600"
            />
            {option.label}
          </label>
        ))}
      </div>

      {reason === 'ETC' && (
        <label className="mb-5 block">
          <span className="mb-2 block text-sm font-bold text-slate-700">상세 내용</span>
          <textarea
            value={detail}
            onChange={(event) => setDetail(event.target.value)}
            rows={3}
            className="ansim-input w-full resize-none"
            placeholder="어떤 부분이 문제인지 알려주세요."
          />
        </label>
      )}

      {error && (
        <NoticeBox icon={AlertTriangle} iconClassName="text-red-500" className="mb-4 bg-red-50 text-red-600">
          {error}
        </NoticeBox>
      )}

      <div className="flex gap-2">
        <button
          type="button"
          onClick={resetAndClose}
          className="ansim-button-secondary flex-1"
          disabled={isSubmitting}
        >
          취소
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="ansim-button-primary flex-1 disabled:opacity-60"
        >
          {isSubmitting ? '접수 중...' : '신고하기'}
        </button>
      </div>
    </Modal>
  );
}
