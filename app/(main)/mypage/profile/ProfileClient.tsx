'use client';

import { ArrowLeft, Sparkles, User } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { sidoNames } from '../../../data/sido';
import { userTransactionTypeOptions } from '../../../data/user';
import { buildInterestRegion, type ParsedLocation } from '../../../lib/interestRegion';
import { resolveErrorMessage } from '../../../lib/resolveErrorMessage';
import { fetchEupmyeondongOptions, fetchSigunguOptions } from '../../../services/region';
import {
  checkNicknameAvailability,
  registerProfile,
  resetProfileImage,
  updateMyProfile,
  uploadProfileImage,
} from '../../../services/user';
import { type NicknamePolicyDto } from '../../../types/api';
import { type ProfileUpdateInput, type UserProfile } from '../../../types/domain';
import { NoticeBox } from '../../../ui/NoticeBox';

type ProfileMode = 'register' | 'edit';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png'];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

type ProfileClientProps = {
  profile: UserProfile;
  mode: ProfileMode;
  loadError?: string;
  nicknamePolicy: NicknamePolicyDto;
  // 시·군·구/읍·면·동 옵션은 이제 온디맨드로 fetch하므로(app/api/regions/*), 이미 저장된
  // interestRegion에 대응하는 값·옵션 목록은 부모(page.tsx)가 로딩 게이트 안에서 미리 받아와
  // prop으로 넘긴다 - 그래야 이 컴포넌트가 마운트되는 순간부터 select가 깜빡임 없이 올바른
  // 값/목록으로 렌더링된다.
  initialLocation: ParsedLocation;
  initialSigunguOptions: string[];
  initialEupmyeondongOptions: string[];
};

function toFormValues(profile: UserProfile): ProfileUpdateInput {
  return {
    nickname: profile.nickname,
    interestRegion: profile.interestRegion ?? '',
    transactionType: profile.transactionType,
  };
}

