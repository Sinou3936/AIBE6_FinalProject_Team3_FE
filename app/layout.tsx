import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: '안심집 - 청년 주거 계약 안전 서비스',
  description: '사회초년생과 대학생을 위한 부동산 계약 안전 확인 서비스',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
