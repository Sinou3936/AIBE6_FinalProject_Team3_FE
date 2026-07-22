'use client';

import { ArrowLeft, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { regions } from '../../../data/regions_nested';
import { userTransactionTypeOptions } from '../../../data/user';
import { ApiError } from '../../../lib/api/http';
import { registerProfile, updateMyProfile } from '../../../services/user';
import { type ProfileUpdateInput, type UserProfile } from '../../../types/domain';
import { NoticeBox } from '../../../ui/NoticeBox';

type ProfileMode = 'register' | 'edit';

type ProfileClientProps = {
  profile: UserProfile;
  mode: ProfileMode;
  loadError?: string;
};

function toFormValues(profile: UserProfile): ProfileUpdateInput {
  return {
    nickname: profile.nickname,
    interestRegion: profile.interestRegion ?? '',
    transactionType: profile.transactionType,
    currentStage: profile.currentStage ?? '',
  };
}

type ParsedLocation = { sido: string; sigungu: string; eupmyeondong: string };

function uniqueNames(items: readonly { name: string }[]): string[] {
  return Array.from(new Set(items.map((item) => item.name)));
}

function getSigunguOptions(sido: string): string[] {
  const item = regions.find((region) => region.name === sido);
  return item ? uniqueNames(item.sigungu) : [];
}

function getEupmyeondongOptions(sido: string, sigungu: string): string[] {
  const sidoItem = regions.find((region) => region.name === sido);
  const sigunguItem = sidoItem?.sigungu.find((item) => item.name === sigungu);
  return sigunguItem ? uniqueNames(sigunguItem.eupmyeondong) : [];
}

function parseInterestRegion(interestRegion: string | null): ParsedLocation {
  const empty: ParsedLocation = { sido: '', sigungu: '', eupmyeondong: '' };
  if (!interestRegion) {
    return empty;
  }

  const matchedSido = regions.find(
    (item) => interestRegion === item.name || interestRegion.startsWith(`${item.name} `),
  );
  if (!matchedSido) {
    return empty;
  }

  const rest = interestRegion.slice(matchedSido.name.length).trim();
  for (const sigunguItem of matchedSido.sigungu) {
    if (rest === sigunguItem.name || rest.startsWith(`${sigunguItem.name} `)) {
      const eupPart = rest.slice(sigunguItem.name.length).trim();
      const matchedEup = sigunguItem.eupmyeondong.find((eup) => eup.name === eupPart);
      return { sido: matchedSido.name, sigungu: sigunguItem.name, eupmyeondong: matchedEup?.name ?? '' };
    }
    // 세종특별자치시처럼 시·군·구명이 시·도명과 동일해 생략된 경우, 나머지를 읍·면·동으로 바로 매칭
    const matchedEupDirect = sigunguItem.eupmyeondong.find((eup) => eup.name === rest);
    if (matchedEupDirect) {
      return { sido: matchedSido.name, sigungu: sigunguItem.name, eupmyeondong: matchedEupDirect.name };
    }
  }

  return { sido: matchedSido.name, sigungu: '', eupmyeondong: '' };
}

function buildInterestRegion(sido: string, sigungu: string, eupmyeondong: string): string {
  if (!sido) {
    return '';
  }
  const parts = [sido];
  if (sigungu && sigungu !== sido) {
    parts.push(sigungu);
  }
  if (eupmyeondong) {
    parts.push(eupmyeondong);
  }
  return parts.join(' ');
}

export function ProfileClient({ profile, mode, loadError }: ProfileClientProps) {
  const router = useRouter();
  const [formValues, setFormValues] = useState<ProfileUpdateInput>(toFormValues(profile));
  const initialLocation = parseInterestRegion(profile.interestRegion);
  const [sido, setSido] = useState(initialLocation.sido);
  const [sigungu, setSigungu] = useState(initialLocation.sigungu);
  const [eupmyeondong, setEupmyeondong] = useState(initialLocation.eupmyeondong);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>();

  const sigunguOptions = getSigunguOptions(sido);
  const eupmyeondongOptions = getEupmyeondongOptions(sido, sigungu);

  const title = mode === 'register' ? '프로필 등록' : '프로필 수정';

  const handleSidoChange = (nextSido: string) => {
    setSido(nextSido);
    setSigungu('');
    setEupmyeondong('');
    setFormValues((prev) => ({ ...prev, interestRegion: '' }));
  };

  const handleSigunguChange = (nextSigungu: string) => {
    setSigungu(nextSigungu);
    setEupmyeondong('');
    setFormValues((prev) => ({ ...prev, interestRegion: '' }));
  };

  const handleEupmyeondongChange = (nextEupmyeondong: string) => {
    setEupmyeondong(nextEupmyeondong);
    setFormValues((prev) => ({ ...prev, interestRegion: buildInterestRegion(sido, sigungu, nextEupmyeondong) }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formValues.transactionType) {
      setSaveError('관심 거래 유형을 선택해 주세요.');
      return;
    }

    setIsSaving(true);
    setSaveError(undefined);

    try {
      if (mode === 'register') {
        await registerProfile(formValues);
      } else {
        await updateMyProfile(formValues);
      }
      router.push('/mypage');
      router.refresh();
    } catch (error) {
      setSaveError(
        error instanceof ApiError ? error.message : '프로필 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <div className="border-b border-slate-200 bg-white">
        <div className="container mx-auto flex h-16 max-w-3xl items-center gap-3 px-4">
          <Link href="/mypage" className="-ml-2 p-2 text-slate-500 hover:text-slate-950">
            <ArrowLeft className="h-6 w-6" />
          </Link>
          <h1 className="text-lg font-bold text-slate-950">{title}</h1>
        </div>
      </div>

      <div className="container mx-auto max-w-3xl px-4 py-8">
        <div className="ansim-card mb-6 p-6">
          <h2 className="mb-2 text-xl font-bold text-slate-950">
            {mode === 'register' ? '프로필 정보를 등록해 주세요' : '프로필 정보를 수정해 주세요'}
          </h2>
          <p className="mb-6 text-sm text-slate-600">입력한 정보는 관심 매물 추천과 마이페이지 요약에 사용됩니다.</p>

          {loadError && <p className="mb-4 text-sm text-red-600">{loadError}</p>}

          {mode === 'register' && (
            <NoticeBox icon={Sparkles} iconClassName="text-teal-600" className="mb-6">
              알고계약은 생성형 AI를 활용해 매물·계약서 분석과 안내 문구를 생성하는 서비스입니다. AI가 생성한 내용은
              참고용 정보이며 정확성을 보장하지 않으니, 중요한 판단은 원본 서류와 전문가 확인을 거쳐 결정해 주세요.
            </NoticeBox>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">닉네임</span>
              <input
                className="ansim-input"
                value={formValues.nickname}
                onChange={(event) => setFormValues((prev) => ({ ...prev, nickname: event.target.value }))}
                placeholder="2~20자로 입력해 주세요"
                minLength={2}
                maxLength={20}
                required
              />
            </label>

            <div>
              <span className="mb-2 block text-sm font-bold text-slate-700">관심 지역</span>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <label className="block">
                  <span className="sr-only">시·도</span>
                  <select
                    className="ansim-input"
                    value={sido}
                    onChange={(event) => handleSidoChange(event.target.value)}
                    required
                  >
                    <option value="" disabled>
                      시·도
                    </option>
                    {regions.map((item) => (
                      <option key={item.name} value={item.name}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="sr-only">시·군·구</span>
                  <select
                    className="ansim-input disabled:cursor-not-allowed disabled:opacity-60"
                    value={sigungu}
                    onChange={(event) => handleSigunguChange(event.target.value)}
                    disabled={!sido || sigunguOptions.length === 0}
                    required={sigunguOptions.length > 0}
                  >
                    <option value="" disabled>
                      시·군·구
                    </option>
                    {sigunguOptions.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="sr-only">읍·면·동</span>
                  <select
                    className="ansim-input disabled:cursor-not-allowed disabled:opacity-60"
                    value={eupmyeondong}
                    onChange={(event) => handleEupmyeondongChange(event.target.value)}
                    disabled={!sigungu || eupmyeondongOptions.length === 0}
                    required={eupmyeondongOptions.length > 0}
                  >
                    <option value="" disabled>
                      읍·면·동
                    </option>
                    {eupmyeondongOptions.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div>
              <span className="mb-2 block text-sm font-bold text-slate-700">관심 거래 유형</span>
              <div className="grid grid-cols-2 gap-2">
                {userTransactionTypeOptions.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFormValues((prev) => ({ ...prev, transactionType: type }))}
                    className={`rounded-xl border py-3 text-sm font-bold transition ${
                      formValues.transactionType === type
                        ? 'border-teal-500 bg-teal-50 text-teal-700'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            <label className="block">
              <span className="mb-2 block text-sm font-bold text-slate-700">현재 단계</span>
              <input
                className="ansim-input"
                value={formValues.currentStage}
                onChange={(event) => setFormValues((prev) => ({ ...prev, currentStage: event.target.value }))}
                placeholder="예: 사회초년생"
              />
            </label>

            {saveError && <p className="text-sm text-red-600">{saveError}</p>}

            <button
              type="submit"
              disabled={isSaving}
              className="ansim-button-primary w-full py-4 text-base disabled:opacity-60"
            >
              {isSaving ? '저장 중...' : mode === 'register' ? '프로필 등록하기' : '프로필 저장하기'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
