import React, { useState, useMemo } from 'react';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T, index: number) => React.ReactNode;
  sortable?: boolean;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchPlaceholder?: string;
  searchFilter?: (row: T, searchTerm: string) => boolean;
  initialSortKey?: string;
  initialSortDir?: 'asc' | 'desc';
  pageSizeOptions?: number[];
  extraHeaderRight?: React.ReactNode;
  emptyText?: string;
  renderCard?: (row: T, index: number) => React.ReactNode;
  defaultViewMode?: 'card' | 'table';
  cardGridCols?: string;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  searchPlaceholder = 'ค้นหาข้อมูล...',
  searchFilter,
  initialSortKey,
  initialSortDir = 'asc',
  pageSizeOptions = [9, 18, 36],
  extraHeaderRight,
  emptyText = 'ไม่พบข้อมูลที่ตรงกับเงื่อนไข',
  renderCard,
  defaultViewMode = 'card',
  cardGridCols = 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
}: DataTableProps<T>) {
  const [viewMode, setViewMode] = useState<'card' | 'table'>(defaultViewMode);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<string | undefined>(initialSortKey || columns[0]?.key);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>(initialSortDir);
  const [pageSize, setPageSize] = useState<number>(pageSizeOptions[0] || 9);
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Filter
  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase().trim();
    if (searchFilter) {
      return data.filter(row => searchFilter(row, term));
    }
    return data.filter(row => {
      return Object.values(row).some(val => {
        if (val === null || val === undefined) return false;
        if (typeof val === 'object') return false;
        return String(val).toLowerCase().includes(term);
      });
    });
  }, [data, searchTerm, searchFilter]);

  // Sort
  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal === bVal) return 0;
      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return sortDir === 'asc'
        ? String(aVal).localeCompare(String(bVal), 'th')
        : String(bVal).localeCompare(String(aVal), 'th');
    });
  }, [filteredData, sortKey, sortDir]);

  // Pagination
  const totalItems = sortedData.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (safeCurrentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const currentPageData = useMemo(() => {
    return sortedData.slice(startIndex, endIndex);
  }, [sortedData, startIndex, endIndex]);

  const handleSort = (key: string, sortable?: boolean) => {
    if (sortable === false) return;
    if (sortKey === key) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Top Bar (Length selector, Search, and Card/Table Mode Switcher) */}
      <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/70">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <span>แสดง</span>
            <select
              value={pageSize}
              onChange={e => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs bg-white font-medium focus:outline-none focus:ring-2 focus:ring-[#064a8b]/20 focus:border-[#064a8b]"
            >
              {pageSizeOptions.map(opt => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <span>รายการ ต่อหน้า</span>
          </div>

          {/* View Mode Toggle: Cards (Default) vs Table */}
          <div className="flex items-center bg-slate-200/80 p-0.5 rounded-xl border border-slate-300/80">
            <button
              onClick={() => setViewMode('card')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'card'
                  ? 'bg-white text-[#064a8b] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="แสดงผลแบบการ์ด (Card View)"
            >
              <i className="fa-solid fa-grip text-xs"></i>
              <span>การ์ด (Cards)</span>
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-[#064a8b] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="แสดงผลแบบตาราง (Table View)"
            >
              <i className="fa-solid fa-table-list text-xs"></i>
              <span>ตาราง (Table)</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="relative flex-1 md:w-64">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 pointer-events-none">
              <i className="fa-solid fa-magnifying-glass text-xs"></i>
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-[#064a8b]/20 focus:border-[#064a8b] transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400 hover:text-slate-600"
              >
                <i className="fa-solid fa-xmark text-xs"></i>
              </button>
            )}
          </div>
          {extraHeaderRight}
        </div>
      </div>

      {/* Content Rendering: Card Grid Mode vs Table Mode */}
      {viewMode === 'card' ? (
        <div className="p-4 bg-slate-50/50 min-h-[220px]">
          {currentPageData.length > 0 ? (
            <div className={`grid ${cardGridCols} gap-4`}>
              {currentPageData.map((row, idx) => {
                if (renderCard) {
                  return (
                    <React.Fragment key={row.id || idx}>
                      {renderCard(row, startIndex + idx)}
                    </React.Fragment>
                  );
                }

                // Default Card Rendering if no custom renderCard is provided
                const titleCol = columns[0];
                const otherCols = columns.slice(1);
                return (
                  <div
                    key={row.id || idx}
                    className="bg-white rounded-2xl border border-slate-200 p-4.5 shadow-xs hover:shadow-md hover:border-[#064a8b]/50 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {titleCol && (
                        <div className="border-b border-slate-100 pb-2.5 mb-3">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                            {titleCol.header}
                          </span>
                          <div className="font-bold text-slate-800 text-sm">
                            {titleCol.render ? titleCol.render(row, startIndex + idx) : row[titleCol.key] ?? '-'}
                          </div>
                        </div>
                      )}
                      <div className="space-y-2 text-xs">
                        {otherCols.map(col => (
                          <div key={col.key} className="flex items-center justify-between gap-2 py-0.5">
                            <span className="text-slate-400 text-[11px] font-medium shrink-0">
                              {col.header}:
                            </span>
                            <div className="text-right text-slate-700 font-semibold truncate max-w-[65%]">
                              {col.render ? col.render(row, startIndex + idx) : row[col.key] ?? '-'}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-16 text-center text-slate-400">
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-300 text-3xl mb-1">
                  <i className="fa-solid fa-folder-open"></i>
                </div>
                <p className="text-sm font-semibold text-slate-600">{emptyText}</p>
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="text-xs text-[#064a8b] underline hover:text-[#022247] font-bold mt-1"
                  >
                    ล้างคำค้นหา
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Table Mode */
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-100/80 text-slate-700 font-semibold border-b border-slate-200">
                {columns.map(col => {
                  const isSorted = sortKey === col.key;
                  const isSortable = col.sortable !== false;
                  return (
                    <th
                      key={col.key}
                      onClick={() => handleSort(col.key, col.sortable)}
                      className={`px-4 py-3.5 whitespace-nowrap text-${col.align || 'left'} ${
                        isSortable ? 'cursor-pointer select-none hover:bg-slate-200/70 transition-colors' : ''
                      } ${col.className || ''}`}
                    >
                      <div className={`flex items-center gap-1.5 ${col.align === 'center' ? 'justify-center' : col.align === 'right' ? 'justify-end' : 'justify-start'}`}>
                        <span>{col.header}</span>
                        {isSortable && (
                          <span className="text-xs text-slate-400">
                            {isSorted ? (
                              sortDir === 'asc' ? (
                                <i className="fa-solid fa-arrow-up text-[#064a8b] font-bold"></i>
                              ) : (
                                <i className="fa-solid fa-arrow-down text-[#064a8b] font-bold"></i>
                              )
                            ) : (
                              <i className="fa-solid fa-sort opacity-50 hover:opacity-100"></i>
                            )}
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentPageData.length > 0 ? (
                currentPageData.map((row, idx) => (
                  <tr
                    key={row.id || idx}
                    className="hover:bg-slate-50 transition-colors group"
                  >
                    {columns.map(col => (
                      <td
                        key={col.key}
                        className={`px-4 py-3 text-${col.align || 'left'} text-slate-700 ${col.className || ''}`}
                      >
                        {col.render ? col.render(row, startIndex + idx) : row[col.key] ?? '-'}
                      </td>
                    ))}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-4 py-12 text-center text-slate-400"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <i className="fa-solid fa-folder-open text-4xl text-slate-300"></i>
                      <p className="text-sm font-medium">{emptyText}</p>
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm('')}
                          className="text-xs text-[#064a8b] underline hover:text-[#022247]"
                        >
                          ล้างคำค้นหา
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination Footer */}
      <div className="p-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 bg-slate-50/70">
        <div>
          {totalItems > 0 ? (
            <span>
              แสดง <strong className="text-slate-800">{startIndex + 1}</strong> ถึง{' '}
              <strong className="text-slate-800">{endIndex}</strong> จากทั้งหมด{' '}
              <strong className="text-slate-800">{totalItems}</strong> รายการ
            </span>
          ) : (
            <span>ไม่มีรายการข้อมูล</span>
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={safeCurrentPage <= 1}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <i className="fa-solid fa-chevron-left mr-1"></i> ก่อนหน้า
            </button>

            <div className="flex items-center gap-1 px-1">
              {Array.from({ length: totalPages }).map((_, i) => {
                const pageNum = i + 1;
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= safeCurrentPage - 1 && pageNum <= safeCurrentPage + 1)
                ) {
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`min-w-8 h-8 px-2 text-xs rounded-lg font-bold transition-colors ${
                        safeCurrentPage === pageNum
                          ? 'bg-[#064a8b] text-white shadow-xs'
                          : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                } else if (
                  pageNum === safeCurrentPage - 2 ||
                  pageNum === safeCurrentPage + 2
                ) {
                  return <span key={pageNum} className="px-1 text-slate-400">...</span>;
                }
                return null;
              })}
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={safeCurrentPage >= totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-semibold hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              ถัดไป <i className="fa-solid fa-chevron-right ml-1"></i>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
