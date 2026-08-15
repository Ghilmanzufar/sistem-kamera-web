import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default function DataTable({ 
  headers, 
  children, 
  loading, 
  isLoading, 
  error = null,
  onRetry = null,
  emptyMessage = "Tidak ada data ditemukan.", 
  maxHeight, 
  center = true 
}) {
  const isCurrentlyLoading = loading !== undefined ? loading : isLoading;

  return (
    <div 
      className="w-full overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/80 shadow-sm"
      style={maxHeight ? { maxHeight, overflowY: 'auto' } : {}}
    >
      <table className="w-full border-collapse relative font-sans">
        <thead className={maxHeight ? "sticky top-0 z-10 shadow-sm bg-slate-950" : ""}>
          <tr className="border-b border-slate-800 bg-slate-950/60 text-xs font-semibold uppercase tracking-wider text-slate-400">
            {headers.map((h, idx) => (
              <th key={idx} className={`p-3.5 sm:p-4 ${center ? 'text-center' : 'text-left'}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60 text-xs sm:text-sm text-slate-200 font-normal">
          {isCurrentlyLoading ? (
            <tr>
              <td colSpan={headers.length} className="p-10 text-center text-slate-400 text-sm">
                <div className="flex flex-col items-center justify-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-blue-400" />
                  <span>Memuat data...</span>
                </div>
              </td>
            </tr>
          ) : error ? (
            <tr>
              <td colSpan={headers.length} className="p-10 text-center">
                <div className="flex flex-col items-center justify-center gap-3">
                  <div className="p-2.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-rose-300">Gagal memuat data</p>
                    <p className="text-xs text-slate-400 mt-0.5">{typeof error === 'string' ? error : 'Terjadi kendala saat menghubungi server.'}</p>
                  </div>
                  {onRetry && (
                    <button
                      type="button"
                      onClick={onRetry}
                      className="mt-1 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Coba Lagi</span>
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ) : React.Children.count(children) === 0 ? (
            <tr>
              <td colSpan={headers.length} className="p-10 text-center text-slate-400 text-sm">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            children
          )}
        </tbody>
      </table>
    </div>
  );
}
