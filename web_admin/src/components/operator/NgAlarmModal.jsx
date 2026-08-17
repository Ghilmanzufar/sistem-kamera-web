import React from 'react';
import { ShieldAlert } from 'lucide-react';
import DraggableFloatingCard from './DraggableFloatingCard';

export default function NgAlarmModal({
  isOpen,
  telemetry,
  ngResolving,
  onResolveNg
}) {
  if (!isOpen) return null;

  return (
    <DraggableFloatingCard
      title="ALARM CACAT (NG) AKTIF"
      badge="KONFIRMASI CACAT"
      color="rose"
      icon={ShieldAlert}
      onClose={() => onResolveNg('DISMISS')}
    >
      <div className="space-y-2.5">
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 bg-rose-500/30 border border-rose-400 px-3 py-0.5 rounded-full text-rose-200 font-black text-xs uppercase tracking-wider animate-pulse mb-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>SIRENE & ALARM NG AKTIF!</span>
          </div>
          <h2 className="text-base sm:text-lg font-black text-white">
            ⚠️ CACAT / NG TERDETEKSI! ⚠️
          </h2>
          <p className="text-xs text-rose-300 font-medium mt-0.5">
            Periksa fisik part pada line inspeksi, lalu tentukan konfirmasi di bawah.
          </p>
        </div>

        {/* Kotak Informasi Cacat NG */}
        <div className="p-3 rounded-2xl bg-slate-900/90 border-2 border-rose-500/40 text-left space-y-2 shadow-inner">
          <div className="flex items-center justify-between text-xs border-b border-white/10 pb-1.5">
            <span className="text-slate-400 font-bold uppercase">Part Number:</span>
            <span className="font-mono font-black text-white text-sm">{telemetry.p_no || 'STANDBY'}</span>
          </div>
          <div className="flex items-center justify-between text-xs border-b border-white/10 pb-1.5">
            <span className="text-slate-400 font-bold uppercase">Sisi Terdeteksi:</span>
            <span className="font-bold text-amber-300">{telemetry.current_side === 'F' ? 'FRONT (DEPAN)' : 'REAR (BELAKANG)'}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-bold uppercase">Pesan Sistem / AI:</span>
            <span className="font-bold text-rose-300 truncate max-w-[200px]">
              {telemetry.pesan_ui ? String(telemetry.pesan_ui).replace(/<[^>]+>/g, '') : 'Abnormalitas / Cacat terdeteksi'}
            </span>
          </div>
        </div>

        {/* Tombol Konfirmasi NG / False Alarm */}
        <div className="grid grid-cols-2 gap-2.5 pt-0.5">
          <button
            type="button"
            disabled={ngResolving}
            onClick={() => onResolveNg('DISMISS')}
            className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 border border-white/20 text-slate-200 font-bold rounded-xl shadow text-xs uppercase tracking-wide transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <span>❌ BUKAN NG (ABAIKAN)</span>
          </button>

          <button
            type="button"
            disabled={ngResolving}
            onClick={() => onResolveNg('CONFIRM_NG')}
            className="w-full py-2.5 px-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black rounded-xl shadow-lg shadow-rose-600/50 text-xs uppercase tracking-wide transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <span>🚨 YA, KONFIRMASI NG</span>
          </button>
        </div>
      </div>
    </DraggableFloatingCard>
  );
}
