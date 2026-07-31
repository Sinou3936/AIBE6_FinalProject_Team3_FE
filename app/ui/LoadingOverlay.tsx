import { Loader2 } from 'lucide-react';

type LoadingOverlayProps = {
  message: string;
};

/**
 * 매물 등록/수정 제출 중에 쓰는 오버레이. 두 화면 다 제출이 실거래가 비교(국토부/카카오 API 호출,
 * 반경 300→600m 확장 등)까지 끝나야 응답이 오는 동기 구조라 몇 초씩 걸릴 수 있는데, 그동안
 * "멈춘 건가?"로 오해하지 않게 카드 위에 덮어서 진행 중임을 명확히 보여준다.
 */
export function LoadingOverlay({ message }: LoadingOverlayProps) {
  return (
    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 rounded-2xl bg-white/85 backdrop-blur-sm">
      <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      <p className="text-sm font-semibold text-slate-700">{message}</p>
    </div>
  );
}
