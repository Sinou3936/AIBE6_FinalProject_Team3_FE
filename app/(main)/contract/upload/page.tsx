'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  ArrowRight,
  Camera,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  Info,
  RotateCcw,
  Upload,
} from 'lucide-react';
import { analyzeContract, extractOcrText, maskContractText, submitContractInput } from '../../../services/contract-analysis';
import { type ContractOcrUncertainField } from '../../../types/api';
import { type ContractAnalysisResult } from '../../../types/domain';
import { NoticeBox } from '../../../ui/NoticeBox';

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png'];

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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [text, setText] = useState('');
  // 이미지 -> OCR까지 마치고 추출된 텍스트를 textarea에 채운 뒤, 사용자가 확인/수정하기를
  // 기다리는 상태. 이 상태에선 제출 버튼이 "마스킹+분석"이 아니라 "확인"으로 동작한다.
  const [ocrConfirmPending, setOcrConfirmPending] = useState(false);
  // OCR이 신뢰도 낮게 추출한 구간. 자동으로 막지는 않고(더 이상 422로 거부되지 않음),
  // 확인 단계에서 "이 부분들을 특히 확인해주세요" 안내로만 보여준다.
  const [uncertainFields, setUncertainFields] = useState<ContractOcrUncertainField[]>([]);
  const [checks, setChecks] = useState({
    specialClauseOnly: false,
    maskedPrivacy: false,
    consent: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | undefined>();

  // objectURL은 selectedImage로부터 파생된 값이라 state가 아니라 useMemo로 계산하고,
  // effect는 이전 URL을 정리(revoke)하는 부수효과만 담당한다.
  const imagePreviewUrl = useMemo(() => (selectedImage ? URL.createObjectURL(selectedImage) : null), [selectedImage]);

  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  const toggleCheck = (key: keyof typeof checks) => {
    setChecks((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleImageFile = (file: File) => {
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      setSubmitError('JPG 또는 PNG 이미지만 업로드할 수 있습니다.');
      return;
    }
    setSubmitError(undefined);
    setOcrConfirmPending(false);
    setUncertainFields([]);
    setText('');
    setSelectedImage(file);
  };

  const handleResetImage = () => {
    setSelectedImage(null);
    setOcrConfirmPending(false);
    setUncertainFields([]);
    setText('');
  };

  const allChecked = Object.values(checks).every(Boolean);
  const hasInput = selectedImage != null || text.trim().length > 0;
  const canSubmit = !ocrConfirmPending && allChecked && hasInput && !isSubmitting;
  const canConfirmOcrText = ocrConfirmPending && text.trim().length > 0 && !isSubmitting;
  const isButtonEnabled = ocrConfirmPending ? canConfirmOcrText : canSubmit;

  const navigateToResult = (result: ContractAnalysisResult) => {
    const encoded = encodeContractAnalysisResult(result);
    router.push(`/contract/result?data=${encoded}`);
  };

  const handleSubmit = async () => {
    if (!isButtonEnabled) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(undefined);

    try {
      // 2단계: OCR 결과를 확인/수정한 뒤 "확인하고 분석하기"를 눌렀을 때 - 곧장 마스킹+분석으로.
      if (ocrConfirmPending) {
        const maskedText = await maskContractText(text);
        const result = await analyzeContract(maskedText, checks.consent);
        navigateToResult(result);
        return;
      }

      // 1단계 - 이미지 우선: 이미지가 선택돼 있으면 텍스트는 무시(입력 UI에서 이미 상호 배타적으로 관리됨).
      if (selectedImage) {
        const inputResult = await submitContractInput({ inputType: 'IMAGE', image: selectedImage });
        if (inputResult.nextStep !== 'OCR') {
          throw new Error('예상하지 못한 응답입니다.');
        }

        const ocrResult = await extractOcrText(selectedImage);
        setText(ocrResult.extractedText);
        setUncertainFields(ocrResult.uncertainFields);
        setOcrConfirmPending(true);
        setIsSubmitting(false);
        return;
      }

      // 1단계 - 텍스트 직접 입력: 항상 nextStep이 'MASKING'이어야 정상이다.
      const inputResult = await submitContractInput({ inputType: 'TEXT', text });
      if (inputResult.nextStep === 'OCR') {
        throw new Error('이미지 입력이 필요합니다.');
      }

      const maskedText = await maskContractText(text);
      const result = await analyzeContract(maskedText, checks.consent);
      navigateToResult(result);
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
        onClick={() => {
          if (!selectedImage) {
            fileInputRef.current?.click();
          }
        }}
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setIsDragging(false);
          const file = event.dataTransfer.files?.[0];
          if (file) {
            handleImageFile(file);
          }
        }}
      >
        {selectedImage && imagePreviewUrl ? (
          <div className="flex w-full flex-col items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element -- blob: 미리보기 URL이라 next/image로 최적화 불가 */}
            <img
              src={imagePreviewUrl}
              alt="선택한 특약사항 이미지 미리보기"
              className="max-h-64 rounded-lg object-contain"
            />
            <p className="text-sm text-slate-500">{selectedImage.name}</p>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                handleResetImage();
              }}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50"
            >
              <RotateCcw className="h-4 w-4" /> 다시 선택
            </button>
          </div>
        ) : (
          <>
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-100">
              <Upload className="h-8 w-8 text-teal-600" />
            </div>
            <h3 className="mb-2 text-lg font-bold text-slate-950">특약사항 문구 업로드</h3>
            <p className="mb-8 max-w-sm text-slate-500">
              특약사항이 보이는 사진이나 PDF 일부를 올려 주세요. 전화번호, 계좌번호, 주민등록번호는 가린 뒤
              분석합니다.
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
          </>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            handleImageFile(file);
          }
          event.target.value = '';
        }}
      />

      <div className="mb-10">
        <label className="mb-3 block text-sm font-bold text-slate-700">
          {ocrConfirmPending ? 'OCR로 추출된 내용 확인' : '직접 입력'}
        </label>
        {ocrConfirmPending && (
          <NoticeBox icon={Info} iconClassName="text-teal-600" className="mb-3 bg-teal-50 text-teal-700">
            이미지에서 추출한 내용이에요. 이 내용이 맞는지 확인해주세요 — 틀린 부분은 직접 수정할 수 있습니다.
          </NoticeBox>
        )}
        {ocrConfirmPending && uncertainFields.length > 0 && (
          <div className="mb-3 rounded-xl border border-orange-100 bg-orange-50 p-4">
            <p className="mb-2 flex items-center gap-2 text-sm font-bold text-orange-700">
              <AlertCircle className="h-4 w-4" /> 이 부분들을 특히 확인해주세요
            </p>
            <ul className="space-y-1">
              {uncertainFields.map((field) => (
                <li key={field.index} className="text-sm text-orange-700">
                  · {field.text}
                </li>
              ))}
            </ul>
          </div>
        )}
        <textarea
          className="ansim-input min-h-36 resize-y"
          placeholder="예: 임대인은 개인 사정에 따라 계약 기간 중 목적물 명도를 요청할 수 있다."
          value={text}
          onChange={(event) => {
            const value = event.target.value;
            setText(value);
            // OCR 확인 단계가 아닌데 이미지가 선택돼 있는 상태로 타이핑을 시작하면, 텍스트 입력으로
            // 전환하는 것으로 보고 이미지 선택을 해제한다(이미지/텍스트 동시 입력으로 헷갈리지 않도록).
            if (!ocrConfirmPending && selectedImage) {
              setSelectedImage(null);
            }
          }}
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
        disabled={!isButtonEnabled}
        onClick={handleSubmit}
        className={`flex w-full items-center justify-center gap-2 rounded-lg px-6 py-4 font-bold transition ${
          isButtonEnabled
            ? 'bg-teal-600 text-white hover:bg-teal-700'
            : 'pointer-events-none bg-slate-200 text-slate-400'
        }`}
      >
        {isSubmitting
          ? '분석 중...'
          : ocrConfirmPending
            ? '확인하고 분석하기'
            : '특약사항 분석하기'}{' '}
        <ArrowRight className="h-5 w-5" />
      </button>
    </div>
  );
}
