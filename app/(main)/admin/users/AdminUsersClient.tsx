'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { updateAdminUserRole, updateAdminUserStatus } from '../../../services/admin';
import { type AdminUserListItemDto, type PageResponseDto } from '../../../types/api';
import { Badge } from '../../../ui/Badge';
import { Modal } from '../../../ui/Modal';
import { Pagination } from '../../../ui/Pagination';
import { Table } from '../../../ui/Table';

type Filters = {
  email: string;
  nickname: string;
  role: string;
  status: string;
};

type AdminUsersClientProps = {
  data?: PageResponseDto<AdminUserListItemDto>;
  loadError?: string;
  filters: Filters;
  currentUserId: number;
};

const ROLE_LABEL: Record<string, string> = { USER: '일반', ADMIN: '관리자' };
const STATUS_LABEL: Record<string, string> = { ACTIVE: '활성', SUSPENDED: '정지', WITHDRAWN: '탈퇴' };
const STATUS_TONE: Record<string, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700',
  SUSPENDED: 'bg-red-50 text-red-700',
  WITHDRAWN: 'bg-slate-100 text-slate-500',
};

type ActiveAction =
  | { type: 'role'; user: AdminUserListItemDto }
  | { type: 'status'; user: AdminUserListItemDto };

export function AdminUsersClient({ data, loadError, filters, currentUserId }: AdminUsersClientProps) {
  const router = useRouter();
  const [email, setEmail] = useState(filters.email);
  const [nickname, setNickname] = useState(filters.nickname);
  const [role, setRole] = useState(filters.role);
  const [status, setStatus] = useState(filters.status);
  const [action, setAction] = useState<ActiveAction | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [actionError, setActionError] = useState<string | undefined>();

  function navigate(next: Partial<Filters & { page: number }>) {
    const merged = { email, nickname, role, status, page: 0, ...next };
    const query = new URLSearchParams();
    if (merged.email) query.set('email', merged.email);
    if (merged.nickname) query.set('nickname', merged.nickname);
    if (merged.role) query.set('role', merged.role);
    if (merged.status) query.set('status', merged.status);
    if (merged.page) query.set('page', String(merged.page));
    const queryString = query.toString();
    router.push(`/admin/users${queryString ? `?${queryString}` : ''}`);
  }

  function handleSearchSubmit(event: React.FormEvent) {
    event.preventDefault();
    navigate({ email, nickname, role, status });
  }

  async function confirmAction() {
    if (!action) return;
    setSubmitting(true);
    setActionError(undefined);
    try {
      if (action.type === 'role') {
        const nextRole = action.user.role === 'ADMIN' ? 'USER' : 'ADMIN';
        await updateAdminUserRole(action.user.id, { role: nextRole });
      } else {
        const nextStatus = action.user.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
        await updateAdminUserStatus(action.user.id, { status: nextStatus });
      }
      setAction(null);
      router.refresh();
    } catch {
      setActionError('처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="ansim-page-title mb-6">유저 관리</h1>

      <form onSubmit={handleSearchSubmit} className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-[1fr_1fr_auto_auto_auto]">
        <div className="relative">
          <Search className="ansim-search-icon" />
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="이메일 검색"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
          />
        </div>
        <input
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          placeholder="닉네임 검색"
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
        />
        <select
          value={role}
          onChange={(event) => setRole(event.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
        >
          <option value="">전체 권한</option>
          <option value="USER">일반</option>
          <option value="ADMIN">관리자</option>
        </select>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm"
        >
          <option value="">전체 상태</option>
          <option value="ACTIVE">활성</option>
          <option value="SUSPENDED">정지</option>
          <option value="WITHDRAWN">탈퇴</option>
        </select>
        <button type="submit" className="ansim-button-primary px-5 py-2.5 text-sm">
          검색
        </button>
      </form>

      {loadError && <div className="ansim-card mb-4 border-red-100 bg-red-50 p-6 text-sm text-red-700">{loadError}</div>}

      {data && (
        <>
          <Table
            columns={[
              { key: 'id', header: 'ID', render: (row) => row.id },
              { key: 'email', header: '이메일', render: (row) => row.email ?? '-' },
              { key: 'nickname', header: '닉네임', render: (row) => row.nickname },
              {
                key: 'role',
                header: '권한',
                render: (row) => (
                  <Badge className={row.role === 'ADMIN' ? 'bg-teal-50 text-teal-700' : 'bg-slate-100 text-slate-600'}>
                    {ROLE_LABEL[row.role]}
                  </Badge>
                ),
              },
              {
                key: 'status',
                header: '상태',
                render: (row) => <Badge className={STATUS_TONE[row.status]}>{STATUS_LABEL[row.status]}</Badge>,
              },
              {
                key: 'createdAt',
                header: '가입일',
                render: (row) => new Date(row.createdAt).toLocaleDateString('ko-KR'),
              },
              {
                key: 'actions',
                header: '',
                render: (row) => {
                  if (row.status === 'WITHDRAWN') return null;
                  // 자기 자신의 권한/상태는 백엔드가 항상 거부한다(스스로 잠기는 사고 방지) — 실패할
                  // 액션을 보여주지 않고 여기서 숨긴다.
                  if (row.id === currentUserId) {
                    return <span className="text-xs text-slate-400">본인 계정</span>;
                  }
                  return (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setAction({ type: 'role', user: row })}
                        className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600 hover:bg-slate-50"
                      >
                        {row.role === 'ADMIN' ? '관리자 해제' : '관리자 지정'}
                      </button>
                      <button
                        onClick={() => setAction({ type: 'status', user: row })}
                        className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-bold text-slate-600 hover:bg-slate-50"
                      >
                        {row.status === 'SUSPENDED' ? '정지 해제' : '정지'}
                      </button>
                    </div>
                  );
                },
              },
            ]}
            rows={data.content}
            rowKey={(row) => row.id}
            emptyMessage="조건에 맞는 유저가 없습니다."
          />
          <Pagination page={data.page} totalPages={data.totalPages} onPageChange={(page) => navigate({ page })} />
        </>
      )}

      <Modal open={action !== null} onClose={() => (submitting ? undefined : setAction(null))}>
        {action && (
          <div>
            <h2 className="mb-2 text-lg font-bold text-slate-950">
              {action.type === 'role'
                ? action.user.role === 'ADMIN'
                  ? '관리자 권한을 해제할까요?'
                  : '관리자로 지정할까요?'
                : action.user.status === 'SUSPENDED'
                  ? '정지를 해제할까요?'
                  : '이 유저를 정지할까요?'}
            </h2>
            <p className="mb-4 text-sm text-slate-500">
              {action.user.nickname} ({action.user.email ?? '이메일 없음'})
            </p>
            {actionError && <p className="mb-3 text-sm text-red-600">{actionError}</p>}
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setAction(null)}
                disabled={submitting}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600"
              >
                취소
              </button>
              <button
                onClick={confirmAction}
                disabled={submitting}
                className="ansim-button-primary px-4 py-2 text-sm disabled:opacity-50"
              >
                확인
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
