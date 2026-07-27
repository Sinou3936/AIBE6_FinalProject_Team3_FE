'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Flag,
  Heart,
  ImageOff,
  Maximize,
  Pencil,
  Share2,
  Trash2,
} from 'lucide-react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { riskSummaries } from '../../../data/property-detail';
import { deleteProperty } from '../../../services/properties';
import { type PropertyDetail } from '../../../types/domain';
import { Badge } from '../../../ui/Badge';
import { KakaoMap } from '../../../ui/KakaoMap';
import { NoticeBox } from '../../../ui/NoticeBox';
import { PropertyReportModal } from './PropertyReportModal';

type PropertyDetailClientProps = {
  property?: PropertyDetail;
  loadError?: string;
};

export function PropertyDetailClient({ property, loadError }: PropertyDetailClientProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);

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

  async function handleDelete() {
    if (!property) return;
    if (!window.confirm('이 매물을 삭제할까요? 삭제 후에는 되돌릴 수 없어요.')) {
      return;
    }

    setDeleteError(null);
    setIsDeleting(true);
    try {
      await deleteProperty(property.id);
      router.push('/properties');
    } catch {
      setDeleteError('매물 삭제에 실패했습니다. 잠시 후 다시 시도해주세요.');
      setIsDeleting(false);
    }
  }

  const images = property.imageUrls;

  return (
    <div className="min-h-screen bg-white pb-24">
      <div className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-slate-100 bg-white/90 px-4 backdrop-blur md:hidden">
        <Link href="/properties" className="-ml-2 p-2 text-slate-600">
          <ArrowLeft className="h-6 w-6" />
        </Link>
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
        {images.length > 0 ? (
          <div className="grid h-[300px] grid-cols-1 gap-2 overflow-hidden md:h-[450px] md:grid-cols-3 md:rounded-2xl">
            <div className="relative md:col-span-2">
              <Image
                src={images[0]}
                alt={property.title}
                fill
                sizes="(min-width: 768px) 66vw, 100vw"
                className="object-cover"
              />
            </div>
            {images.length > 1 && (
              <div className="hidden grid-rows-2 gap-2 md:grid">
                {images.slice(1, 3).map((imageUrl, index) => (
                  <div key={imageUrl} className="relative">
                    <Image
                      src={imageUrl}
                      alt={`${property.title} ${index + 2}`}
                      fill
                      sizes="33vw"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-[160px] flex-col items-center justify-center gap-2 bg-slate-50 text-slate-400 md:h-[200px] md:rounded-2xl">
            <ImageOff className="h-8 w-8" />
            <p className="text-sm">등록된 사진이 없어요</p>
          </div>
        )}
      </div>

      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-3 lg:items-start">
          <div className="lg:col-span-2">
            <div className="mb-8">
              <div className="mb-3 flex items-center gap-2">
                <Badge className="rounded bg-teal-50 px-2 text-teal-700">{property.type}</Badge>
                {property.createdAt && <span className="text-sm text-slate-400">등록일 {property.createdAt}</span>}
              </div>
              <h1 className="mb-2 text-2xl font-bold text-slate-950 md:text-3xl">{property.title}</h1>
              <p className="flex items-center gap-1 text-slate-500">
                <Building2 className="h-4 w-4" /> {property.address}
              </p>
              <div className="mt-6 flex items-baseline gap-2">
                <span className="text-3xl font-bold text-teal-600">{property.deposit}</span>
                {property.maintenance && <span className="text-sm text-slate-400">{property.maintenance}</span>}
              </div>
            </div>

            <hr className="mb-8 border-slate-100" />

            <div className="mb-10 grid grid-cols-2 gap-6 md:grid-cols-3">
              {[
                [Maximize, '전용면적', property.area ? `${property.area}㎡` : '정보 없음'],
                [Calendar, '등록일', property.createdAt ?? '정보 없음'],
              ].map(([Icon, label, value]) => {
                const TypedIcon = Icon as typeof Maximize;
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

            {property.description && (
              <div className="mb-10">
                <h2 className="mb-3 text-lg font-bold text-slate-950">매물 설명</h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">{property.description}</p>
              </div>
            )}

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
                {property.priceHistory && <span className="text-xs text-slate-500">최근 6개월 추이</span>}
              </div>
              {property.priceHistory ? (
                <div className="ansim-card p-6">
                  <div className="mb-6 flex items-center justify-between gap-4">
                    <div>
                      <p className="mb-1 text-sm text-slate-500">주변 유사 매물 평균 대비</p>
                      <p className="text-xl font-bold text-slate-950">
                        {property.marketDelta ? (
                          <span
                            className={property.marketDelta.startsWith('+') ? 'text-orange-500' : 'text-emerald-600'}
                          >
                            {property.marketDelta}
                          </span>
                        ) : (
                          '정보 없음'
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={property.priceHistory}>
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
              ) : (
                <div className="ansim-card p-6 text-sm text-slate-500">
                  아직 실거래가 비교 정보가 없어요. 국토부 실거래가 연동 예정입니다.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="ansim-card p-6">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-bold text-slate-950">확인 필요 신호</h2>
                {property.checkSignalCount !== undefined ? (
                  <Badge className="bg-orange-100 px-3 text-orange-700">{property.checkSignalCount}개 발견</Badge>
                ) : (
                  <Badge className="bg-slate-100 px-3 text-slate-500">준비 중</Badge>
                )}
              </div>
              {property.checkSignalCount !== undefined ? (
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
              ) : (
                <p className="mb-8 text-sm text-slate-500">
                  허위매물 의심 신호와 보증금 안전성 체크는 아직 준비 중이에요.
                </p>
              )}
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
              <h3 className="mb-4 font-bold text-slate-950">매물 관리</h3>
              {deleteError && (
                <NoticeBox icon={AlertTriangle} iconClassName="text-red-500" className="mb-4 bg-red-50 text-red-600">
                  {deleteError}
                </NoticeBox>
              )}
              {reportSuccess && (
                <NoticeBox
                  icon={CheckCircle2}
                  iconClassName="text-emerald-600"
                  className="mb-4 bg-emerald-50 text-emerald-700"
                >
                  신고가 접수됐어요. 검토 후 반영할게요.
                </NoticeBox>
              )}
              <div className="space-y-2">
                <Link
                  href={`/properties/${property.id}/edit`}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <Pencil className="h-4 w-4" /> 매물 정보 수정
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setReportSuccess(false);
                    setIsReportModalOpen(true);
                  }}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  <Flag className="h-4 w-4" /> 매물 신고
                </button>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-100 px-4 py-3 text-sm font-bold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60"
                >
                  <Trash2 className="h-4 w-4" /> {isDeleting ? '삭제 중...' : '매물 삭제'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <PropertyReportModal
        propertyId={property.id}
        open={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
        onSuccess={() => setReportSuccess(true)}
      />
    </div>
  );
}
