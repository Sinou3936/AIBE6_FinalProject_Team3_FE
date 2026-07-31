'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import {
  propertyRegisterFeatureCards,
  propertyTransactionTypeOptions,
  propertyTypeOptions,
} from '../../../data/property-register';
import { formatDecimalInput, formatIntegerInput } from '../../../lib/numberFormat';
import { createProperty } from '../../../services/properties';
import { type PropertyTransactionTypeDto, type PropertyTypeDto } from '../../../types/api';
import { FeatureCard } from '../../../ui/FeatureCard';
import { LoadingOverlay } from '../../../ui/LoadingOverlay';

export default function Page() {
  const router = useRouter();

  const [address, setAddress] = useState('');
  const [propertyType, setPropertyType] = useState<PropertyTypeDto>('OFFICETEL');
  const [transactionType, setTransactionType] = useState<PropertyTransactionTypeDto>('JEONSE');
  const [deposit, setDeposit] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [area, setArea] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isMonthlyRent = transactionType === 'MONTHLY_RENT';

  async function handleSubmit() {
    setError(null);

    const depositNumber = Number(deposit.replace(/,/g, ''));
    const areaNumber = Number(area.replace(/,/g, ''));

    if (address.trim().length === 0) {
      setError('주소를 입력해주세요.');
      return;
    }
    if (!deposit || Number.isNaN(depositNumber) || depositNumber <= 0) {
      setError('보증금을 올바르게 입력해주세요.');
      return;
    }
    if (!area || Number.isNaN(areaNumber) || areaNumber <= 0) {
      setError('전용면적을 올바르게 입력해주세요.');
      return;
    }

    let monthlyRentNumber: number | null = null;
    if (isMonthlyRent) {
      monthlyRentNumber = Number(monthlyRent.replace(/,/g, ''));
      if (!monthlyRent || Number.isNaN(monthlyRentNumber) || monthlyRentNumber <= 0) {
        setError('월세를 올바르게 입력해주세요.');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const response = await createProperty({
        address: address.trim(),
        propertyType,
        transactionType,
        deposit: depositNumber,
        monthlyRent: monthlyRentNumber,
        area: areaNumber,
        description: description.trim().length > 0 ? description.trim() : null,
      });
      // 매물 상세(/properties/{id})는 아직 실제 API 응답 형태에 안 맞춰져 있어 별도 이슈로 미뤄뒀다.
      // 그래서 등록 성공 후에는 상세가 아닌 목록으로 돌려보내고, 시세조회 관련 안내(notice)는
      // 쿼리로 넘겨 목록 화면에서 보여준다.
      const noticeParam = response.notice ? `?notice=${encodeURIComponent(response.notice)}` : '';
      router.push(`/properties${noticeParam}`);
    } catch {
      setError('매물 등록에 실패했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="border-b border-slate-200 bg-white">
        <div className="container mx-auto flex h-16 max-w-3xl items-center gap-3 px-4">
          <Link href="/properties" className="-ml-2 p-2 text-slate-500 hover:text-slate-950">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-bold text-slate-950">매물 등록</h1>
        </div>
      </div>

      <div className="container mx-auto max-w-3xl px-4 py-8">
        <div className="ansim-card relative mb-6 p-6">
          {isSubmitting && <LoadingOverlay message="실거래가 비교를 계산하고 있어요. 몇 초 정도 걸릴 수 있어요." />}

          <h2 className="mb-2 text-xl font-bold text-slate-950">검증할 매물 정보를 입력하세요</h2>
          <p className="mb-6 text-sm text-slate-600">입력된 값은 실거래가 비교와 보증금 안전성 계산에 사용됩니다.</p>

          <div className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">주소</span>
              <input
                value={address}
                onChange={(event) => setAddress(event.target.value)}
                disabled={isSubmitting}
                className="ansim-input disabled:opacity-60"
                placeholder="예: 서울시 강남구 테헤란로 123"
              />
            </label>

            <div>
              <span className="mb-2 block text-sm font-bold text-slate-700">매물 유형</span>
              <div className="grid grid-cols-3 gap-2">
                {propertyTypeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setPropertyType(option.value)}
                    disabled={isSubmitting}
                    className={`rounded-xl border py-3 text-sm font-bold transition disabled:opacity-60 ${
                      propertyType === option.value
                        ? 'border-teal-500 bg-teal-50 text-teal-700'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
              {propertyType === 'DETACHED_HOUSE' && (
                <p className="mt-2 text-xs text-slate-500">
                  단독/다가구는 국토부 실거래가의 지번 정보가 일부 비공개라 위치·시세 매칭 정확도가 낮을 수 있어요.
                </p>
              )}
            </div>

            <div>
              <span className="mb-2 block text-sm font-bold text-slate-700">거래 유형</span>
              <div className="grid grid-cols-2 gap-2">
                {propertyTransactionTypeOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setTransactionType(option.value)}
                    disabled={isSubmitting}
                    className={`rounded-xl border py-3 text-sm font-bold transition disabled:opacity-60 ${
                      transactionType === option.value
                        ? 'border-teal-500 bg-teal-50 text-teal-700'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">보증금 (원)</span>
                <input
                  value={deposit}
                  onChange={(event) => setDeposit(formatIntegerInput(event.target.value))}
                  inputMode="numeric"
                  disabled={isSubmitting}
                  className="ansim-input disabled:opacity-60"
                  placeholder="예: 180,000,000"
                />
              </label>
              {isMonthlyRent && (
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-700">월세 (원)</span>
                  <input
                    value={monthlyRent}
                    onChange={(event) => setMonthlyRent(formatIntegerInput(event.target.value))}
                    inputMode="numeric"
                    disabled={isSubmitting}
                    className="ansim-input disabled:opacity-60"
                    placeholder="예: 550,000"
                  />
                </label>
              )}
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">전용면적 (㎡)</span>
                <input
                  value={area}
                  onChange={(event) => setArea(formatDecimalInput(event.target.value))}
                  inputMode="decimal"
                  disabled={isSubmitting}
                  className="ansim-input disabled:opacity-60"
                  placeholder="예: 42.5"
                />
              </label>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">설명 (선택)</span>
              <input
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                disabled={isSubmitting}
                className="ansim-input disabled:opacity-60"
                placeholder="예: 역세권, 신축 오피스텔"
              />
            </label>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {propertyRegisterFeatureCards.map((card) => (
            <FeatureCard key={card.title} {...card} />
          ))}
        </div>

        {error && <div className="ansim-card mb-4 border-red-100 bg-red-50 p-4 text-sm text-red-700">{error}</div>}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="ansim-button-primary w-full py-4 text-base disabled:opacity-60"
        >
          {isSubmitting ? '실거래가 비교 중...' : '매물 저장 후 검증 결과 보기'}
        </button>
      </div>
    </div>
  );
}
