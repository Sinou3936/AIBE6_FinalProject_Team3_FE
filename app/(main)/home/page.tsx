import { AlertTriangle, ArrowRight, FileSearch, ShieldAlert, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { quickActions, quickActionToneMap } from '../../data/dashboard';
import { NoticeBox } from '../../ui/NoticeBox';

export default function Page() {
  return (
    <div className="container mx-auto max-w-5xl px-4 py-6 md:py-10">
      <div className="mb-8">
        <h1 className="ansim-page-title mb-2">계약 전 확인할 항목을 정리했어요</h1>
        <p className="ansim-page-description">
          매물 가격, 보증금 안전성, 현장 확인, 특약사항 분석을 순서대로 점검하세요.
        </p>
      </div>

      <div className="mb-10 grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        {quickActions.map((action) => (
          <Link
            key={action.title}
            href={action.to}
            className="ansim-card group p-4 transition-all hover:border-teal-200 hover:bg-teal-50/30 md:p-6"
          >
            <div
              className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl transition-transform group-hover:scale-105 ${quickActionToneMap[action.tone]}`}
            >
              <action.icon className="h-6 w-6" />
            </div>
            <h3 className="mb-1 font-bold text-slate-950">{action.title}</h3>
            <p className="text-xs leading-relaxed text-slate-600 md:text-sm">{action.description}</p>
          </Link>
        ))}
      </div>

      <div className="ansim-card mb-10 bg-white p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-950">요약 정보</h2>
          <Link href="/properties" className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-950">
            전체보기 <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            ['관심 매물', '3개'],
            ['확인 필요 신호', '2개'],
            ['진행 중 체크리스트', '1개'],
            ['분석한 특약사항', '1건'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-slate-50 p-4 text-center">
              <p className="mb-1 text-sm text-slate-500">{label}</p>
              <p className="text-2xl font-bold text-slate-950">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <h2 className="text-lg font-bold text-slate-950">중요 알림</h2>
          <div className="flex items-start gap-4 rounded-xl border border-orange-100 bg-orange-50 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="mb-1 font-bold text-orange-950">시세 대비 가격 확인 필요</p>
              <p className="text-sm leading-relaxed text-orange-800">
                관심 매물 1개가 주변 실거래가보다 높게 등록되어 있습니다. 가격 산정 근거를 다시 확인하세요.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-4 rounded-xl border border-red-100 bg-red-50 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
              <FileSearch className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="mb-1 font-bold text-red-950">특약사항 확인 필요</p>
              <p className="text-sm leading-relaxed text-red-800">
                보증금 반환 조건과 중도 해지 조항에서 다시 물어봐야 할 문구가 발견되었습니다.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-950">매물 기준 정보</h2>
          <div className="ansim-card p-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="rounded-lg bg-teal-50 p-2">
                <TrendingUp className="h-4 w-4 text-teal-600" />
              </div>
              <span className="text-sm font-bold text-slate-950">관심 지역 시세</span>
            </div>
            <p className="mb-1 text-xs text-slate-500">서울 관악구 신림동</p>
            <p className="text-lg font-bold text-slate-950">평균 전세 1.6억</p>
            <p className="mt-2 text-[10px] text-slate-400">최근 6개월 실거래가 기준</p>
          </div>
          <div className="ansim-card p-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="rounded-lg bg-orange-50 p-2">
                <ShieldAlert className="h-4 w-4 text-orange-600" />
              </div>
              <span className="text-sm font-bold text-slate-950">보증금 안전성</span>
            </div>
            <p className="text-sm font-medium text-slate-800">전세가율 82%</p>
            <p className="mt-1 text-xs font-bold text-orange-600">수치와 이유를 확인하세요</p>
          </div>
        </div>
      </div>

      <NoticeBox icon={AlertTriangle} iconClassName="text-orange-500">
        <span className="font-bold">안내:</span> 위험 신호는 확정 판단이 아니라 공공데이터와 입력 정보를 바탕으로 한
        참고용 설명입니다. 실제 계약 전에는 등기부등본, 보증보험 가능 여부, 전문가 검토를 함께 확인하세요.
      </NoticeBox>
    </div>
  );
}
