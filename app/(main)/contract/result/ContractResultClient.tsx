'use client';

import { useState } from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Copy,
  Download,
  FileText,
  HelpCircle,
  MessageSquare,
  Share2,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import {
  contractSummaryCards,
  contractTabs,
  depositRatioMarkers,
  depositSafetyActions,
  missingItems,
} from '../../../data/contract-analysis';
import { type ContractAnalysisTab, type ContractClause } from '../../../types/domain';
import { Badge } from '../../../ui/Badge';
import { SummaryCard } from '../../../ui/SummaryCard';

type ContractResultClientProps = {
  clauses: ContractClause[];
  summary?: string;
  aiGeneratedNotice?: string;
  disclaimer?: string;
  loadError?: string;
};

export function ContractResultClient({
  clauses,
  summary,
  aiGeneratedNotice,
  disclaimer,
  loadError,
}: ContractResultClientProps) {
  const [activeTab, setActiveTab] = useState<ContractAnalysisTab>('risk');

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="border-b border-slate-200 bg-white pb-10 pt-8">
        <div className="container mx-auto max-w-6xl px-4">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div>
              <div className="mb-4 flex items-center gap-2">
                <Badge className="bg-orange-100 px-3 text-orange-700">분석 완료</Badge>
                <span className="text-sm text-slate-400">분석 일시: 2026.07.13 14:30</span>
              </div>
              <h1 className="ansim-page-title mb-2">계약서 분석 결과입니다</h1>
              {summary && <p className="ansim-page-description">{summary}</p>}
              {aiGeneratedNotice && <p className="mt-2 text-xs text-slate-400">{aiGeneratedNotice}</p>}
            </div>
            <div className="flex items-center gap-3">
              <button className="ansim-button-secondary px-4 py-2.5 text-sm">
                <Download className="h-4 w-4" /> PDF 저장
              </button>
              <button className="ansim-button-primary px-4 py-2.5 text-sm">
                <Share2 className="h-4 w-4" /> 결과 공유
              </button>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 md:grid-cols-4">
            {contractSummaryCards.map(({ label, value, tone }) => (
              <SummaryCard key={label} label={label} value={value} tone={tone === 'orange' ? 'orange' : 'default'} />
            ))}
          </div>
        </div>
      </div>

      <div className="container mx-auto grid max-w-6xl grid-cols-1 gap-8 px-4 py-10 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-5">
          <div className="ansim-card overflow-hidden">
            <div className="flex items-center justify-between bg-slate-800 p-3">
              <span className="text-xs font-medium text-slate-300">계약서 원본 미리보기</span>
              <button className="p-1 text-slate-400 hover:text-white">
                <Download className="h-4 w-4" />
              </button>
            </div>
            <div className="relative h-[520px] overflow-hidden bg-slate-200 p-8">
              <div className="h-full w-full space-y-6 bg-white p-10 shadow-lg">
                <div className="mx-auto mb-10 h-8 w-1/3 bg-slate-100" />
                <div className="space-y-3">
                  <div className="h-4 w-full bg-slate-50" />
                  <div className="h-4 w-full bg-orange-100 border-l-4 border-orange-500" />
                  <div className="h-4 w-3/4 bg-slate-50" />
                </div>
                <div className="space-y-3 pt-10">
                  <div className="h-4 w-full bg-red-100 border-l-4 border-red-500" />
                  <div className="h-4 w-full bg-slate-50" />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-8 lg:col-span-7">
          <div className="flex w-fit gap-1 rounded-xl bg-slate-200/50 p-1">
            {contractTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-lg px-4 py-2 text-sm font-bold transition-all md:px-6 ${
                  activeTab === tab.key ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === 'risk' && (
            <div className="space-y-6">
              {loadError && (
                <div className="ansim-card border-red-100 bg-red-50 p-6 text-sm text-red-700">{loadError}</div>
              )}
              {clauses.map((item, index) => (
                <div
                  key={index}
                  className="ansim-card border-l-4 border-l-slate-200 p-6 transition-all hover:border-l-teal-500"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <Badge className={`rounded border ${item.levelColor}`}>{item.levelLabel}</Badge>
                    <button className="text-slate-400 hover:text-slate-600">
                      <HelpCircle className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mb-6">
                    <p className="mb-2 text-xs text-slate-400">원문 조항</p>
                    <p className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-sm italic text-slate-700">
                      <span aria-hidden="true">&quot;</span>
                      {item.originalText}
                      <span aria-hidden="true">&quot;</span>
                    </p>
                  </div>
                  <div>
                    <h4 className="mb-2 flex items-center gap-2 text-sm font-bold text-slate-950">
                      <MessageSquare className="h-4 w-4 text-teal-600" /> 설명
                    </h4>
                    <p className="text-sm leading-relaxed text-slate-600">{item.explanation}</p>
                  </div>
                  <div className="mt-8 rounded-xl border border-teal-100 bg-teal-50 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <HelpCircle className="h-4 w-4 text-teal-600" />
                      <span className="text-sm font-bold text-teal-950">중개사에게 이렇게 확인해 보세요</span>
                    </div>
                    <p className="mb-4 text-sm text-teal-800">
                      <span aria-hidden="true">&quot;</span>
                      {item.question}
                      <span aria-hidden="true">&quot;</span>
                    </p>
                    <button className="flex items-center gap-2 text-xs font-bold text-teal-700">
                      <Copy className="h-3 w-3" /> 질문 문구 복사하기
                    </button>
                  </div>
                  <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
                    <div className="mb-3 flex items-center gap-2">
                      <FileText className="h-4 w-4 text-slate-600" />
                      <span className="text-sm font-bold text-slate-950">수정 요청 문구 예시</span>
                    </div>
                    <p className="mb-4 text-sm text-slate-700">
                      <span aria-hidden="true">&quot;</span>
                      {item.suggestedText}
                      <span aria-hidden="true">&quot;</span>
                    </p>
                    <button className="flex items-center gap-2 text-xs font-bold text-slate-600">
                      <Copy className="h-3 w-3" /> 문구 복사하기
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'deposit' && (
            <div className="ansim-card p-8">
              <div className="mb-10 text-center">
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-orange-100">
                  <AlertTriangle className="h-10 w-10 text-orange-600" />
                </div>
                <h3 className="mb-2 text-xl font-bold text-slate-950">보증금 반환 위험 신호가 있어요</h3>
                <p className="text-slate-600">전세가율이 80%를 초과해 주의가 필요합니다.</p>
              </div>
              <div className="space-y-6">
                <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
                  <span className="text-slate-600">전세가율 (보증금 / 추정 매매가)</span>
                  <span className="text-lg font-bold text-orange-600">82%</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full w-[82%] bg-orange-500" />
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  {depositRatioMarkers.map((marker) => (
                    <span key={marker}>{marker}</span>
                  ))}
                </div>
              </div>
              <div className="mt-10 rounded-2xl border border-blue-100 bg-blue-50 p-6">
                <h4 className="mb-4 flex items-center gap-2 font-bold text-blue-950">
                  <ShieldCheck className="h-5 w-5" /> 보증금을 지키기 위한 조치
                </h4>
                <ul className="space-y-3">
                  {depositSafetyActions.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-sm text-blue-800">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'missing' && (
            <div className="space-y-4">
              {missingItems.map(({ title, description }) => (
                <div key={title} className="ansim-card flex items-start gap-4 p-6">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100">
                    <AlertCircle className="h-5 w-5 text-slate-400" />
                  </div>
                  <div className="flex-1">
                    <h4 className="mb-1 font-bold text-slate-950">{title}</h4>
                    <p className="mb-4 text-sm text-slate-500">{description}</p>
                    <button className="text-xs font-bold text-teal-700 hover:underline">확인 요청하기</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-4 pt-6 md:flex-row">
            <Link href="/properties/1/checklist" className="ansim-button-primary flex-1 py-4">
              계약 체크리스트로 이동 <ArrowRight className="h-5 w-5" />
            </Link>
            <button className="ansim-button-secondary flex-1 py-4">전문가 상담 안내받기</button>
          </div>

          {disclaimer && <p className="text-center text-[10px] leading-relaxed text-slate-400">{disclaimer}</p>}
        </div>
      </div>
    </div>
  );
}
