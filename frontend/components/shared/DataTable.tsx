'use client';
import { useState } from 'react';
import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  emptyMessage?: string;
  totalItems?: number;
  page?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
}

export function DataTable<T extends object>({
  columns,
  data,
  isLoading,
  emptyMessage = 'No data found',
  totalItems,
  page = 1,
  pageSize = 20,
  onPageChange,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const totalPages = totalItems ? Math.ceil(totalItems / pageSize) : 1;

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedData = sortKey
    ? [...data].sort((a, b) => {
        const av = (a as Record<string, unknown>)[sortKey] as string | number;
        const bv = (b as Record<string, unknown>)[sortKey] as string | number;
        if (av < bv) return sortDir === 'asc' ? -1 : 1;
        if (av > bv) return sortDir === 'asc' ? 1 : -1;
        return 0;
      })
    : data;

  return (
    <div className="w-full">
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              {columns.map(col => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left font-medium text-muted-foreground"
                >
                  {col.sortable ? (
                    <button
                      className="flex items-center gap-1 hover:text-foreground"
                      onClick={() => handleSort(col.key)}
                    >
                      {col.header}
                      {sortKey === col.key
                        ? sortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                        : <ChevronsUpDown className="h-3 w-3 opacity-40" />}
                    </button>
                  ) : col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-muted-foreground">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    Loading...
                  </div>
                </td>
              </tr>
            ) : sortedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-muted-foreground">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedData.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
                >
                  {columns.map(col => (
                    <td key={col.key} className="px-4 py-3">
                      {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalItems !== undefined && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {(page - 1) * pageSize + 1}–{Math.min(page * pageSize, totalItems)} of {totalItems}
          </span>
          <div className="flex gap-1">
            <button
              className="rounded px-3 py-1 hover:bg-muted disabled:opacity-40"
              disabled={page <= 1}
              onClick={() => onPageChange?.(page - 1)}
            >
              Prev
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, page - 2) + i;
              if (p > totalPages) return null;
              return (
                <button
                  key={p}
                  className={`rounded px-3 py-1 ${p === page ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                  onClick={() => onPageChange?.(p)}
                >
                  {p}
                </button>
              );
            })}
            <button
              className="rounded px-3 py-1 hover:bg-muted disabled:opacity-40"
              disabled={page >= totalPages}
              onClick={() => onPageChange?.(page + 1)}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
