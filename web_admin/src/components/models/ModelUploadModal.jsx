import React from 'react';
import { ShieldAlert, CheckCircle, AlertTriangle } from 'lucide-react';
import { getLabelValidation } from './modelUtils';

export default function ModelUploadModal({
  isOpen,
  editingPartNo,
  partNo,
  setPartNo,
  previewLoading,
  labelPreview,
  submitting,
  onFileChange,
  onSubmit,
  onClose
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-xl p-8 glass-card border border-white/15 rounded-3xl shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto scrollbar-thin">
        <div className="flex justify-between items-center pb-2 border-b border-white/10">
          <h3 className="text-2xl font-bold text-white">
            {editingPartNo ? 'Rename Model Part' : 'Upload Model AI (.pt / .onnx)'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white font-bold"
          >
            ✕
          </button>
        </div>

        {/* Standar Label Reminder Box */}
        {!editingPartNo && (
          <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-slate-300 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-sky-300">
              <ShieldAlert className="w-4 h-4 text-sky-400" />
              <span>Standar Labeling Wajib:</span>
            </div>
            <p className="text-[11.5px] leading-relaxed text-slate-300">
              Nama label pada model harus memiliki prefix{' '}
              <span className="font-mono text-sky-300 font-bold bg-sky-500/20 px-1 py-0.5 rounded">
                f-
              </span>{' '}
              untuk Sisi Depan dan{' '}
              <span className="font-mono text-amber-300 font-bold bg-amber-500/20 px-1 py-0.5 rounded">
                r-
              </span>{' '}
              untuk Sisi Belakang.
            </p>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-5">
          {!editingPartNo && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Berkas Model YOLO (.pt atau .onnx)
              </label>
              <input
                type="file"
                accept=".pt,.onnx"
                required
                onChange={onFileChange}
                className="w-full p-3 bg-black/30 border border-white/10 rounded-xl text-white text-base file:mr-4 file:py-2.5 file:px-5 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-500 cursor-pointer"
              />
            </div>
          )}

          {previewLoading && (
            <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-300 text-sm animate-pulse">
              ⏳ Membaca label dari berkas model...
            </div>
          )}

          {labelPreview && (
            <div className="p-4 rounded-2xl bg-black/40 border border-white/10 text-sm space-y-3 max-h-64 overflow-y-auto scrollbar-thin">
              <div className="flex items-center justify-between">
                <div className="font-bold text-blue-400 flex items-center gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  Preview Label ({labelPreview.label_count} label ditemukan)
                </div>
              </div>

              <div className="space-y-1.5 pt-1">
                {Object.entries(labelPreview.labels || {}).map(([idx, name]) => {
                  const validation = getLabelValidation(name);
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5 text-xs"
                    >
                      <div className="flex items-center gap-2 font-mono">
                        <span className="text-slate-500 text-[11px]">#{idx}</span>
                        <span className="font-bold text-white">{name}</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10.5px] font-mono font-bold border ${validation.color}`}
                      >
                        {validation.side}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Warning if any non-standard label detected */}
              {Object.values(labelPreview.labels || {}).some(
                (lbl) => getLabelValidation(lbl).status === 'warning'
              ) && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <span>
                    Ditemukan label tanpa prefix <code>f-</code> atau <code>r-</code>. Label ini tidak
                    akan terkelompok otomatis ke sisi Front/Rear.
                  </span>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Part Number (Sesuai nama .pt)
            </label>
            <input
              type="text"
              required
              value={partNo}
              onChange={(e) => setPartNo(e.target.value)}
              placeholder="Contoh: 74231-0K550-00"
              className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white font-mono text-base focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-base font-semibold text-slate-300 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 text-base font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-600/30 disabled:opacity-50 cursor-pointer"
            >
              {submitting
                ? 'Memproses...'
                : editingPartNo
                ? 'Simpan Nama'
                : 'Unggah & Buat Rule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
