'use client';

import Image from 'next/image';
import { ArrowLeft, Calendar, Heart, Home, MapPin, Maximize, Share2, TrendingUp, User } from 'lucide-react';
import Link from 'next/link';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { priceData, riskSummaries } from '../../../data/property-detail';
import { type PropertySummary } from '../../../types/domain';
import { Badge } from '../../../ui/Badge';
import { KakaoMap } from '../../../ui/KakaoMap';

type PropertyDetailClientProps = {
  property?: PropertySummary;
  loadError?: string;
};

export function PropertyDetailClient({ property, loadError }: PropertyDetailClientProps) {
  if (loadError || !property) {
    return (
      <div className="container mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center px-4 text-center">
        <h1 className="mb-3 text-2xl font-bold text-slate-950">
          {loadError ? '매물 정보를 불러오지 못했습니다' : '매물을 찾을 수 없습니다'}
        </h1>
        <p className="mb-6 text-sm text-slate-500">{loadError ?? '삭제되었거나 존재하지 않는 매물입니다.'}</p>
        <Link href="/properties" className="ansim-button-primary">
          매물 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-100 bg-white/90 px-4 backdrop-blur md:hidden">
        <button className="-ml-2 p-2 text-slate-600">
          <ArrowLeft className="h-6 w-6" />
        </button>
        <div className="flex items-center gap-2">
          <button className="p-2 text-slate-600">
            <Share2 className="h-5 w-5" />
          </button>
          <button className="p-2 text-slate-600">
            <Heart className="h-5 w-5" />
          </button>
        </div>
      </div>

      <div className="container mx-auto max-w-5xl px-0 md:px-4 md:pt-8">
        <div className="grid h-[300px] grid-cols-1 gap-2 overflow-hidden md:h-[450px] md:grid-cols-3 md:rounded-2xl">
          <div className="relative md:col-span-2">
            <Image
              src="https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&q=80&w=1000"
              alt="원룸 내부"
              fill
              sizes="(min-width: 768px) 66vw, 100vw"
              className="object-cover"
            />
            <div className="absolute bottom-4 left-4 rounded-full bg-black/55 px-3 py-1 text-xs text-white md:hidden">
              1 / 5
            </div>
          </div>
          <div className="hidden grid-rows-2 gap-2 md:grid">
            <div className="relative">
              <Image
                src="https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&q=80&w=500"
                alt="주방"
                fill
                sizes="33vw"
                className="object-cover"
              />
            </div>
            <div className="relative">
              <Image
                src="https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&q=80&w=500"
                alt="거실"
                fill
                sizes="33vw"
                className="object-cover"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 font-bold text-white">
                +3장 더보기
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div className="mb-8">
              <div className="mb-3 flex items-center gap-2">
                <Badge className="rounded bg-teal-50 px-2 text-teal-700">전세</Badge>
                <span className="text-sm text-slate-400">등록일 2026.07.01</span>
              </div>
              <h1 className="mb-2 text-2xl font-bold text-slate-950 md:text-3xl">{property.title}</h1>
              <p className="flex items-center gap-1 text-slate-500">
                <MapPin className="h-4 w-4" /> {property.address}
              </p>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-teal-600">{property.deposit}</span>
                <span className="text-sm text-slate-400">{property.maintenance}</span>
              </div>
            </div>

            <hr className="mb-8 border-slate-100" />

            <div className="mb-10 grid grid-cols-2 gap-6 md:grid-cols-4">
              {[
                [Home, '건물유형', '다세대 주택'],
                [Maximize, '전용면적', '19.83m2'],
                [TrendingUp, '층수', '3층 / 5층'],
                [Calendar, '입주가능일', '즉시 입주'],
              ].map(([Icon, label, value]) => {
                const TypedIcon = Icon as typeof Home;
                return (
                  <div key={label as string} className="flex flex-col gap-1">
                    <span className="flex items-center gap-1 text-xs text-slate-400">
                      <TypedIcon className="h-3 w-3" /> {label as string}
                    </span>
                    <span className="font-semibold text-slate-800">{value as string}</span>
                  </div>
                );
              })}
            </div>

            <div className="mb-10">
              <h2 className="mb-4 text-lg font-bold text-slate-950">위치 정보</h2>
              <KakaoMap
                latitude={property.location.latitude}
                longitude={property.location.longitude}
                title={property.title}
                address={property.address}
                className="h-[250px] w-full overflow-hidden rounded-2xl"
              />
            </div>

            <div className="mb-10">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-950">실거래가 비교</h2>
                <span className="text-xs text-slate-500">최근 6개월 추이</span>
              </div>
              <div className="ansim-card p-6">
                <div className="mb-6 flex items-center justify-between gap-4">
                  <div>
                    <p className="mb-1 text-sm text-slate-500">주변 유사 매물 평균 대비</p>
                    <p className="text-xl font-bold text-slate-950">
                      약 <span className="text-orange-500">12% 높음</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="mb-1 text-sm text-slate-500">평균 실거래가</p>
                    <p className="text-lg font-bold text-slate-950">1억 6,000</p>
                  </div>
                </div>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={priceData}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="month"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#94a3b8' }}
                        dy={10}
                      />
                      <YAxis hide />
                      <Tooltip formatter={(value) => [`${Number(value).toLocaleString()}만원`, '가격']} />
                      <Line
                        type="monotone"
                        dataKey="price"
                        stroke="#0d9488"
                        strokeWidth={3}
                        dot={{ r: 4, fill: '#0d9488' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="ansim-card sticky top-24 p-6">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-950">확인 필요 신호</h2>
                <Badge className="bg-orange-100 px-3 text-orange-700">{property.checkSignalCount}개 발견</Badge>
              </div>
              <div className="mb-8 space-y-6">
                {riskSummaries.map((risk) => {
                  const RiskIcon = risk.icon;
                  return (
                    <div key={risk.title} className="flex gap-4">
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${risk.iconBoxClass}`}
                      >
                        <RiskIcon className={`h-5 w-5 ${risk.iconClass}`} />
                      </div>
                      <div>
                        <p className="mb-1 text-sm font-bold text-slate-950">{risk.title}</p>
                        <p className="text-xs leading-relaxed text-slate-500">{risk.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="space-y-3">
                <Link href="/checklist" className="ansim-button-primary w-full">
                  현장 체크리스트 시작
                </Link>
                <Link href="/contract/upload" className="ansim-button-secondary w-full">
                  특약사항 분석하기
                </Link>
              </div>
              <p className="mt-6 text-center text-[10px] leading-relaxed text-slate-400">
                본 분석은 참고용 위험 신호이며 실제 계약 안전을 보장하지 않습니다.
              </p>
            </div>

            <div className="ansim-card p-6">
              <h3 className="mb-4 font-bold text-slate-950">중개사 정보</h3>
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
                  <User className="h-6 w-6 text-slate-400" />
                </div>
                <div>
                  <p className="font-bold text-slate-950">안심공인중개사사무소</p>
                  <p className="text-xs text-slate-500">대표 김안심 | 등록번호 11620-2026-00001</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
