import { NextResponse } from 'next/server';
import { useMockData } from '../../../config/dataSource';
import {
  getMockAdminPropertyReportDetail,
  reviewMockAdminPropertyReport,
  updateMockAdminUserRole,
  updateMockAdminUserStatus,
} from '../../../repositories/adminRepository';
import {
  type AdminPropertyReportReviewRequestDto,
  type AdminRoleDto,
  type AdminUserStatusDto,
} from '../../../types/api';

type MockAdminActionRequest =
  | { action: 'USER_ROLE'; userId: number; role: AdminRoleDto }
  | { action: 'USER_STATUS'; userId: number; status: AdminUserStatusDto }
  | { action: 'REPORT_REVIEW'; reportId: number; request: AdminPropertyReportReviewRequestDto }
  | { action: 'REPORT_DETAIL'; reportId: number };

function notFound(message: string) {
  return NextResponse.json({ message }, { status: 404 });
}

function badRequest(message: string) {
  return NextResponse.json({ message }, { status: 400 });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

// 내부 mock 전용 엔드포인트라 인증 토큰 검증 같은 건 없지만, 잘못된 body(필드 누락/타입 오류)로
// 500이 나면 실제 문제(mock 로직 버그)와 구분하기 어려워진다 - action별로 필요한 필드만 최소
// 검증해 400으로 걸러낸다.
function validateRequest(body: unknown): MockAdminActionRequest | null {
  if (!isRecord(body) || typeof body.action !== 'string') return null;

  switch (body.action) {
    case 'USER_ROLE': {
      if (typeof body.userId !== 'number' || (body.role !== 'USER' && body.role !== 'ADMIN')) return null;
      return { action: 'USER_ROLE', userId: body.userId, role: body.role };
    }
    case 'USER_STATUS': {
      if (typeof body.userId !== 'number' || (body.status !== 'ACTIVE' && body.status !== 'SUSPENDED')) return null;
      return { action: 'USER_STATUS', userId: body.userId, status: body.status };
    }
    case 'REPORT_REVIEW': {
      if (typeof body.reportId !== 'number' || !isRecord(body.request)) return null;
      const { status, memo } = body.request;
      if (status !== 'RESOLVED' && status !== 'REJECTED') return null;
      if (memo !== undefined && typeof memo !== 'string') return null;
      return { action: 'REPORT_REVIEW', reportId: body.reportId, request: { status, memo } };
    }
    case 'REPORT_DETAIL': {
      if (typeof body.reportId !== 'number') return null;
      return { action: 'REPORT_DETAIL', reportId: body.reportId };
    }
    default:
      return null;
  }
}

// mock 전용 내부 엔드포인트. 'use client' 컴포넌트(AdminUsersClient/AdminReportsClient)가
// adminRepository.ts의 mock mutation/단건 조회를 직접 호출하면 브라우저 번들 쪽 별도 모듈
// 인스턴스를 바꿔서, page.tsx(Server Component)가 읽는 서버 쪽 복사본에는 반영되지 않는다
// (router.refresh() 후 원래 값으로 되돌아간 것처럼 보임). 이 Route Handler는 항상 서버
// 프로세스 안에서 실행되므로 같은 인스턴스를 바꿀 수 있다 - REPORT_DETAIL도 REPORT_REVIEW로
// 바뀐 상태를 다시 읽어야 해서(그래야 상세 모달을 재오픈해도 목록과 어긋나지 않음) 함께 둔다.
export async function POST(request: Request) {
  if (!useMockData) {
    return NextResponse.json({ message: 'mock 모드에서만 사용할 수 있습니다.' }, { status: 404 });
  }

  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return badRequest('요청 본문을 읽을 수 없습니다.');
  }

  const body = validateRequest(rawBody);
  if (!body) {
    return badRequest('요청 형식이 올바르지 않습니다.');
  }

  switch (body.action) {
    case 'USER_ROLE': {
      const updated = updateMockAdminUserRole(body.userId, body.role);
      return updated ? NextResponse.json(updated) : notFound('유저를 찾을 수 없습니다.');
    }
    case 'USER_STATUS': {
      const updated = updateMockAdminUserStatus(body.userId, body.status);
      return updated ? NextResponse.json(updated) : notFound('유저를 찾을 수 없습니다.');
    }
    case 'REPORT_REVIEW': {
      const updated = reviewMockAdminPropertyReport(body.reportId, body.request);
      return updated ? NextResponse.json(updated) : notFound('신고를 찾을 수 없습니다.');
    }
    case 'REPORT_DETAIL': {
      const detail = getMockAdminPropertyReportDetail(body.reportId);
      return detail ? NextResponse.json(detail) : notFound('신고를 찾을 수 없습니다.');
    }
  }
}
