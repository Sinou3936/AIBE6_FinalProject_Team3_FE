import { type ReactNode } from 'react';
import { cn } from '../lib/cn';

type TableColumn<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
};

type TableProps<T> = {
  columns: TableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string | number;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
};

export function Table<T>({ columns, rows, rowKey, emptyMessage = '표시할 데이터가 없습니다.', onRowClick }: TableProps<T>) {
  return (
    <div className="ansim-card overflow-x-auto p-0">
      <table className="w-full min-w-max text-left text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-500">
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
              <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-400">
                {emptyMessage}
              </td>
            </tr>
          )}
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                'border-b border-slate-100 last:border-0',
                onRowClick && 'cursor-pointer transition hover:bg-slate-50',
              )}
            >
              {columns.map((column) => (
                <td key={column.key} className={cn('px-4 py-3 text-slate-700', column.className)}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
