import React from 'react';

export default function DataTable({ headers, children, loading, isLoading, emptyMessage = "Tidak ada data ditemukan.", maxHeight, center = true }) {
  const isCurrentlyLoading = loading !== undefined ? loading : isLoading;

  return (
    <div 
      className="w-full overflow-x-auto rounded-2xl border-2 border-white/10 bg-black/20 backdrop-blur-md shadow-2xl"
      style={maxHeight ? { maxHeight, overflowY: 'auto' } : {}}
    >
      <table className="w-full border-collapse relative font-sans">
        <thead className={maxHeight ? "sticky top-0 z-10 shadow-md" : ""}>
          <tr className="border-b-2 border-white/15 bg-white/5 text-xs sm:text-sm font-black uppercase tracking-wider text-slate-200">
            {headers.map((h, idx) => (
              <th key={idx} className={`p-4 sm:p-4.5 ${center ? 'text-center' : 'text-left'}`}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10 text-xs sm:text-sm text-slate-200 font-medium">
          {isCurrentlyLoading ? (
            <tr>
              <td colSpan={headers.length} className="p-8 text-center text-slate-400 text-sm font-bold animate-pulse">
                Memuat data...
              </td>
            </tr>
          ) : React.Children.count(children) === 0 ? (
            <tr>
              <td colSpan={headers.length} className="p-8 text-center text-slate-400 text-sm">
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
