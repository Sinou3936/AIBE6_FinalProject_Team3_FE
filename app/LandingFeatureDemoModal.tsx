'use client';

import Link from 'next/link';
import { ArrowRight, HelpCircle, MessageSquare } from 'lucide-react';
import { type LandingDemoKey } from './types/domain';
import { Badge } from './ui/Badge';
import { Modal } from './ui/Modal';

type LandingFeatureDemoModalProps = {
  demoKey: LandingDemoKey | null;
  onClose: () => void;
  ctaHref: string;
};

const TITLES: Record<LandingDemoKey, string> = {
  market: '시세 기반 매물 검증 예시',
  contract: 'AI 특약사항 분석 예시',
  deposit: '보증금 안전성 확인 예시',
  checklist: '현장 체크리스트 예시',
};

// 실제 매물/계약서/체크리스트 데이터가 아니라 서비스 화면을 미리 보여주기 위한 고정 예시다 -
// 회원가입 전에는 어떤 개인화된 데이터도 없으므로, 실제 결과 화면(RiskAnalysisClient/
// ContractResultClient/ChecklistClient)과 같은 시각적 스타일(Badge, ansim-card, 색 언어)만
// 그대로 가져오고 값은 대표성 있는 샘플로 채웠다.
function DemoBody({ demoKey }: { demoKey: LandingDemoKey }) {
  switch (demoKey) {
    case 'market':
      return (
        <div className="ansim-card p-6">
          <div className="mb-6">
            <p className="mb-1 text-sm text-slate-500">인근 실거래 12건 기준 (반경 500m)</p>
            <p className="text-xl font-bold text-orange-600">시세보다 15% 높은 가격이에요</p>
          </div>
          <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4 text-sm">
            <div>
              <p className="mb-1 text-xs text-slate-400">기준 시세(중앙값)</p>
              <p className="font-semibold text-slate-800">3억 4,000만원</p>
            </div>
            <div>
              <p className="mb-1 text-xs text-slate-400">기준일</p>
              <p className="font-semibold text-slate-800">2026-06</p>
            </div>
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-slate-400">
            국토교통부 실거래가 공개시스템 기준이며, 참고용 정보이니 실제 시세는 별도로 확인해보세요.
          </p>
        </div>
      );
    case 'contract':
      return (
        <div className="ansim-card overflow-hidden border-l-4 border-l-orange-400 p-5">
          <div className="mb-3 flex items-start gap-2">
            <Badge className="shrink-0 rounded border border-orange-100 bg-orange-50 text-orange-700">
              확인 필요
            </Badge>
            <p className="text-sm text-slate-600">
              &quot;임차인은 계약 만료 전 중도 해지 시 위약금으로 보증금의 20%를 지급한다&quot;
            </p>
          </div>
          <div className="mb-3 flex items-start gap-2">
            <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-teal-600" />
            <p className="text-sm text-slate-700">
              일반적인 위약금 수준(5~10%)보다 높습니다. 과도한 위약금 조항은 임차인에게 불리할 수 있어요.
            </p>
          </div>
          <div className="rounded-xl border border-teal-100 bg-teal-50 p-4">
            <div className="mb-1 flex items-center gap-1.5 text-xs font-bold text-teal-700">
              <HelpCircle className="h-3.5 w-3.5" />
              중개사에게 이렇게 확인해 보세요
            </div>
            <p className="text-sm text-teal-900">&quot;위약금 비율을 낮추거나 삭제할 수 있을까요?&quot;</p>
          </div>
        </div>
      );
    case 'deposit':
      return (
        <div className="ansim-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-bold text-slate-900">보증금 안전성</span>
            <Badge className="bg-orange-100 text-orange-700">전세가율 92%</Badge>
          </div>
          <p className="mb-3 text-sm leading-relaxed text-slate-700">
            전세가율이 80%를 넘으면 집이 경매로 넘어갔을 때 보증금을 온전히 돌려받지 못할 위험이 커집니다.
            선순위 권리 확인이 필요해요.
          </p>
          <p className="text-[11px] leading-relaxed text-slate-400">기준일: 2026-06 · 참고용 정보입니다.</p>
        </div>
      );
    case 'checklist':
      return (
        <div className="space-y-3">
          <div className="ansim-card border-orange-200 bg-orange-50/40 p-4">
            <div className="mb-1 flex items-center gap-2">
              <Badge className="bg-slate-900 text-white">필수</Badge>
              <p className="text-sm font-bold text-slate-900">수도/보일러 작동 확인</p>
            </div>
            <p className="text-xs text-slate-500">방문 시 직접 틀어 온수/배수가 정상인지 확인하세요.</p>
            <div className="mt-2 flex gap-2">
              <span className="rounded-lg border border-orange-200 bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
                미흡
              </span>
              <span className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-bold text-slate-400">
                완료
              </span>
            </div>
          </div>
          <div className="ansim-card p-4">
            <div className="mb-1 flex items-center gap-2">
              <Badge className="bg-slate-900 text-white">필수</Badge>
              <p className="text-sm font-bold text-slate-900">채광 및 소음 확인</p>
            </div>
            <p className="text-xs text-slate-500">낮/밤 시간대를 달리해 확인하는 것을 권장해요.</p>
            <div className="mt-2 flex gap-2">
              <span className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-bold text-slate-400">
                미흡
              </span>
              <span className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                완료
              </span>
            </div>
          </div>
        </div>
      );
    default:
      return null;
  }
}

export function LandingFeatureDemoModal({ demoKey, onClose, ctaHref }: LandingFeatureDemoModalProps) {
  return (
    <Modal open={demoKey !== null} onClose={onClose} maxWidthClassName="max-w-lg">
      {demoKey && (
        <div>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-950">{TITLES[demoKey]}</h2>
            <Badge className="bg-slate-100 text-slate-500">예시 화면</Badge>
          </div>
          <DemoBody demoKey={demoKey} />
          <p className="mb-4 mt-4 text-xs text-slate-400">
            실제 값은 매물/계약서 정보에 따라 달라져요. 이건 서비스 화면을 미리 보여드리기 위한 예시입니다.
          </p>
          <Link href={ctaHref} className="ansim-button-primary w-full justify-center px-6 py-3">
            내 매물로 직접 확인하기 <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}
    </Modal>
  );
}
