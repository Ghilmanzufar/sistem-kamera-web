import React from 'react';
import { Image as ImageIcon } from 'lucide-react';
import StatusBadge from '../StatusBadge';

export default function HistoryDetailModal({ selectedLog, onClose }) {
  if (!selectedLog) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-2xl bg-slate-900 border-2 border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-white">
              Detail <span className="text-blue-400">Log Inspeksi</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              ID Log: #{selectedLog.id} | Operator: <strong className="text-white">{selectedLog.operator_name || '-'}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white text-2xl font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Foto NG Bukti Snapshot jika ada */}
        {selectedLog.image_path && (
          <div className="rounded-2xl border-2 border-rose-500/50 overflow-hidden bg-black flex flex-col items-center">
            <div className="w-full bg-rose-950/80 px-4 py-2 flex items-center gap-2 text-rose-300 font-black text-xs sm:text-sm border-b border-rose-500/30">
              <ImageIcon className="w-4 h-4" />
              <span>Foto Bukti Cacat (NG Record)</span>
            </div>
            <img
              src={selectedLog.image_path}
              alt="Foto Cacat NG"
              className="w-full max-h-72 object-contain"
            />
          </div>
        )}

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-black/30 p-4 rounded-2xl border border-white/5 space-y-1">
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">Part Number</span>
            <span className="text-xl font-black text-white">{selectedLog.part_no || selectedLog.p_no || '-'}</span>
          </div>

          <div className="bg-black/30 p-4 rounded-2xl border border-white/5 space-y-1">
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">Nama Part / Komponen</span>
            <span className="text-lg font-bold text-white truncate block">{selectedLog.part_name || '-'}</span>
          </div>

          <div className="bg-black/30 p-4 rounded-2xl border border-white/5 space-y-1">
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">Nomor LOT (Lot No)</span>
            <span className="text-lg font-mono font-bold text-white">{selectedLog.lot_no || '-'}</span>
          </div>

          <div className="bg-black/30 p-4 rounded-2xl border border-white/5 space-y-1">
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">Nomor Unik (Unique No)</span>
            <span className="text-lg font-mono font-bold text-white">{selectedLog.unique_no || '-'}</span>
          </div>

          <div className="bg-black/30 p-4 rounded-2xl border border-white/5 space-y-1">
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">Target Qty / Selesai</span>
            <span className="text-lg font-bold text-slate-200">{selectedLog.target_qty ?? '-'} / {selectedLog.qty_actual ?? '-'}</span>
          </div>

          <div className="bg-black/30 p-4 rounded-2xl border border-white/5 space-y-1">
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">Status Deteksi</span>
            <div className="pt-1">
              <StatusBadge status={selectedLog.detection_status || 'OK'} />
            </div>
          </div>

          <div className="bg-black/30 p-4 rounded-2xl border border-white/5 space-y-1">
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">Confidence Score</span>
            <span className="text-xl font-mono font-black text-emerald-400">
              {selectedLog.confidence_score !== undefined ? `${(selectedLog.confidence_score * 100).toFixed(0)}%` : '100%'}
            </span>
          </div>

          <div className="bg-black/30 p-4 rounded-2xl border border-white/5 space-y-1">
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">Metode & Operator</span>
            <div className="pt-1 flex items-center justify-between">
              <span className="text-base font-black text-white">{selectedLog.operator_name || '-'}</span>
              <span className="text-xs font-bold text-slate-400">({selectedLog.method === 'MANUAL' ? 'Manual' : 'AI YOLO'})</span>
            </div>
          </div>

          <div className="bg-black/30 p-4 rounded-2xl border border-white/5 space-y-1 md:col-span-2">
            <span className="block text-xs font-bold uppercase tracking-wider text-slate-400">Waktu Inspeksi</span>
            <span className="text-sm font-semibold text-slate-200">
              {selectedLog.created_at ? new Date(selectedLog.created_at).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'medium' }) : '-'}
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-8 py-3.5 text-sm font-extrabold text-white bg-blue-600 hover:bg-blue-500 rounded-2xl shadow-xl shadow-blue-600/30 transition-all cursor-pointer hover:scale-105"
          >
            Tutup Informasi
          </button>
        </div>
      </div>
    </div>
  );
}
