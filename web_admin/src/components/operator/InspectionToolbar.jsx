import React from 'react';
import { Ban, Radio } from 'lucide-react';

export default function InspectionToolbar({
  isRunning,
  isNg,
  onOpenCancelKanban
}) {
  const isTransactionActive = isRunning || isNg;

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/80 px-3.5 py-2 rounded-xl border border-white/10 backdrop-blur-md shadow-md shrink-0">
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Tombol BATALKAN KANBAN (Permanen, Disabled saat Standby, Aktif saat Transaksi) */}
        <button
          type="button"
          disabled={!isTransactionActive}
          onClick={onOpenCancelKanban}
          title={
            isTransactionActive
              ? "Klik untuk membatalkan transaksi Kanban saat ini (misal part pengganti habis)"
              : "Tidak ada transaksi aktif yang dapat dibatalkan"
          }
          className={`py-2 px-4 rounded-xl font-black text-xs sm:text-sm flex items-center gap-2 transition-all select-none ${
            isTransactionActive
              ? "bg-gradient-to-r from-rose-700 via-red-600 to-rose-700 hover:from-rose-600 hover:to-red-500 text-white shadow-lg shadow-rose-900/40 border border-rose-400/40 cursor-pointer hover:scale-105 active:scale-95 animate-pulse"
              : "bg-slate-800/80 border border-white/10 text-slate-500 opacity-50 cursor-not-allowed"
          }`}
        >
          <Ban className="w-4 h-4" />
          <span>⛔ BATALKAN KANBAN</span>
        </button>

        {isTransactionActive ? (
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 py-1 px-2">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>Transaksi Inspeksi Aktif (AI Running)</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 py-1 px-2">
            <span className="w-2 h-2 rounded-full bg-slate-500 animate-pulse"></span>
            <span>Menunggu Transaksi SISON Dimulai...</span>
          </div>
        )}
      </div>

      <div className="text-xs text-slate-400 font-bold hidden sm:block">
        <span>Sistem Kamera Inspeksi AI Real-Time</span>
      </div>
    </div>
  );
}


