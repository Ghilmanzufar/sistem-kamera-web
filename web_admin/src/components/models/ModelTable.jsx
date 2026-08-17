import React from 'react';
import { FileCode, Zap, RefreshCw, Eye, Edit2, Trash2 } from 'lucide-react';
import DataTable from '../DataTable';

export default function ModelTable({
  models,
  loading,
  convertingPartNo,
  onConvertOnnx,
  onOpenDetail,
  onOpenEdit,
  onDelete
}) {
  const headers = ["Part Number", "Format & Engine", "Waktu Update", "Status", "Aksi"];

  return (
    <div className="glass-card p-6 border border-white/10 rounded-2xl">
      <DataTable headers={headers} isLoading={loading} center={true}>
        {models.map((m) => (
          <tr key={m.part_no} className="hover:bg-white/5 transition-colors">
            <td className="p-4 font-bold text-white text-center">
              <div className="flex items-center justify-center gap-2 font-mono text-sm">
                <FileCode className="w-4 h-4 text-blue-400 shrink-0" />
                <span>{m.part_no}</span>
              </div>
            </td>
            <td className="p-4 text-center">
              {m.has_onnx ? (
                <div className="flex flex-col items-center gap-1">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30 text-xs">
                    <Zap className="w-3.5 h-3.5 text-amber-400" />
                    ONNX Engine ({m.onnx_size_mb} MB)
                  </span>
                  {m.has_pt && (
                    <span className="text-[11px] text-slate-400 font-mono">
                      PT Backup: {m.pt_size_mb} MB
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30 text-xs">
                    PyTorch PT ({m.pt_size_mb} MB)
                  </span>
                </div>
              )}
            </td>
            <td className="p-4 text-xs text-slate-300 font-mono text-center">
              {m.last_modified || '-'}
            </td>
            <td className="p-4 text-center">
              {m.is_active ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  Aktif
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium bg-white/5 text-slate-400 border border-white/10">
                  Ready
                </span>
              )}
            </td>
            <td className="p-4 text-center">
              <div className="flex items-center justify-center gap-1.5">
                {/* Convert to ONNX Button (if has PT but no ONNX) */}
                {m.has_pt && !m.has_onnx && (
                  <button
                    onClick={() => onConvertOnnx(m.part_no)}
                    disabled={convertingPartNo === m.part_no}
                    className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-purple-300 bg-purple-500/20 border border-purple-500/40 rounded-xl hover:bg-purple-500 hover:text-white transition-all cursor-pointer disabled:opacity-50"
                    title="Convert Model .pt ke ONNX ultra-ringan"
                  >
                    {convertingPartNo === m.part_no ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Exporting...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span>⚡ Export ONNX</span>
                      </>
                    )}
                  </button>
                )}

                {/* Detail Label Button */}
                <button
                  onClick={() => onOpenDetail(m.part_no)}
                  className="p-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl hover:bg-emerald-500 hover:text-white transition-all cursor-pointer"
                  title="Lihat Detail Label & Rule"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>

                {/* Edit Name Button */}
                <button
                  onClick={() => onOpenEdit(m)}
                  className="p-2 text-xs font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-xl hover:bg-blue-500 hover:text-white transition-all cursor-pointer"
                  title="Edit Nama Part"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>

                {/* Delete Button */}
                <button
                  onClick={() => onDelete(m.part_no)}
                  className="p-2 text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                  title="Hapus Model"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
