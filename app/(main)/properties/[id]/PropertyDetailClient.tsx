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

// "+3%"/"−4%" 같은 부호 표기를 사실 기반 문구로 바꾼다 (문구 정책: 절대적 안전/위험 단정 금지,
// 수치 기반 사실 표현만 사용 - AGENTS.md "Copy / wording policy" 참고).
function formatDifferenceMessage(differenceRateText?: string): string {
  if (!differenceRateText) {
    return '정보 없음';
  }
  const isHigher = differenceRateText.startsWith('+');
  const percent = differenceRateText.replace(/[+-]/g, '');
  return `시세보다 ${percent} ${isHigher ? '높은' : '낮은'} 가격이에요`;
}

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
  // 이번 세션에서 막 신고에 성공한 경우(reportSuccess)와, 이전에 이미 신고해둔 경우(property.reported)
  // 둘 다 "이미 신고했음" 상태로 취급한다 - 상세조회 응답은 페이지를 새로 불러와야 반영되므로.
  const alreadyReported = property.reported === true || reportSuccess;

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
              <h2 className="mb-2 text-lg font-bold text-slate-950">실거래가 비교</h2>
              <p className="mb-4 text-xs leading-relaxed text-slate-400">
                전세 매물의 보증금만 국토교통부 실거래가와 비교돼요. 월세 매물은 비교 대상이 아니에요.
              </p>
              {property.marketComparison?.status === 'AVAILABLE' ? (
                <div className="ansim-card p-6">
                  <div className="mb-6">
                    <p className="mb-1 text-sm text-slate-500">
                      인근 실거래 {property.marketComparison.sampleCount}건 기준 (반경{' '}
                      {property.marketComparison.radiusMeters}m)
                    </p>
                    <p className="text-xl font-bold text-slate-950">
                      {formatDifferenceMessage(property.marketComparison.differenceRateText)}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-sm">
                    <div>
                      <p className="mb-1 text-xs text-slate-400">기준 시세(중앙값)</p>
                      <p className="font-semibold text-slate-800">{property.marketComparison.referencePriceText}</p>
                    </div>
                    <div>
                      <p className="mb-1 text-xs text-slate-400">기준일</p>
                      <p className="font-semibold text-slate-800">{property.marketComparison.referenceDate}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-[11px] leading-relaxed text-slate-400">
                    국토교통부 실거래가 공개시스템 기준이며, 참고용 정보이니 실제 시세는 별도로 확인해보세요.
                  </p>
                </div>
              ) : (
                <div className="ansim-card p-6 text-sm text-slate-500">
                  {property.marketComparison?.message ?? '아직 실거래가 비교 정보가 없어요.'}
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
                <Link href={`/properties/${property.id}/checklist`} className="ansim-button-primary w-full">
                  {property.checklistCreated ? '현장 체크리스트 이어보기' : '현장 체크리스트 시작'}
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
              {alreadyReported && (
                <NoticeBox
                  icon={CheckCircle2}
                  iconClassName="text-emerald-600"
                  className="mb-4 bg-emerald-50 text-emerald-700"
                >
                  {reportSuccess ? '신고가 접수됐어요. 검토 후 반영할게요.' : '이미 신고한 매물이에요.'}
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
                  onClick={() => setIsReportModalOpen(true)}
                  disabled={alreadyReported}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Flag className="h-4 w-4" /> {alreadyReported ? '신고 완료' : '매물 신고'}
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
