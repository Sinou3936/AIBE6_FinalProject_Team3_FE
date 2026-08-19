import { type ReactNode, useEffect, useRef } from 'react';
import { cn } from '../lib/cn';

type TableColumn<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
};

// 체크박스 다중선택 + 일괄처리 UI(AdminUsersClient/AdminReportsClient)를 위한 선택 상태.
// isRowSelectable로 특정 행(예: 탈퇴 유저, 본인 계정, 이미 처리된 신고)을 선택 대상에서
// 제외할 수 있다 - 생략하면 모든 행이 선택 가능하다고 취급한다.
type TableSelection<T> = {
  selectedKeys: Set<string | number>;
  onToggle: (key: string | number) => void;
  onToggleAll: (selectableRows: T[]) => void;
  isRowSelectable?: (row: T) => boolean;
  // 행 체크박스에 개별 접근성 이름을 붙이기 위한 선택적 콜백. 헤더의 "전체 선택"과 달리 각 행은
  // 시각적으로 구분되는 텍스트가 없어(예: 닉네임/ID) 스크린 리더 사용자가 어느 행의 체크박스인지
  // 구분할 수 없었다. 생략 시 aria-label 없이 렌더링돼 기존 Table 호출부와 호환된다.
  getRowAriaLabel?: (row: T) => string;
};

type TableProps<T> = {
  columns: TableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  emptyMessage?: string;
  selection?: TableSelection<T>;
};

export function Table<T>({
  columns,
  rows,
  rowKey,
  emptyMessage = '표시할 데이터가 없습니다.',
  selection,
}: TableProps<T>) {
  const selectableRows = selection ? rows.filter((row) => selection.isRowSelectable?.(row) ?? true) : [];
  const selectedSelectableCount = selection
    ? selectableRows.filter((row) => selection.selectedKeys.has(rowKey(row))).length
    : 0;
  const allSelected = selection ? selectableRows.length > 0 && selectedSelectableCount === selectableRows.length : false;
  const someSelected = selection ? selectedSelectableCount > 0 && !allSelected : false;

  const headerCheckboxRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (headerCheckboxRef.current) {
      headerCheckboxRef.current.indeterminate = someSelected;
    }
  }, [someSelected]);

  return (
    <div className="ansim-card overflow-x-auto p-0">
      <table className="w-full min-w-max text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-500">
            {selection && (
              <th className="w-10 px-4 py-3">
                <input
                  ref={headerCheckboxRef}
                  type="checkbox"
                  checked={allSelected}
                  disabled={selectableRows.length === 0}
                  onChange={() => selection.onToggleAll(selectableRows)}
                  aria-label="전체 선택"
                  className="h-4 w-4 rounded border-slate-300"
                />
              </th>
            )}
            {columns.map((column) => (
              <th key={column.key} className={cn('px-4 py-3', column.className)}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={columns.length + (selection ? 1 : 0)} className="px-4 py-8 text-center text-slate-500">
                {emptyMessage}
              </td>
            </tr>
          )}
          {rows.map((row) => {
            const key = rowKey(row);
            const selectable = selection ? (selection.isRowSelectable?.(row) ?? true) : false;
            return (
              <tr key={key} className="border-b border-slate-100 last:border-0">
                {selection && (
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selection.selectedKeys.has(key)}
                      disabled={!selectable}
                      onChange={() => selection.onToggle(key)}
                      aria-label={selection.getRowAriaLabel?.(row)}
                      className="h-4 w-4 rounded border-slate-300 disabled:opacity-30"
                    />
                  </td>
                )}
                {columns.map((column) => (
                  <td key={column.key} className={cn('px-4 py-3 text-slate-700', column.className)}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
