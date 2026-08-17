import React, { useState } from 'react';
import { Info, Download } from 'lucide-react';
import { getLabelValidation } from './modelUtils';

export default function ModelDetailModal({ selectedDetail, onClose, onDownload }) {
  const [detailFilter, setDetailFilter] = useState('all');

  if (!selectedDetail) return null;

  const componentsWithValidation = (selectedDetail.komponen || []).map((c) => ({
    ...c,
    validation: getLabelValidation(c.nama_komponen)
  }));

  const frontCount = componentsWithValidation.filter((c) => c.validation.status === 'front').length;
  const rearCount = componentsWithValidation.filter((c) => c.validation.status === 'rear').length;
  const defectCount = componentsWithValidation.filter((c) => c.validation.isDefect).length;
  const nonStandardCount = componentsWithValidation.filter(
    (c) => c.validation.status === 'warning' && !c.validation.isDefect
  ).length;

  const filteredComponents = componentsWithValidation.filter((c) => {
    if (detailFilter === 'front') return c.validation.status === 'front';
    if (detailFilter === 'rear') return c.validation.status === 'rear';
    if (detailFilter === 'defect') return c.validation.isDefect;
    if (detailFilter === 'warning') return c.validation.status === 'warning';
    return true;
  });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl p-8 glass-card border border-white/15 rounded-3xl shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto scrollbar-thin"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Info className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                Detail Model <span className="text-blue-400 font-mono">{selectedDetail.part_no}</span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Berkas: {selectedDetail.filename} ({selectedDetail.format})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white font-bold"
          >
            ✕
          </button>
        </div>

        <div className="space-y-5 text-sm">
          {/* Meta Info Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-black/40 border border-white/5 rounded-2xl text-center">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Ukuran Berkas
              </span>
              <span className="text-base font-bold text-amber-400 font-mono">
                {selectedDetail.size_mb} MB
              </span>
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Engine Format
              </span>
              <span
                className={`text-base font-bold font-mono ${
                  selectedDetail.format === 'ONNX' ? 'text-purple-400' : 'text-blue-400'
                }`}
              >
                {selectedDetail.format}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Total Label
              </span>
              <span className="text-base font-bold text-emerald-400 font-mono">
                {selectedDetail.komponen_count || componentsWithValidation.length}
              </span>
            </div>
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
                Update Terakhir
              </span>
              <span className="text-xs font-mono font-semibold text-slate-200 block truncate">
                {selectedDetail.last_modified}
              </span>
            </div>
          </div>

          {/* Filter Tabs */}
          <div>
            <div className="flex items-center justify-between pb-2">
              <h4 className="font-bold text-white text-sm">
                Daftar Label & Sisi Inspeksi ({filteredComponents.length})
              </h4>
            </div>

            <div className="flex flex-wrap gap-2 pb-3">
              <button
                onClick={() => setDetailFilter('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                  detailFilter === 'all'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                    : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                }`}
              >
                Semua ({componentsWithValidation.length})
              </button>
              <button
                onClick={() => setDetailFilter('front')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                  detailFilter === 'front'
                    ? 'bg-sky-500/30 text-sky-200 border-sky-400 shadow-md'
                    : 'bg-sky-500/10 text-sky-300 border-sky-500/20 hover:bg-sky-500/20'
                }`}
              >
                Front F ({frontCount})
              </button>
              <button
                onClick={() => setDetailFilter('rear')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                  detailFilter === 'rear'
                    ? 'bg-amber-500/30 text-amber-200 border-amber-400 shadow-md'
                    : 'bg-amber-500/10 text-amber-300 border-amber-500/20 hover:bg-amber-500/20'
                }`}
              >
                Rear R ({rearCount})
              </button>
              {defectCount > 0 && (
                <button
                  onClick={() => setDetailFilter('defect')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                    detailFilter === 'defect'
                      ? 'bg-rose-500/30 text-rose-200 border-rose-400 shadow-md'
                      : 'bg-rose-500/10 text-rose-300 border-rose-500/20 hover:bg-rose-500/20'
                  }`}
                >
                  Defect / NG ({defectCount})
                </button>
              )}
              {nonStandardCount > 0 && (
                <button
                  onClick={() => setDetailFilter('warning')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                    detailFilter === 'warning'
                      ? 'bg-rose-500/30 text-rose-200 border-rose-400 shadow-md'
                      : 'bg-rose-500/10 text-rose-300 border-rose-500/20 hover:bg-rose-500/20'
                  }`}
                >
                  ⚠️ Non-Standar ({nonStandardCount})
                </button>
              )}
            </div>

            {/* Components List */}
            <div className="max-h-72 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
              {filteredComponents.length > 0 ? (
                filteredComponents.map((c, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl text-slate-300 hover:bg-white/10 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-xs font-mono font-bold uppercase shadow-sm border ${c.validation.color}`}
                      >
                        {c.validation.side}
                      </span>
                      <div>
                        <span className="font-semibold text-white text-base font-mono block">
                          {c.nama_komponen}
                        </span>
                        <span className="text-[11px] text-slate-400 block font-sans">
                          {c.validation.isDefect
                            ? 'Trigger Reject Cacat (Auto NG)'
                            : 'Komponen Normal Wajib (OK)'}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-300 block font-semibold font-mono">
                        Min Conf: {((c.min_confidence || 0.75) * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-slate-500 italic text-sm bg-black/20 rounded-xl border border-white/5">
                  Tidak ada label yang cocok dengan filter kategori ini.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-2 flex justify-between items-center border-t border-white/10">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>Standarisasi Prefix: F- (Front) • R- (Rear)</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onDownload(selectedDetail.part_no)}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-lg shadow-purple-600/30 flex items-center gap-2 cursor-pointer transition-all"
            >
              <Download className="w-4 h-4" />
              Download Berkas
            </button>
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl cursor-pointer transition-all"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
