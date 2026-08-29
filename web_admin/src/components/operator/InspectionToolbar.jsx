import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

export default function InspectionToolbar({
  isRunning,
  isManualMode,
  onManualPass,
  onManualReject,
  onSimulateNg
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/80 px-3.5 py-2 rounded-xl border border-white/10 backdrop-blur-md shadow-md shrink-0">
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Tombol PASS MANUAL (Tersedia saat transaksi aktif sebagai Fallback / Mode Manual) */}
        {isRunning && (
          <button
            type="button"
            onClick={onManualPass}
            title="Klik jika part secara visual telah diverifikasi OK namun AI kesulitan mendeteksi"
            className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer hover:scale-105 active:scale-95"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>✅ PASS MANUAL (OK)</span>
          </button>
        )}

        {/* Tombol REJECT MANUAL */}
        {isRunning && (
          <button
            type="button"
            onClick={onManualReject}
            title="Klik jika part secara visual ditemukan cacat (NG) oleh operator"
            className="py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all cursor-pointer hover:scale-105 active:scale-95"
          >
            <XCircle className="w-4 h-4" />
            <span>❌ REJECT (NG)</span>
          </button>
        )}

        {/* Tombol SIMULASI NG (Selalu bisa diklik untuk demo / preview tampilan & alarm NG) */}
        <button
          type="button"
          onClick={onSimulateNg}
          title="Klik untuk mensimulasikan tampilan alarm darurat, modal, dan sirene NG"
          className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-amber-600 via-rose-600 to-red-600 hover:from-amber-500 hover:via-rose-500 hover:to-red-500 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-rose-900/40 border border-amber-400/40 transition-all cursor-pointer hover:scale-105 active:scale-95"
        >
          <AlertTriangle className="w-4 h-4 text-amber-200 animate-pulse" />
          <span>🧪 SIMULASI NG</span>
        </button>

        {!isRunning && (
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 py-1 px-2">
            <span className="w-2 h-2 rounded-full bg-slate-500 animate-pulse"></span>
            <span>Menunggu Transaksi SISON Dimulai...</span>
          </div>
        )}
      </div>

      <div className="text-xs text-slate-400 font-bold hidden sm:block">
        {isManualMode ? (
          <span className="text-amber-400 font-mono">⚠️ MODE INSPEKSI MANUAL AKTIF</span>
        ) : (
          <span>Sistem Kamera Inspeksi AI Real-Time</span>
        )}
      </div>
    </div>
  );
}


