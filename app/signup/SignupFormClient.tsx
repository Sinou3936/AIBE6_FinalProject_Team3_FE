'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { ApiError } from '../lib/api/http';
import { resolveErrorMessage } from '../lib/resolveErrorMessage';
import { confirmEmailVerification, requestEmailVerification, signup } from '../services/auth';
import { checkNicknameAvailability } from '../services/user';
import { type NicknamePolicyDto, type PasswordPolicyDto } from '../types/api';

type SignupFormClientProps = {
  passwordPolicy: PasswordPolicyDto;
  nicknamePolicy: NicknamePolicyDto;
};

const RESEND_COOLDOWN_SECONDS = 60; // 백엔드 app.email-verification.resend-cooldown-seconds와 맞춘다.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function SignupFormClient({ passwordPolicy, nicknamePolicy }: SignupFormClientProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>();
  const [nicknameCheckStatus, setNicknameCheckStatus] = useState<
    'idle' | 'checking' | 'available' | 'duplicate' | 'invalid' | 'error'
  >('idle');
  const [nicknameRequiredError, setNicknameRequiredError] = useState(false);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);

  // 이메일 인증(회원가입) 상태 - nicknameCheckStatus와 같은 패턴이다.
  const [emailVerificationStatus, setEmailVerificationStatus] = useState<
    'idle' | 'sending' | 'sent' | 'verifying' | 'verified' | 'error'
  >('idle');
  const [emailVerificationError, setEmailVerificationError] = useState<string>();
  const [verificationCode, setVerificationCode] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  // 인증에 성공한 이메일 값 - 인증 완료 후 사용자가 이메일을 다시 바꾸면 그 이메일은 아직
  // 인증되지 않은 것이므로, 실제 제출값과 이 값이 다르면 인증 완료 상태를 무효화해야 한다.
  const verifiedEmailRef = useRef<string>('');

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);
  // 중복확인 응답이 도착했을 때 입력값이 요청 시점과 여전히 같은지 비교하기 위한 최신값 ref.
  // (2026-08-12) 닉네임을 빠르게 바꿔가며 중복확인을 연달아 누르면, 두 요청 모두 비동기로
  // 진행되어 늦게 도착하는 응답이 최신 입력값과 무관하게 nicknameCheckStatus를 덮어쓸 수
  // 있었다 - state(nickname)는 클로저에 갇혀 응답 시점엔 이미 낡은 값이라 ref로 최신값을
  // 별도로 추적한다.
  const latestNicknameRef = useRef('');
  // nicknamePolicy.pattern은 <input pattern="...">용 비앵커 정규식이라, JS에서 전체 문자열 일치를
  // 확인하려면 브라우저가 암묵적으로 해주는 ^(?:...)$ 감싸기를 직접 재현해야 한다.
  const nicknamePattern = useMemo(() => new RegExp(`^(?:${nicknamePolicy.pattern})$`), [nicknamePolicy.pattern]);

  const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword;

  const handleCheckNickname = async () => {
    const trimmed = nickname.trim();
    if (trimmed.length < 2) {
      setNicknameCheckStatus('error');
      return;
    }
    if (!nicknamePattern.test(trimmed)) {
      setNicknameCheckStatus('invalid');
      return;
    }

    setNicknameCheckStatus('checking');
    setNicknameRequiredError(false);
    try {
      const available = await checkNicknameAvailability(trimmed);
      // 응답이 도착한 시점의 최신 입력값과 이 요청이 확인했던 값이 다르면(그 사이 사용자가
      // 입력을 바꿨으면) 이 결과는 이미 낡은 것이니 화면에 반영하지 않는다.
      if (latestNicknameRef.current.trim() !== trimmed) return;
      setNicknameCheckStatus(available ? 'available' : 'duplicate');
    } catch {
      if (latestNicknameRef.current.trim() !== trimmed) return;
      setNicknameCheckStatus('error');
    }
  };

  const handleRequestEmailVerification = async () => {
    if (!EMAIL_PATTERN.test(email) || emailVerificationStatus === 'sending' || resendCooldown > 0) return;

    setEmailVerificationStatus('sending');
    setEmailVerificationError(undefined);
    try {
      await requestEmailVerification(email);
      setEmailVerificationStatus('sent');
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (requestError) {
      setEmailVerificationStatus('error');
      setEmailVerificationError(resolveErrorMessage(requestError, '인증번호 발송에 실패했습니다. 잠시 후 다시 시도해 주세요.'));
      // 쿨다운(429) 응답이면 백엔드가 이미 이 이메일에 대해 쿨다운을 걸어둔 것이므로, 버튼도
      // 즉시 다시 누를 수 있는 것처럼 보이지 않도록 클라이언트에서도 카운트다운을 시작한다 -
      // 안 그러면 재발송을 눌러도 매번 같은 429만 반복해서 받게 된다. 메일 발송 자체가 실패한
      // 경우(EMAIL_SEND_FAILED)는 Redis 쿨다운이 먼저 걸린 뒤에 실패하므로 마찬가지로 쿨다운이
      // 이미 소비된 상태다 - 두 경우 모두 카운트다운을 시작해 실제 서버 상태와 맞춘다.
      if (
        requestError instanceof ApiError &&
        (requestError.body?.code === 'AUTH_EMAIL_VERIFICATION_TOO_MANY_REQUESTS' ||
          requestError.body?.code === 'EMAIL_SEND_FAILED')
      ) {
        setResendCooldown(RESEND_COOLDOWN_SECONDS);
      }
    }
  };

  const handleConfirmEmailVerification = async () => {
    if (verificationCode.trim().length !== 6 || emailVerificationStatus === 'verifying') return;

    setEmailVerificationStatus('verifying');
    setEmailVerificationError(undefined);
    try {
      await confirmEmailVerification(email, verificationCode.trim());
      verifiedEmailRef.current = email;
      setEmailVerificationStatus('verified');
    } catch (confirmError) {
      setEmailVerificationStatus('sent');
      setEmailVerificationError(resolveErrorMessage(confirmError, '인증번호가 올바르지 않습니다. 다시 확인해 주세요.'));
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    if (emailVerificationStatus !== 'verified' || verifiedEmailRef.current !== email) {
      setEmailVerificationError('이메일 인증을 먼저 완료해 주세요.');
      return;
    }

    if (password !== confirmPassword) {
      // 폼의 암묵적 제출(입력란에서 Enter) 경로는 브라우저가 포커스를 되돌릴 수 있어,
      // 다음 tick으로 미뤄야 포커스 이동이 안정적으로 적용된다.
      setTimeout(() => confirmPasswordRef.current?.focus(), 0);
      return;
    }

    if (nicknameCheckStatus !== 'available') {
      setNicknameRequiredError(true);
      return;
    }

    setIsSubmitting(true);
    setError(undefined);

    try {
      // handleCheckNickname은 nickname.trim()으로 중복 확인을 했으므로, 여기서도 trim된 값을
      // 보내야 한다 - 그대로 보내면 입력값에 앞뒤 공백이 남아 있을 때 "확인된 적 없는" 값이
      // 제출되어 버린다(중복확인 통과 == 실제 제출값이라는 보장이 깨짐).
      await signup({ email, password, nickname: nickname.trim() });
      // 방금 가입한 계정은 프로필을 등록한 적이 없으므로 곧장 등록 화면으로 보낸다.
      router.push('/mypage/profile');
      router.refresh();
    } catch (submitError) {
      setError(resolveErrorMessage(submitError, '회원가입에 실패했습니다. 잠시 후 다시 시도해 주세요.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <label className="block">
        <span className="mb-1.5 block text-sm font-bold text-slate-700">이메일</span>
        <div className="flex gap-2">
          <input
            className="ansim-input flex-1"
            type="email"
            value={email}
            onChange={(event) => {
              const value = event.target.value;
              setEmail(value);
              // 인증 완료 후 이메일을 다시 바꾸면 그 값은 아직 인증되지 않았으므로 상태를 리셋한다.
              if (verifiedEmailRef.current && verifiedEmailRef.current !== value) {
                setEmailVerificationStatus('idle');
              }
              setEmailVerificationError(undefined);
            }}
            placeholder="you@example.com"
            autoComplete="email"
            readOnly={emailVerificationStatus === 'verified'}
            required
          />
          <button
            type="button"
            onClick={handleRequestEmailVerification}
            disabled={
              !EMAIL_PATTERN.test(email) ||
              emailVerificationStatus === 'sending' ||
              emailVerificationStatus === 'verified' ||
              resendCooldown > 0
            }
            className="shrink-0 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
          >
            {emailVerificationStatus === 'sending'
              ? '발송 중...'
              : emailVerificationStatus === 'verified'
                ? '인증 완료'
                : resendCooldown > 0
                  ? `재발송 (${resendCooldown}초)`
                  : emailVerificationStatus === 'sent' || emailVerificationStatus === 'error'
                    ? '재발송'
                    : '인증번호 발송'}
          </button>
        </div>

        {(emailVerificationStatus === 'sent' ||
          emailVerificationStatus === 'verifying' ||
          emailVerificationStatus === 'error') && (
          <div className="mt-2 flex gap-2">
            <input
              className="ansim-input flex-1"
              type="text"
              inputMode="numeric"
              value={verificationCode}
              onChange={(event) => setVerificationCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="6자리 인증번호"
              maxLength={6}
            />
            <button
              type="button"
              onClick={handleConfirmEmailVerification}
              disabled={verificationCode.trim().length !== 6 || emailVerificationStatus === 'verifying'}
              className="shrink-0 rounded-xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60"
            >
              {emailVerificationStatus === 'verifying' ? '확인 중...' : '확인'}
            </button>
          </div>
        )}
        {emailVerificationStatus === 'verified' && (
          <p className="mt-1.5 text-sm font-bold text-teal-700">이메일 인증이 완료되었습니다.</p>
        )}
        {emailVerificationError && <p className="mt-1.5 text-sm text-red-600">{emailVerificationError}</p>}
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-bold text-slate-700">비밀번호</span>
        <input
          className="ansim-input w-full"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="영문, 숫자 포함 8~72자"
          autoComplete="new-password"
          minLength={8}
          maxLength={72}
          pattern={passwordPolicy.pattern}
          title={passwordPolicy.message}
          required
        />
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-bold text-slate-700">비밀번호 확인</span>
        <input
          ref={confirmPasswordRef}
          className="ansim-input w-full"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="비밀번호를 다시 입력해 주세요"
          autoComplete="new-password"
          required
        />
        {passwordMismatch && <p className="mt-1 text-sm text-red-600">비밀번호가 일치하지 않습니다.</p>}
      </label>
      <label className="block">
        <span className="mb-1.5 block text-sm font-bold text-slate-700">닉네임</span>
        <div className="flex gap-2">
          <input
            className="ansim-input flex-1"
            value={nickname}
            onChange={(event) => {
              setNicknameCheckStatus('idle');
              setNicknameRequiredError(false);
              latestNicknameRef.current = event.target.value;
              setNickname(event.target.value);
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
            disabled={nicknameCheckStatus === 'checking' || nickname.trim().length < 2}
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
        {nicknameCheckStatus === 'invalid' && <p className="mt-1.5 text-sm text-red-600">{nicknamePolicy.message}</p>}
        {nicknameCheckStatus === 'error' && (
          <p className="mt-1.5 text-sm text-red-600">닉네임 확인에 실패했습니다. 다시 시도해 주세요.</p>
        )}
        {nicknameRequiredError && nicknameCheckStatus === 'idle' && (
          <p className="mt-1.5 text-sm font-bold text-red-600">닉네임 중복 확인을 먼저 진행해 주세요.</p>
        )}
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isSubmitting}
        className="ansim-button-primary mt-2 w-full py-3 disabled:opacity-60"
      >
        {isSubmitting ? '가입 중...' : '회원가입'}
      </button>
    </form>
  );
}