export function ProfileClient({
  profile,
  mode,
  loadError,
  nicknamePolicy,
  initialLocation,
  initialSigunguOptions,
  initialEupmyeondongOptions,
}: ProfileClientProps) {
  const router = useRouter();
  const [formValues, setFormValues] = useState<ProfileUpdateInput>(toFormValues(profile));
  const [sido, setSido] = useState(initialLocation.sido);
  const [sigungu, setSigungu] = useState(initialLocation.sigungu);
  const [eupmyeondong, setEupmyeondong] = useState(initialLocation.eupmyeondong);
  const [sigunguOptions, setSigunguOptions] = useState(initialSigunguOptions);
  const [eupmyeondongOptions, setEupmyeondongOptions] = useState(initialEupmyeondongOptions);
  const [sigunguLoading, setSigunguLoading] = useState(false);
  const [eupmyeondongLoading, setEupmyeondongLoading] = useState(false);
  const [regionLoadError, setRegionLoadError] = useState<string>();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>();
  const [imagePreviewError, setImagePreviewError] = useState(false);
  // 선택한 파일은 저장 시 uploadProfileImage(presign -> S3 PUT -> confirm)로 업로드되고, 그 전까지는
  // 로컬 미리보기(imagePreviewUrl)만 보여준다.
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string>();
  const [imageSelectError, setImageSelectError] = useState<string>();
  // 기본 이미지로 되돌리기도 새 사진 선택과 마찬가지로 저장 버튼을 눌러야 실제로 반영된다.
  const [imageResetRequested, setImageResetRequested] = useState(false);
  const [nicknameCheckStatus, setNicknameCheckStatus] = useState<
    'idle' | 'checking' | 'available' | 'duplicate' | 'invalid' | 'error'
  >('idle');
  const [nicknameRequiredError, setNicknameRequiredError] = useState(false);
  // nicknamePolicy.pattern은 <input pattern="...">용 비앵커 정규식이라, JS에서 전체 문자열 일치를
  // 확인하려면 브라우저가 암묵적으로 해주는 ^(?:...)$ 감싸기를 직접 재현해야 한다.
  const nicknamePattern = useMemo(() => new RegExp(`^(?:${nicknamePolicy.pattern})$`), [nicknamePolicy.pattern]);

  const title = mode === 'register' ? '프로필 등록' : '프로필 수정';
  const isNicknameUnchanged = mode === 'edit' && formValues.nickname.trim() === profile.nickname;
  const isNicknameCheckRequired = mode === 'edit' && !isNicknameUnchanged && nicknameCheckStatus !== 'available';

  // object URL은 브라우저 메모리에 남으므로, 새 파일을 고르거나 화면을 떠날 때 이전 URL을 해제한다.
  useEffect(() => {
    return () => {
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
    };
  }, [imagePreviewUrl]);

  const handleImageFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    // 같은 파일을 다시 골라도 onChange가 뜨도록 입력값을 매번 비운다.
    event.target.value = '';
    if (!file) {
      return;
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setImageSelectError('JPG 또는 PNG 파일만 선택할 수 있어요.');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setImageSelectError('파일 크기는 5MB 이하만 가능해요.');
      return;
    }

    setImageSelectError(undefined);
    // 새 파일을 고르면 이전에 눌러둔 "기본 이미지로 변경" 요청은 의미가 없어진다.
    setImageResetRequested(false);
    setSelectedImageFile(file);
    setImagePreviewUrl((prev) => {
      if (prev) {
        URL.revokeObjectURL(prev);
      }
      return URL.createObjectURL(file);
    });
  };

  const handleRequestImageReset = () => {
    setImageSelectError(undefined);
    setImageResetRequested(true);
  };

  const handleCancelImageReset = () => {
    setImageResetRequested(false);
  };

  const handleCancelImageSelection = () => {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }
    setSelectedImageFile(null);
    setImagePreviewUrl(undefined);
    setImageSelectError(undefined);
  };

  // 시/도·시/군/구를 바꾸면 그 하위 옵션을 온디맨드로 다시 받아와야 한다(app/api/regions/*) - 사용자가
  // 연달아 빠르게 바꾸면 먼저 보낸 요청이 나중에 응답할 수 있어, ref로 "가장 최근에 요청한 값"을
  // 들고 있다가 응답 시점에 대조해 낡은 응답이 최신 상태를 덮어쓰지 않게 막는다.
  const latestSidoRequestRef = useRef<string>('');
  const latestSigunguRequestRef = useRef<string>('');

  const handleSidoChange = (nextSido: string) => {
    latestSidoRequestRef.current = nextSido;
    setSido(nextSido);
    setSigungu('');
    setEupmyeondong('');
    setSigunguOptions([]);
    setEupmyeondongOptions([]);
    setFormValues((prev) => ({ ...prev, interestRegion: '' }));
    setRegionLoadError(undefined);

    if (!nextSido) {
      return;
    }
    setSigunguLoading(true);
    fetchSigunguOptions(nextSido)
      .then((options) => {
        if (latestSidoRequestRef.current === nextSido) {
          setSigunguOptions(options);
        }
      })
      .catch(() => {
        if (latestSidoRequestRef.current === nextSido) {
          setRegionLoadError('시·군·구 목록을 불러오지 못했습니다.');
        }
      })
      .finally(() => {
        if (latestSidoRequestRef.current === nextSido) {
          setSigunguLoading(false);
        }
      });
  };

  const handleSigunguChange = (nextSigungu: string) => {
    latestSigunguRequestRef.current = nextSigungu;
    setSigungu(nextSigungu);
    setEupmyeondong('');
    setEupmyeondongOptions([]);
    setFormValues((prev) => ({ ...prev, interestRegion: '' }));
    setRegionLoadError(undefined);

    if (!nextSigungu) {
      return;
    }
    setEupmyeondongLoading(true);
    fetchEupmyeondongOptions(sido, nextSigungu)
      .then((options) => {
        if (latestSigunguRequestRef.current === nextSigungu) {
          setEupmyeondongOptions(options);
        }
      })
      .catch(() => {
        if (latestSigunguRequestRef.current === nextSigungu) {
          setRegionLoadError('읍·면·동 목록을 불러오지 못했습니다.');
        }
      })
      .finally(() => {
        if (latestSigunguRequestRef.current === nextSigungu) {
          setEupmyeondongLoading(false);
        }
      });
  };

  const handleEupmyeondongChange = (nextEupmyeondong: string) => {
    setEupmyeondong(nextEupmyeondong);
    setFormValues((prev) => ({ ...prev, interestRegion: buildInterestRegion(sido, sigungu, nextEupmyeondong) }));
  };

  const handleCheckNickname = async () => {
    const nickname = formValues.nickname.trim();
    if (nickname.length < 2) {
      setNicknameCheckStatus('error');
      return;
    }
    if (!nicknamePattern.test(nickname)) {
      setNicknameCheckStatus('invalid');
      return;
    }

    setNicknameCheckStatus('checking');
    setNicknameRequiredError(false);
    try {
      const available = await checkNicknameAvailability(nickname);
      setNicknameCheckStatus(available ? 'available' : 'duplicate');
    } catch {
      setNicknameCheckStatus('error');
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!formValues.transactionType) {
      setSaveError('관심 거래 유형을 선택해 주세요.');
      return;
    }

    if (isNicknameCheckRequired) {
      setNicknameRequiredError(true);
      return;
    }

    setIsSaving(true);
    setSaveError(undefined);

    // 이미지 처리와 필드 저장은 별도 API 호출이라(백엔드가 하나의 트랜잭션으로 묶어주지 않음),
    // 이미지가 이미 반영된 뒤 필드 저장만 실패하면 사용자에게 "저장이 통째로 실패했다"고 오해를
    // 주지 않도록 그 사실을 에러 메시지에 덧붙인다.
    let imageAlreadyApplied = false;
    try {
      // 프로필 사진은 presign/confirm(또는 삭제) 전용 엔드포인트로 별도 처리한다 -
      // registerProfile/updateMyProfile 둘 다 profileImageUrl을 받지 않는다.
      if (selectedImageFile) {
        await uploadProfileImage(selectedImageFile);
        imageAlreadyApplied = true;
      } else if (imageResetRequested) {
        await resetProfileImage();
        imageAlreadyApplied = true;
      }

      if (mode === 'register') {
        await registerProfile(formValues);
      } else {
        await updateMyProfile(formValues);
      }
      // 최초 등록(온보딩)은 분기 결과가 반영된 홈 화면으로, 이후 수정은 원래 있던 마이페이지로 되돌아간다.
      // register 성공 시에만 notice를 붙여, 홈 화면이 이번이 등록 직후 첫 방문임을 알고 사용법
      // 안내 모달(OnboardingIntroModal)을 한 번 띄우게 한다.
      router.push(mode === 'register' ? '/home?notice=profile_registered' : '/mypage');
      router.refresh();
    } catch (error) {
      const message = resolveErrorMessage(error, '프로필 저장에 실패했습니다. 잠시 후 다시 시도해 주세요.');
      setSaveError(imageAlreadyApplied ? `사진은 이미 반영되었습니다. ${message}` : message);
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
            <div>
              <span className="mb-2 block text-sm font-bold text-slate-700">프로필 사진</span>
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-teal-100">
                  {imagePreviewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={imagePreviewUrl} alt="프로필 사진 미리보기" className="h-full w-full object-cover" />
                  ) : !imageResetRequested && profile.profileImageUrl && !imagePreviewError ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.profileImageUrl}
                      alt="프로필 사진 미리보기"
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover"
                      onError={() => setImagePreviewError(true)}
                    />
                  ) : (
                    <User className="h-8 w-8 text-teal-700" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <label className="ansim-button-secondary inline-flex cursor-pointer items-center px-4 py-2 text-sm">
                      사진 선택
                      <input
                        type="file"
                        accept="image/jpeg,image/png"
                        onChange={handleImageFileChange}
                        className="hidden"
                      />
                    </label>
                    {selectedImageFile && (
                      <button
                        type="button"
                        onClick={handleCancelImageSelection}
                        className="text-sm font-bold text-slate-500 hover:text-slate-700"
                      >
                        선택 취소
                      </button>
                    )}
                    {!selectedImageFile && profile.profileImageUrl && (
                      <button
                        type="button"
                        onClick={imageResetRequested ? handleCancelImageReset : handleRequestImageReset}
                        className="text-sm font-bold text-slate-500 hover:text-slate-700"
                      >
                        {imageResetRequested ? '되돌리기 취소' : '기본 이미지로 변경'}
                      </button>
                    )}
                  </div>
                  {selectedImageFile && <p className="mt-1.5 text-xs text-slate-500">{selectedImageFile.name}</p>}
                  {imageSelectError && <p className="mt-1.5 text-sm text-red-600">{imageSelectError}</p>}
                  <p className="mt-1.5 text-xs text-slate-400">
                    {imageResetRequested
                      ? `기본 이미지로 변경됩니다 · ${mode === 'register' ? '프로필 등록하기' : '프로필 저장하기'} 버튼을 눌러야 반영돼요.`
                      : `JPG, PNG · 5MB 이하 · ${mode === 'register' ? '프로필 등록하기' : '프로필 저장하기'} 버튼을 눌러야 반영돼요.`}
                  </p>
                </div>
              </div>
            </div>

            {mode === 'edit' && (
              <div>
                <span className="mb-2 block text-sm font-bold text-slate-700">닉네임</span>
                <div className="flex gap-2">
                  <input
                    className="ansim-input flex-1"
                    value={formValues.nickname}
                    onChange={(event) => {
                      setNicknameCheckStatus('idle');
                      setNicknameRequiredError(false);
                      setFormValues((prev) => ({ ...prev, nickname: event.target.value }));
                    }}
                    placeholder="2~20자로 입력해 주세요"
                    minLength={2}
                    maxLength={20}
                    pattern={nicknamePolicy.pattern}
                    title={nicknamePolicy.message}
                    required
                  />
                  <button
                    type="button"
                    onClick={handleCheckNickname}
                    disabled={nicknameCheckStatus === 'checking' || formValues.nickname.trim().length < 2}
                    className="shrink-0 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
                  >
                    {nicknameCheckStatus === 'checking' ? '확인 중...' : '중복확인'}
                  </button>
                </div>
                {nicknameCheckStatus === 'available' && (
                  <p className="mt-1.5 text-sm font-bold text-teal-700">사용 가능한 닉네임입니다.</p>
                )}
                {nicknameCheckStatus === 'duplicate' && (
                  <p className="mt-1.5 text-sm font-bold text-red-600">이미 사용 중인 닉네임입니다.</p>
                )}
                {nicknameCheckStatus === 'invalid' && (
                  <p className="mt-1.5 text-sm text-red-600">{nicknamePolicy.message}</p>
                )}
                {nicknameCheckStatus === 'error' && (
                  <p className="mt-1.5 text-sm text-red-600">닉네임 확인에 실패했습니다. 다시 시도해 주세요.</p>
                )}
                {nicknameRequiredError && nicknameCheckStatus === 'idle' && (
                  <p className="mt-1.5 text-sm font-bold text-red-600">닉네임 중복 확인을 먼저 진행해 주세요.</p>
                )}
              </div>
            )}

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
                    {sidoNames.map((name) => (
                      <option key={name} value={name}>
                        {name}
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
                    disabled={!sido || sigunguLoading || sigunguOptions.length === 0}
                    required={sigunguOptions.length > 0}
                  >
                    <option value="" disabled>
                      {sigunguLoading ? '불러오는 중...' : '시·군·구'}
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
                    disabled={!sigungu || eupmyeondongLoading || eupmyeondongOptions.length === 0}
                    required={eupmyeondongOptions.length > 0}
                  >
                    <option value="" disabled>
                      {eupmyeondongLoading ? '불러오는 중...' : '읍·면·동'}
                    </option>
                    {eupmyeondongOptions.map((name) => (
                      <option key={name} value={name}>
                        {name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {regionLoadError && <p className="mt-1.5 text-sm text-red-600">{regionLoadError}</p>}
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
