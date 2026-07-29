'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowRight,
  Camera,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  Info,
  Upload,
} from 'lucide-react';
import { analyzeContract, maskContractText, submitContractInput } from '../../../services/contract-analysis';
import { type ContractAnalysisResult } from '../../../types/domain';

// query string은 서버에 남기지 않는 대신 브라우저 히스토리/로그에 노출되므로, 결과를 그대로 담지 않고
// base64url로 인코딩한다. 브라우저에는 Buffer가 없어 TextEncoder + btoa로 UTF-8 안전하게 인코딩한다.
function encodeContractAnalysisResult(result: ContractAnalysisResult): string {
  const json = JSON.stringify(result);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export default function Page() {
  const router = useRouter();
  const [isDragging, setIsDragging] = useState(false);
  const [text, setText] = useState('');
  const [checks, setChecks] = useState({
    specialClauseOnly: false,
    maskedPrivacy: false,
    consent: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | undefined>();

  const toggleCheck = (key: keyof typeof checks) => {
    setChecks((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const allChecked = Object.values(checks).every(Boolean);
  const canSubmit = allChecked && text.trim().length > 0 && !isSubmitting;

  const handleSubmit = async () => {
    if (!canSubmit) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(undefined);

    try {
      const inputResult = await submitContractInput(text);
      // 텍스트로 직접 입력하는 이 화면에서는 항상 nextStep이 'MASKING'이어야 정상이다.
      // 'OCR'이 오면 이미지 입력이 필요하다는 뜻인데, 이 화면은 아직 텍스트만 지원한다.
      if (inputResult.nextStep === 'OCR') {
        throw new Error('이미지 입력은 아직 지원하지 않습니다.');
      }

      const maskedText = await maskContractText(text);
      const result = await analyzeContract(maskedText, checks.consent);
      const encoded = encodeContractAnalysisResult(result);
      router.push(`/contract/result?data=${encoded}`);
    } catch {
      setSubmitError('특약사항 분석에 실패했습니다. 잠시 후 다시 시도해 주세요.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto max-w-3xl px-4 py-8 md:py-16">
      <div className="mb-10 text-center">
        <h1 className="ansim-page-title mb-4">특약사항 AI 분석</h1>
        <p className="ansim-page-description">
          계약서 전체가 아니라 특약사항 핵심 문구만 촬영하거나 입력해 위험 문구, 쉬운 설명, 다시 물어볼 질문을
          확인합니다.
        </p>
      </div>

      <div
        className={`ansim-card mb-10 flex cursor-pointer flex-col items-center border-2 border-dashed p-10 text-center transition-all md:p-16 ${
          isDragging ? 'border-teal-500 bg-teal-50' : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50/50'
        }`}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
        }}
      >
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-100">
          <Upload className="h-8 w-8 text-teal-600" />
        </div>
        <h3 className="mb-2 text-lg font-bold text-slate-950">특약사항 문구 업로드</h3>
        <p className="mb-8 max-w-sm text-slate-500">
          특약사항이 보이는 사진이나 PDF 일부를 올려 주세요. 전화번호, 계좌번호, 주민등록번호는 가린 뒤 분석합니다.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {[
            [ImageIcon, '사진'],
            [Camera, '직접 촬영'],
            [FileText, 'PDF 일부'],
          ].map(([Icon, label]) => {
            const TypedIcon = Icon as typeof FileText;
            return (
              <div
                key={label as string}
                className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600"
              >
                <TypedIcon className="h-4 w-4" /> {label as string}
              </div>
            );
          })}
        </div>
      </div>

      <div className="mb-10">
        <label className="mb-3 block text-sm font-bold text-slate-700">직접 입력</label>
        <textarea
          className="ansim-input min-h-36 resize-y"
          placeholder="예: 임대인은 개인 사정에 따라 계약 기간 중 목적물 명도를 요청할 수 있다."
          value={text}
          onChange={(event) => setText(event.target.value)}
        />
      </div>

      <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="ansim-card border-blue-100 bg-blue-50/50 p-6">
          <div className="mb-4 flex items-center gap-2">
            <Info className="h-5 w-5 text-blue-600" />
            <h4 className="font-bold text-slate-950">분석 범위</h4>
          </div>
          <ul className="space-y-3">
            {[
              '특약사항과 핵심 문구만 분석합니다.',
              'AI 결과는 법률 자문이 아니라 참고용 설명입니다.',
              '수정 문구는 임대인에게 요청할 수 있는 예시로만 제공합니다.',
            ].map((item) => (
              <li key={item} className="flex gap-2 text-sm leading-relaxed text-slate-600">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="ansim-card border-orange-100 bg-orange-50/50 p-6">
          <div className="mb-4 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            <h4 className="font-bold text-slate-950">개인정보 확인</h4>
          </div>
          <div className="space-y-3">
            {[
              ['specialClauseOnly', '특약사항 부분만 올렸습니다.'],
              ['maskedPrivacy', '전화번호, 계좌번호, 주민등록번호를 가렸습니다.'],
              ['consent', '마스킹된 문구를 분석 요청하는 데 동의합니다.'],
            ].map(([key, label]) => (
              <label key={key} className="flex cursor-pointer items-start gap-3 rounded-lg bg-white/70 p-3">
                <input
                  type="checkbox"
                  checked={checks[key as keyof typeof checks]}
                  onChange={() => toggleCheck(key as keyof typeof checks)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm leading-relaxed text-slate-700">{label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      {submitError && <p className="mb-4 text-center text-sm text-red-600">{submitError}</p>}

      <button
        type="button"
        disabled={!canSubmit}
        onClick={handleSubmit}
        className={`flex w-full items-center justify-center gap-2 rounded-lg px-6 py-4 font-bold transition ${
          canSubmit ? 'bg-teal-600 text-white hover:bg-teal-700' : 'pointer-events-none bg-slate-200 text-slate-400'
        }`}
      >
        {isSubmitting ? '분석 중...' : '특약사항 분석하기'} <ArrowRight className="h-5 w-5" />
      </button>
    </div>
  );
}
