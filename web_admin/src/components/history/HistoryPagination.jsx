import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function HistoryPagination({
  totalLogs,
  itemsPerPage,
  startIdx,
  currentPage,
  totalPages,
  onPageChange
}) {
  if (totalLogs === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-900/60 rounded-2xl border-2 border-white/10 shadow-lg backdrop-blur-md">
      <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-300">
        <span className="px-3 py-1 bg-blue-500/20 border border-blue-400/30 text-blue-300 rounded-xl font-extrabold">
          Max {itemsPerPage} Data / Halaman
        </span>
        <span className="text-slate-400">
          Menampilkan <strong>{startIdx + 1}</strong> - <strong>{Math.min(startIdx + itemsPerPage, totalLogs)}</strong> dari <strong>{totalLogs}</strong> riwayat
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
          disabled={currentPage === 1}
          className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border-2 border-white/15 text-white font-extrabold text-xs sm:text-sm disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-md flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
        >
          <ChevronLeft className="w-4 h-4" />
          <span>Sebelumnya</span>
        </button>

        <div className="px-4 py-2 text-xs sm:text-sm font-black text-white bg-slate-950 border-2 border-blue-500/40 rounded-xl shadow-inner">
          <span className="text-blue-400">{currentPage}</span> / <span>{totalPages}</span>
        </div>

        <button
          type="button"
          onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs sm:text-sm disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-md shadow-blue-600/30 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
        >
          <span>Selanjutnya</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
