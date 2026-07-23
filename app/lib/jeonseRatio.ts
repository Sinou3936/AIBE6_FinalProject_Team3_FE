import { type PropertyTradeType } from '../types/domain';

export function getJeonseRatioDisplay(type: PropertyTradeType, jeonseRatio: string): string {
  return type === '월세' ? '판정불가(전세 매물만 계산됩니다)' : jeonseRatio;
}
