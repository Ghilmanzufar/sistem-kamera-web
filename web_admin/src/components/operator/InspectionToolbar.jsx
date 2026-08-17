import React from 'react';
import { CheckCircle2, XCircle, Send, Camera } from 'lucide-react';

export default function InspectionToolbar({
  isManualMode,
  onManualPass,
  onManualReject,
  onOpenDemoModal,
  onMockDetect
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/80 px-3.5 py-2 rounded-xl border border-white/10 backdrop-blur-md shadow-md shrink-0">
      <div className="flex flex-wrap items-center gap-2.5">
        {/* Tombol PASS MANUAL (Hanya muncul di Mode Manual) */}
        {isManualMode && (
          <button
            type="button"
            onClick={onManualPass}
            className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer animate-bounce"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>✅ PASS MANUAL (OK)</span>
          </button>
        )}

        {/* Tombol REJECT MANUAL (Hanya muncul di Mode Manual) */}
        {isManualMode && (
          <button
            type="button"
            onClick={onManualReject}
            className="py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
          >
            <XCircle className="w-4 h-4" />
            <span>❌ REJECT (NG)</span>
          </button>
        )}

        {/* Tombol Simulator Demo SISON */}
        <button
          type="button"
          onClick={onOpenDemoModal}
          className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-extrabold text-xs sm:text-sm flex items-center gap-2 border border-white/15 transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95"
        >
          <Send className="w-4 h-4 text-indigo-400" />
          <span>🚀 DEMO SISON</span>
        </button>

        {/* Tombol Mock Detect */}
        <button
          type="button"
          onClick={onMockDetect}
          className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-extrabold text-xs sm:text-sm flex items-center gap-2 border border-white/15 transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95"
        >
          <Camera className="w-4 h-4 text-amber-400" />
          <span>📷 MOCK DETECT</span>
        </button>
      </div>

      <div className="text-xs text-slate-400 font-bold hidden sm:block">
        Sistem Kamera Inspeksi AI Real-Time
      </div>
    </div>
  );
}
