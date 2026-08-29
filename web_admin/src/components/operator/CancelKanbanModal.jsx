import React, { useState } from 'react';
import { OctagonAlert, Ban, ArrowLeft } from 'lucide-react';
import DraggableFloatingCard from './DraggableFloatingCard';

export default function CancelKanbanModal({
  isOpen,
  telemetry,
  isCancelling,
  onClose,
  onConfirmCancel
}) {
  const [reason, setReason] = useState('Stok part pengganti habis');

  if (!isOpen) return null;

  const targetQty = telemetry.target_qty || 1;
  const remQty = telemetry.qty_remaining !== undefined ? telemetry.qty_remaining : (telemetry.qty || 0);
  const compQty = Math.max(0, targetQty - remQty);

  const handleConfirm = () => {
    onConfirmCancel(reason);
  };

  return (
    <DraggableFloatingCard
      title="BATALKAN KANBAN"
      badge="KONFIRMASI PEMBATALAN"
      color="rose"
      icon={OctagonAlert}
      onClose={onClose}
    >
      <div className="space-y-3.5 text-left">
        {/* Banner Peringatan Industrial */}
        <div className="flex items-start gap-3 bg-rose-950/80 border-2 border-rose-500/50 p-3 rounded-2xl shadow-inner">
          <div className="w-9 h-9 rounded-xl bg-rose-600/30 border border-rose-400 flex items-center justify-center text-rose-300 shrink-0 mt-0.5">
            <Ban className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-white leading-tight">
              Hentikan Transaksi Kanban Ini?
            </h3>
            <p className="text-xs text-rose-300/90 font-medium mt-0.5 leading-relaxed">
              Gunakan opsi ini jika part NG ditemukan dan <strong className="text-rose-100 font-bold">stok part pengganti tidak tersedia</strong>.
            </p>
          </div>
        </div>

        {/* Ringkasan Informasi Transaksi */}
        <div className="p-3 rounded-2xl bg-slate-900/90 border border-white/15 space-y-2 text-xs shadow-inner">
          <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
            <span className="text-slate-400 font-bold uppercase">ID Transaksi:</span>
            <span className="font-mono font-black text-blue-400 text-sm">{telemetry.id_trans || '-'}</span>
          </div>
          <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
            <span className="text-slate-400 font-bold uppercase">Part Number:</span>
            <span className="font-mono font-black text-white text-xs sm:text-sm">{telemetry.p_no || '-'}</span>
          </div>
          <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
            <span className="text-slate-400 font-bold uppercase">Progres Inspeksi:</span>
            <span className="font-bold text-amber-300">
              {compQty} / {targetQty} PCS Selesai (Sisa {remQty} PCS)
            </span>
          </div>
          <div className="flex items-center justify-between pt-0.5">
            <span className="text-slate-400 font-bold uppercase">Callback SISON:</span>
            <span className="font-mono font-black text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded border border-rose-500/30">
              STATUS 99 (CANCEL)
            </span>
          </div>
        </div>

        {/* Pilihan Alasan Pembatalan */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-extrabold uppercase text-slate-300 block tracking-wide">
            Alasan Pembatalan:
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full bg-slate-900 border border-white/20 rounded-xl py-2 px-3 text-xs text-white font-medium focus:outline-none focus:border-rose-400 transition-colors cursor-pointer"
          >
            <option value="Stok part pengganti habis">Stok part pengganti habis / kosong</option>
            <option value="Part cacat / abnormalitas fisik parah">Part cacat / abnormalitas fisik parah</option>
            <option value="Salah scan Kanban / Salah part">Salah scan Kanban / Salah part</option>
            <option value="Instruksi Pengawas / Supervisor">Instruksi Pengawas / Supervisor</option>
          </select>
        </div>

        {/* Tombol Aksi */}
        <div className="grid grid-cols-2 gap-2.5 pt-1">
          <button
            type="button"
            disabled={isCancelling}
            onClick={onClose}
            className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 border border-white/20 text-slate-200 font-bold rounded-xl shadow text-xs uppercase tracking-wide transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali</span>
          </button>

          <button
            type="button"
            disabled={isCancelling}
            onClick={handleConfirm}
            className="w-full py-2.5 px-3 bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-500 text-white font-black rounded-xl shadow-lg shadow-rose-600/50 text-xs uppercase tracking-wide transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Ban className="w-4 h-4" />
            <span>{isCancelling ? 'Membatalkan...' : 'Ya, Batalkan'}</span>
          </button>
        </div>
      </div>
    </DraggableFloatingCard>
  );
}
