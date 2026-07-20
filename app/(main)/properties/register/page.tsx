'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import {
  propertyBasicFields,
  propertyPriceFields,
  propertyRegisterFeatureCards,
  tradeTypeOptions,
} from '../../../data/property-register';
import { type PropertyTradeType } from '../../../types/domain';
import { FeatureCard } from '../../../ui/FeatureCard';

export default function Page() {
  const [tradeType, setTradeType] = useState<PropertyTradeType>('전세');

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
        <div className="ansim-card mb-6 p-6">
          <h2 className="mb-2 text-xl font-bold text-slate-950">검증할 매물 정보를 입력하세요</h2>
          <p className="mb-6 text-sm text-slate-600">
            실제 API 연동 전 화면이며, 입력된 값은 실거래가 비교와 보증금 안전성 계산에 사용될 예정입니다.
          </p>

          <div className="space-y-5">
            {propertyBasicFields.map(({ label, placeholder, icon: Icon }) => (
              <label key={label} className="block">
                <span className="mb-2 block text-sm font-bold text-slate-700">{label}</span>
                {Icon ? (
                  <div className="relative">
                    <Icon className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input className="ansim-input pl-10" placeholder={placeholder} />
                  </div>
                ) : (
                  <input className="ansim-input" placeholder={placeholder} />
                )}
              </label>
            ))}

            <div>
              <span className="mb-2 block text-sm font-bold text-slate-700">거래 유형</span>
              <div className="grid grid-cols-3 gap-2">
                {tradeTypeOptions.map((type) => (
                  <button
                    key={type}
                    onClick={() => setTradeType(type)}
                    className={`rounded-xl border py-3 text-sm font-bold transition ${
                      tradeType === type
                        ? 'border-teal-500 bg-teal-50 text-teal-700'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {propertyPriceFields.map(({ label, placeholder }) => (
                <label key={label} className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-700">{label}</span>
                  <input className="ansim-input" placeholder={placeholder} />
                </label>
              ))}
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">관리비</span>
              <input className="ansim-input" placeholder="예: 7만원, 인터넷 포함" />
            </label>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {propertyRegisterFeatureCards.map((card) => (
            <FeatureCard key={card.title} {...card} />
          ))}
        </div>

        <Link href="/properties/1" className="ansim-button-primary w-full py-4 text-base">
          매물 저장 후 검증 결과 보기
        </Link>
      </div>
    </div>
  );
}
