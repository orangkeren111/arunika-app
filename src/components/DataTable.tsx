"use client";

import React, { useState, useMemo } from "react";
import { Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown } from "lucide-react";

export interface ColumnDef<TData> {
  accessorKey: keyof TData | string;
  header: string;
  cell?: (info: { row: { original: TData } }) => React.ReactNode;
}

interface DataTableProps<TData> {
  columns: ColumnDef<TData>[];
  data: TData[];
  searchPlaceholder?: string;
}

export function DataTable<TData>({
  columns,
  data,
  searchPlaceholder = "Cari data...",
}: DataTableProps<TData>) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<{ column: string; direction: "asc" | "desc" | null }>({
    column: "",
    direction: null,
  });
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });

  // 1. Filter data based on global search filter
  const filteredData = useMemo(() => {
    if (!globalFilter) return data;
    const filterLower = globalFilter.toLowerCase();
    return data.filter((row: any) => {
      return Object.keys(row).some((key) => {
        const val = row[key];
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(filterLower);
      });
    });
  }, [data, globalFilter]);

  // 2. Sort data based on column sort state
  const sortedData = useMemo(() => {
    if (!sorting.column || !sorting.direction) return filteredData;
    const { column, direction } = sorting;
    const sorted = [...filteredData].sort((a: any, b: any) => {
      const aVal = a[column];
      const bVal = b[column];
      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === "number" && typeof bVal === "number") {
        return direction === "asc" ? aVal - bVal : bVal - aVal;
      }
      return direction === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
    return sorted;
  }, [filteredData, sorting]);

  // 3. Paginate data
  const paginatedData = useMemo(() => {
    const start = pagination.pageIndex * pagination.pageSize;
    const end = start + pagination.pageSize;
    return sortedData.slice(start, end);
  }, [sortedData, pagination]);

  const pageCount = Math.ceil(sortedData.length / pagination.pageSize) || 1;

  const handleSort = (columnKey: string) => {
    setSorting((prev) => {
      if (prev.column === columnKey) {
        if (prev.direction === "asc") {
          return { column: columnKey, direction: "desc" };
        }
        return { column: "", direction: null };
      }
      return { column: columnKey, direction: "asc" };
    });
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="flex items-center gap-2 bg-[var(--background)] px-3 py-2 rounded-lg border border-[var(--border)] max-w-sm">
        <Search size={18} className="text-[var(--muted-foreground)]" />
        <input
          type="text"
          value={globalFilter}
          onChange={(e) => {
            setGlobalFilter(e.target.value);
            setPagination((prev) => ({ ...prev, pageIndex: 0 }));
          }}
          placeholder={searchPlaceholder}
          className="w-full text-sm bg-transparent outline-none text-[var(--foreground)]"
        />
      </div>

      {/* Main Table */}
      <div className="rounded-xl border border-[var(--border)] overflow-hidden bg-[var(--card)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead className="bg-[var(--muted)]/50 text-[var(--muted-foreground)] border-b border-[var(--border)] text-xs uppercase font-semibold">
              <tr>
                {columns.map((col, idx) => (
                  <th
                    key={idx}
                    className="p-4 select-none cursor-pointer hover:text-[var(--foreground)] transition-colors"
                    onClick={() => handleSort(col.accessorKey as string)}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.header}</span>
                      <ArrowUpDown size={14} className="opacity-70" />
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="p-8 text-center text-[var(--muted-foreground)]">
                    Tidak ada data yang ditemukan.
                  </td>
                </tr>
              ) : (
                paginatedData.map((row, rowIdx) => (
                  <tr key={rowIdx} className="hover:bg-[var(--muted)]/10 transition-colors">
                    {columns.map((col, colIdx) => (
                      <td key={colIdx} className="p-4 align-middle text-[var(--foreground)]">
                        {col.cell
                          ? col.cell({ row: { original: row } })
                          : (row as any)[col.accessorKey]}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 text-sm text-[var(--muted-foreground)]">
        <div className="flex items-center gap-2">
          <span>Tampilkan</span>
          <select
            value={pagination.pageSize}
            onChange={(e) => {
              setPagination({ pageIndex: 0, pageSize: Number(e.target.value) });
            }}
            className="p-1.5 border border-[var(--border)] rounded-md bg-[var(--card)] text-[var(--foreground)] outline-none"
          >
            {[5, 10, 20, 30, 40, 50].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span>baris per halaman</span>
        </div>

        <div className="flex items-center gap-4">
          <span>
            Halaman <strong className="text-[var(--foreground)]">{pagination.pageIndex + 1}</strong> dari{" "}
            <strong className="text-[var(--foreground)]">{pageCount}</strong>
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setPagination((prev) => ({ ...prev, pageIndex: 0 }))}
              disabled={pagination.pageIndex === 0}
              className="p-2 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]/20 disabled:opacity-40 transition-colors"
            >
              <ChevronsLeft size={16} />
            </button>
            <button
              onClick={() => setPagination((prev) => ({ ...prev, pageIndex: Math.max(0, prev.pageIndex - 1) }))}
              disabled={pagination.pageIndex === 0}
              className="p-2 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]/20 disabled:opacity-40 transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setPagination((prev) => ({ ...prev, pageIndex: Math.min(pageCount - 1, prev.pageIndex + 1) }))}
              disabled={pagination.pageIndex === pageCount - 1}
              className="p-2 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]/20 disabled:opacity-40 transition-colors"
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => setPagination((prev) => ({ ...prev, pageIndex: pageCount - 1 }))}
              disabled={pagination.pageIndex === pageCount - 1}
              className="p-2 border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]/20 disabled:opacity-40 transition-colors"
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
