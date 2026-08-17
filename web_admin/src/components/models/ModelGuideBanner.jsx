import React from 'react';
import { Tag, ChevronDown, ChevronUp, Check, ShieldAlert, AlertTriangle, X } from 'lucide-react';

export default function ModelGuideBanner({ showGuideBanner, onToggleBanner, onOpenGuideModal }) {
  return (
    <div className="glass-card border border-blue-500/20 rounded-2xl overflow-hidden shadow-xl bg-gradient-to-r from-blue-950/40 via-slate-900/60 to-purple-950/30">
      <div className="p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Standarisasi Penamaan Label Model YOLO
              <span className="px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Wajib Diikuti
              </span>
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Pastikan dataset training model AI Anda menggunakan format prefix sisi agar terdeteksi akurat oleh sistem QC.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            onClick={onOpenGuideModal}
            className="text-xs font-semibold text-sky-400 hover:text-sky-300 underline underline-offset-4 mr-2"
          >
            Lihat Detail Lengkap →
          </button>
          <button
            onClick={onToggleBanner}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
            title={showGuideBanner ? "Sembunyikan Ringkasan" : "Tampilkan Ringkasan"}
          >
            {showGuideBanner ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {showGuideBanner && (
        <div className="p-5 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs animate-fadeIn bg-black/20">
          {/* Front Side Rule */}
          <div className="p-4 rounded-xl bg-sky-500/10 border border-sky-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sky-300 flex items-center gap-1.5 text-sm">
                <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse"></span>
                1. Sisi Depan (Front)
              </span>
              <span className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 font-mono font-bold text-[11px]">
                Prefix: F-
              </span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11.5px]">
              Semua komponen tampak depan <strong>WAJIB</strong> diawali prefix <code className="text-sky-300 font-mono font-bold">F-</code>.
            </p>
            <div className="bg-black/40 p-2.5 rounded-lg font-mono text-[11px] text-slate-200 space-y-1 border border-white/5">
              <div className="text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" /> F-74231-0K550-00</div>
              <div className="text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" /> F-HOLE</div>
              <div className="text-rose-400 flex items-center gap-1"><ShieldAlert className="w-3 h-3 text-rose-400" /> F-NG_SCRATCH <span className="text-[9px] text-rose-300 font-sans">(Defect)</span></div>
            </div>
          </div>

          {/* Rear Side Rule */}
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-amber-300 flex items-center gap-1.5 text-sm">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                2. Sisi Belakang (Rear)
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold text-[11px]">
                Prefix: R-
              </span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11.5px]">
              Semua komponen tampak belakang <strong>WAJIB</strong> diawali prefix <code className="text-amber-300 font-mono font-bold">R-</code>.
            </p>
            <div className="bg-black/40 p-2.5 rounded-lg font-mono text-[11px] text-slate-200 space-y-1 border border-white/5">
              <div className="text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" /> R-74231-0K550-00</div>
              <div className="text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" /> R-HOLE</div>
              <div className="text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" /> R-KLIP-KUNING-01</div>
              <div className="text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" /> R-KLIP-KUNING-02</div>
            </div>
          </div>

          {/* Format Rule & Danger */}
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-rose-300 flex items-center gap-1.5 text-sm">
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                3. Format Terlarang
              </span>
              <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono font-bold text-[11px]">
                Hindari ⚠️
              </span>
            </div>
            <p className="text-slate-300 leading-relaxed text-[11.5px]">
              Jangan gunakan spasi atau nama tanpa prefix sisi.
            </p>
            <div className="bg-black/40 p-2.5 rounded-lg font-mono text-[11px] text-slate-200 space-y-1 border border-white/5">
              <div className="text-rose-400 flex items-center gap-1"><X className="w-3 h-3" /> HOLE (Tanpa F-/R-)</div>
              <div className="text-rose-400 flex items-center gap-1"><X className="w-3 h-3" /> R-KLIP KUNING 01 (Ada spasi)</div>
              <div className="text-rose-400 flex items-center gap-1"><X className="w-3 h-3" /> F-HOLE#1 (Simbol terlarang)</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
