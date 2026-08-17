import React, { useState, useEffect } from 'react';
import { 
  Upload, Edit2, Trash2, Plus, FileCode, CheckCircle, Eye, Download, 
  Info, Zap, RefreshCw, BookOpen, AlertTriangle, Check, X, ShieldAlert, ChevronDown, ChevronUp, Tag
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import ConfirmModal from '../components/ConfirmModal';

export default function Models() {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showGuideModal, setShowGuideModal] = useState(false);
  const [showGuideBanner, setShowGuideBanner] = useState(true);
  const [editingPartNo, setEditingPartNo] = useState(null);

  // Form State
  const [partNo, setPartNo] = useState('');
  const [file, setFile] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [labelPreview, setLabelPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [convertingPartNo, setConvertingPartNo] = useState(null);

  // Detail Modal State
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Confirm Delete & Overwrite Modal States
  const [deletePartNo, setDeletePartNo] = useState(null);
  const [showOverwriteModal, setShowOverwriteModal] = useState(false);

  const fetchModels = async () => {
    try {
      const res = await api.get('/api/admin/models');
      setModels(res.data || []);
    } catch (err) {
      toast.error('Gagal mengambil daftar model');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const openUploadModal = () => {
    setEditingPartNo(null);
    setPartNo('');
    setFile(null);
    setLabelPreview(null);
    setShowModal(true);
  };

  const openEditModal = (model) => {
    setEditingPartNo(model.part_no);
    setPartNo(model.part_no);
    setFile(null);
    setLabelPreview(null);
    setShowModal(true);
  };

  const handleConvertOnnx = async (part_no) => {
    setConvertingPartNo(part_no);
    try {
      const res = await api.post(`/api/admin/models/${encodeURIComponent(part_no)}/convert-onnx`);
      toast.success(res.data?.message || `Berhasil export ${part_no} ke format ONNX!`);
      fetchModels();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gagal mengonversi model ke ONNX');
    } finally {
      setConvertingPartNo(null);
    }
  };

  const handleFileChange = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setPreviewLoading(true);
    setLabelPreview(null);

    const formData = new FormData();
    formData.append('file', selectedFile);

    try {
      const res = await api.post('/api/admin/models/preview-labels', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setLabelPreview(res.data);
      if (res.data && res.data.labels) {
        const sorted = Object.entries(res.data.labels).sort((a, b) => parseInt(a[0]) - parseInt(b[0]));
        if (sorted.length > 0 && !editingPartNo) {
          const autoPno = String(sorted[0][1]).replace(/^[fr]-?/i, '');
          setPartNo(autoPno);
        }
      }
    } catch (err) {
      toast.error('Gagal membaca label dari file .pt');
    } finally {
      setPreviewLoading(false);
    }
  };

  const executeUpload = async () => {
    setShowOverwriteModal(false);
    setSubmitting(true);

    try {
      if (editingPartNo) {
        // Rename
        await api.put(`/api/admin/models/${editingPartNo}`, { new_part_no: partNo });
        toast.success(`Model berhasil diubah nama menjadi ${partNo}`);
      } else {
        // Upload
        const formData = new FormData();
        formData.append('part_no', partNo);
        formData.append('file', file);

        await api.post('/api/admin/models', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        toast.success(`Model ${partNo} berhasil diunggah & diperbarui!`);
      }
      setShowModal(false);
      fetchModels();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gagal menyimpan model');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!partNo) return toast.error('Masukkan Part Number!');
    if (!editingPartNo && !file) return toast.error('Pilih file .pt atau .onnx untuk diunggah!');

    if (!editingPartNo) {
      const isExisting = models.some(m => m.part_no.toLowerCase() === partNo.trim().toLowerCase());
      if (isExisting) {
        setShowOverwriteModal(true);
        return;
      }
    }

    executeUpload();
  };

  const handleOpenDetail = async (part_no) => {
    setDetailLoading(true);
    try {
      const res = await api.get(`/api/admin/models/${encodeURIComponent(part_no)}/detail`);
      setSelectedDetail(res.data);
    } catch (err) {
      toast.error('Gagal memuat detail model');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleDownloadModel = (part_no) => {
    const downloadUrl = `/api/admin/models/${encodeURIComponent(part_no)}/download`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.setAttribute('download', `${part_no}`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Mengunduh berkas model ${part_no}...`);
  };

  const handleDeleteModel = async () => {
    if (!deletePartNo) return;
    try {
      await api.delete(`/api/admin/models/${deletePartNo}`);
      toast.success(`Model ${deletePartNo} telah dihapus`);
      fetchModels();
    } catch (err) {
      toast.error('Gagal menghapus model');
    } finally {
      setDeletePartNo(null);
    }
  };

  const DEFECT_KEYWORDS = ["ng", "defect", "cacat", "reject", "broken", "patah", "scratch", "dent", "missing", "crack"];

  const getLabelValidation = (labelName) => {
    if (!labelName) return { status: 'invalid', message: 'Kosong', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
    const raw = String(labelName).trim().toLowerCase();
    const tokens = raw.split(/[-_\s]+/);
    const isDefect = tokens.some(t => DEFECT_KEYWORDS.includes(t));

    const isFront = raw.startsWith('f-') || raw.startsWith('f_') || raw.startsWith('front-') || raw.startsWith('front_');
    const isRear = raw.startsWith('r-') || raw.startsWith('r_') || raw.startsWith('rear-') || raw.startsWith('rear_');

    if (isFront) {
      if (isDefect) {
        return { status: 'front_defect', isDefect: true, side: 'FRONT (F) • DEFECT / NG', color: 'text-rose-300 bg-rose-500/20 border-rose-400/40', icon: '⚠️' };
      }
      return { status: 'front', isDefect: false, side: 'FRONT (F)', color: 'text-sky-300 bg-sky-500/20 border-sky-400/30', icon: 'F' };
    }
    if (isRear) {
      if (isDefect) {
        return { status: 'rear_defect', isDefect: true, side: 'REAR (R) • DEFECT / NG', color: 'text-rose-300 bg-rose-500/20 border-rose-400/40', icon: '⚠️' };
      }
      return { status: 'rear', isDefect: false, side: 'REAR (R)', color: 'text-amber-300 bg-amber-500/20 border-amber-400/30', icon: 'R' };
    }
    return { status: 'warning', isDefect: isDefect, side: isDefect ? '⚠️ Non-Standar (Defect NG)' : '⚠️ Non-Standar', color: 'text-rose-300 bg-rose-500/20 border-rose-400/40', icon: '!' };
  };

  const headers = ["Part Number", "Format & Engine", "Waktu Update", "Status", "Aksi"];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Masterdata"
        highlightTitle="Model"
        subtitle="Manajemen berkas bobot model deteksi YOLOv8 (.pt & .onnx) dan standarisasi label"
        actionButton={
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setShowGuideModal(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-white/5 hover:bg-white/10 text-sky-300 font-semibold text-sm rounded-xl border border-sky-500/30 hover:border-sky-400/50 shadow-sm transition-all"
              title="Buka Panduan Standarisasi Labeling"
            >
              <BookOpen className="w-4 h-4 text-sky-400" />
              Panduan Standar Label
            </button>
            <button
              onClick={openUploadModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all"
            >
              <Plus className="w-4 h-4" />
              Upload Model Baru
            </button>
          </div>
        }
      />

      {/* Standarisasi Labeling Banner */}
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
              onClick={() => setShowGuideModal(true)}
              className="text-xs font-semibold text-sky-400 hover:text-sky-300 underline underline-offset-4 mr-2"
            >
              Lihat Detail Lengkap →
            </button>
            <button
              onClick={() => setShowGuideBanner(!showGuideBanner)}
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
                  Prefix: f-
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11.5px]">
                Semua komponen tampak depan <strong>WAJIB</strong> diawali prefix <code className="text-sky-300 font-mono font-bold">f-</code>.
              </p>
              <div className="bg-black/40 p-2 rounded-lg font-mono text-[11px] text-slate-200 space-y-1 border border-white/5">
                <div className="text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" /> f-label</div>
                <div className="text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" /> f-screw_1</div>
                <div className="text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" /> f-connector</div>
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
                  Prefix: r-
                </span>
              </div>
              <p className="text-slate-300 leading-relaxed text-[11.5px]">
                Semua komponen tampak belakang <strong>WAJIB</strong> diawali prefix <code className="text-amber-300 font-mono font-bold">r-</code>.
              </p>
              <div className="bg-black/40 p-2 rounded-lg font-mono text-[11px] text-slate-200 space-y-1 border border-white/5">
                <div className="text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" /> r-barcode</div>
                <div className="text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" /> r-pad_foam</div>
                <div className="text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" /> r-seal</div>
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
                Jangan gunakan spasi, huruf kapital acak, atau nama tanpa prefix sisi.
              </p>
              <div className="bg-black/40 p-2 rounded-lg font-mono text-[11px] text-slate-200 space-y-1 border border-white/5">
                <div className="text-rose-400 flex items-center gap-1"><X className="w-3 h-3" /> label_depan (Tanpa f-)</div>
                <div className="text-rose-400 flex items-center gap-1"><X className="w-3 h-3" /> Baut Belakang (Ada spasi)</div>
                <div className="text-rose-400 flex items-center gap-1"><X className="w-3 h-3" /> f-label#1 (Simbol aneh)</div>
              </div>
            </div>
          </div>
        )}
      </div>

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
                      onClick={() => handleConvertOnnx(m.part_no)}
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
                    onClick={() => handleOpenDetail(m.part_no)}
                    className="p-2 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl hover:bg-emerald-500 hover:text-white transition-all cursor-pointer"
                    title="Lihat Detail Label & Rule"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>

                  {/* Edit Name Button */}
                  <button
                    onClick={() => openEditModal(m)}
                    className="p-2 text-xs font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-xl hover:bg-blue-500 hover:text-white transition-all cursor-pointer"
                    title="Edit Nama Part"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => setDeletePartNo(m.part_no)}
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

      {/* Detail Model Labels Modal */}
      {selectedDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn" onClick={() => setSelectedDetail(null)}>
          <div className="w-full max-w-2xl p-8 glass-card border border-white/15 rounded-3xl shadow-2xl space-y-6" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-4 border-b border-white/10">
              <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                <Info className="w-7 h-7 text-blue-400" />
                Detail Label Model <span className="text-blue-400">{selectedDetail.part_no}.pt</span>
              </h3>
              <button onClick={() => setSelectedDetail(null)} className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4 p-4 bg-black/30 border border-white/5 rounded-2xl">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">Ukuran File</span>
                  <span className="text-lg font-bold text-amber-400">{selectedDetail.size_mb} MB</span>
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-1">Terakhir Di-update</span>
                  <span className="text-base font-mono font-semibold text-slate-200">{selectedDetail.last_modified}</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-white mb-3 text-base flex justify-between items-center">
                  <span>Daftar Labelname Wajib ({selectedDetail.komponen_count} label)</span>
                </h4>

                <div className="max-h-64 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                  {selectedDetail.komponen.length > 0 ? (
                    selectedDetail.komponen.map((c, i) => {
                      let rawSisi = c.sisi && c.sisi !== '-' ? c.sisi : '';
                      if (!rawSisi && c.nama_komponen) {
                        const parts = c.nama_komponen.split(/[-_\s]/);
                        rawSisi = parts[0] || '-';
                      }
                      rawSisi = String(rawSisi || '-').toUpperCase();
                      const displaySisi = rawSisi === 'F' ? 'FRONT (F)' : rawSisi === 'R' ? 'REAR (R)' : rawSisi;
                      const isFront = rawSisi === 'F' || rawSisi.startsWith('FRONT');
                      const isRear = rawSisi === 'R' || rawSisi.startsWith('REAR');

                      return (
                        <div key={i} className="flex justify-between items-center p-3 bg-white/5 border border-white/5 rounded-xl text-slate-300">
                          <div className="flex items-center gap-3">
                            <span className={`px-2.5 py-0.5 rounded-md text-xs font-mono font-bold uppercase shadow-sm border ${
                              isFront
                                ? 'bg-sky-500/20 text-sky-300 border-sky-400/30'
                                : isRear
                                ? 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                                : 'bg-slate-800 text-slate-300 border-white/10'
                            }`}>
                              Sisi: {displaySisi}
                            </span>
                            <span className="font-semibold text-white text-base">{c.nama_komponen}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-xs text-slate-400 block font-semibold">Min Conf: {(c.min_confidence * 100).toFixed(0)}%</span>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-4 text-center text-slate-500 italic text-sm">Belum ada rule khusus terdaftar di DB untuk part ini.</div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-3">
              <button
                onClick={() => handleDownloadModel(selectedDetail.part_no)}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-lg shadow-purple-600/30 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Download .pt
              </button>
              <button
                onClick={() => setSelectedDetail(null)}
                className="px-6 py-2.5 text-sm font-semibold text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl"
              >
                Tutup Informasi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-xl p-8 glass-card border border-white/15 rounded-3xl shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto scrollbar-thin">
            <div className="flex justify-between items-center pb-2 border-b border-white/10">
              <h3 className="text-2xl font-bold text-white">
                {editingPartNo ? 'Rename Model Part' : 'Upload Model AI (.pt / .onnx)'}
              </h3>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            {/* Standar Label Reminder Box */}
            {!editingPartNo && (
              <div className="p-3.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-slate-300 space-y-1.5">
                <div className="flex items-center gap-2 font-bold text-sky-300">
                  <ShieldAlert className="w-4 h-4 text-sky-400" />
                  <span>Standar Labeling Wajib:</span>
                </div>
                <p className="text-[11.5px] leading-relaxed text-slate-300">
                  Nama label pada model harus memiliki prefix <span className="font-mono text-sky-300 font-bold bg-sky-500/20 px-1 py-0.5 rounded">f-</span> untuk Sisi Depan dan <span className="font-mono text-amber-300 font-bold bg-amber-500/20 px-1 py-0.5 rounded">r-</span> untuk Sisi Belakang.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              {!editingPartNo && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Berkas Model YOLO (.pt atau .onnx)
                  </label>
                  <input
                    type="file"
                    accept=".pt,.onnx"
                    required
                    onChange={handleFileChange}
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
                        <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-white/5 border border-white/5 text-xs">
                          <div className="flex items-center gap-2 font-mono">
                            <span className="text-slate-500 text-[11px]">#{idx}</span>
                            <span className="font-bold text-white">{name}</span>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[10.5px] font-mono font-bold border ${validation.color}`}>
                            {validation.side}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Warning if any non-standard label detected */}
                  {Object.values(labelPreview.labels || {}).some(lbl => getLabelValidation(lbl).status === 'warning') && (
                    <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                      <span>
                        Ditemukan label tanpa prefix <code>f-</code> atau <code>r-</code>. Label ini tidak akan terkelompok otomatis ke sisi Front/Rear.
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
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 text-base font-semibold text-slate-300 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 text-base font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-600/30 disabled:opacity-50"
                >
                  {submitting ? 'Memproses...' : (editingPartNo ? 'Simpan Nama' : 'Unggah & Buat Rule')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Complete Labeling Standardization Guide Modal */}
      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn" onClick={() => setShowGuideModal(false)}>
          <div className="w-full max-w-3xl p-8 glass-card border border-white/15 rounded-3xl shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto scrollbar-thin text-slate-300 text-sm" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
                  <BookOpen className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">
                    Standarisasi Labeling Model YOLO & Rule Inspeksi
                  </h3>
                  <p className="text-xs text-slate-400">
                    Panduan teknis pembuatan dataset dan penamaan label untuk sistem AI Quality Control
                  </p>
                </div>
              </div>
              <button onClick={() => setShowGuideModal(false)} className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            {/* Content Body */}
            <div className="space-y-6">
              {/* Section 1: Overview */}
              <div className="p-4 rounded-2xl bg-black/30 border border-white/5 space-y-2">
                <h4 className="font-bold text-white text-base flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400"></span>
                  Mengapa Standarisasi Label Wajib?
                </h4>
                <p className="text-xs leading-relaxed text-slate-300">
                  Sistem inspeksi kamera beroperasi dalam mode <strong>Dual-Side Inspection (Sisi Depan / Front dan Sisi Belakang / Rear)</strong>. 
                  Sistem otomatis memfilter aturan pengecekan komponen berdasarkan awalan (prefix) nama label di model YOLOv8 Anda. 
                  Jika label tidak mengikuti standar, sistem tidak dapat menentukan apakah komponen tersebut harus diperiksa di sisi Front atau Rear.
                </p>
              </div>

              {/* Section 2: Prefix Rules Table */}
              <div className="space-y-3">
                <h4 className="font-bold text-white text-base flex items-center gap-2">
                  <Tag className="w-4 h-4 text-emerald-400" />
                  1. Ketentuan Prefix Sisi (Side Prefix)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sky-300">Sisi Depan / Front</span>
                      <span className="px-2.5 py-0.5 rounded-lg bg-sky-500/20 text-sky-300 font-mono font-bold text-xs border border-sky-500/30">f-</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Gunakan prefix <code className="text-sky-300 font-bold font-mono">f-</code> untuk setiap komponen atau defect yang hanya terlihat dari arah depan benda.
                    </p>
                    <div className="space-y-1 font-mono text-xs text-slate-300 bg-black/40 p-2.5 rounded-xl border border-white/5">
                      <div className="text-emerald-400">✓ f-label</div>
                      <div className="text-emerald-400">✓ f-baut_kiri</div>
                      <div className="text-emerald-400">✓ f-konektor_usb</div>
                      <div className="text-emerald-400">✓ f-clip_pengunci</div>
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-300">Sisi Belakang / Rear</span>
                      <span className="px-2.5 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 font-mono font-bold text-xs border border-amber-500/30">r-</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Gunakan prefix <code className="text-amber-300 font-bold font-mono">r-</code> untuk setiap komponen atau defect yang hanya terlihat dari arah belakang benda.
                    </p>
                    <div className="space-y-1 font-mono text-xs text-slate-300 bg-black/40 p-2.5 rounded-xl border border-white/5">
                      <div className="text-emerald-400">✓ r-barcode</div>
                      <div className="text-emerald-400">✓ r-pad_foam</div>
                      <div className="text-emerald-400">✓ r-seal_karet</div>
                      <div className="text-emerald-400">✓ r-baut_chassis</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Defect & NG Label Rules */}
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-rose-300 text-base flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-rose-400" />
                    2. Standarisasi Label Kecacatan (Defect / NG)
                  </h4>
                  <span className="px-2.5 py-0.5 rounded-lg bg-rose-500/20 text-rose-300 font-mono font-bold text-xs border border-rose-500/30">
                    Auto NG Trigger
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Engine AI mengenali kecacatan menggunakan pencocokan kata kunci (<em>token exact-match</em>). 
                  Jika model Anda mendeteksi cacat fisik, gunakan salah satu kata kunci defect yang terdaftar: 
                  <span className="font-mono text-amber-300 font-semibold"> ng, defect, cacat, reject, broken, patah, scratch, dent, missing, crack</span>.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-1.5 font-mono">
                    <span className="text-sky-300 font-bold font-sans block">Defect Sisi Depan (Front):</span>
                    <div className="text-emerald-400">✓ f-ng</div>
                    <div className="text-emerald-400">✓ f-ng_scratch</div>
                    <div className="text-emerald-400">✓ f-defect_konektor</div>
                    <div className="text-emerald-400">✓ f-crack</div>
                  </div>
                  <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-1.5 font-mono">
                    <span className="text-amber-300 font-bold font-sans block">Defect Sisi Belakang (Rear):</span>
                    <div className="text-emerald-400">✓ r-ng</div>
                    <div className="text-emerald-400">✓ r-ng_seal_robek</div>
                    <div className="text-emerald-400">✓ r-defect_pad</div>
                    <div className="text-emerald-400">✓ r-scratch</div>
                  </div>
                </div>

                <div className="text-[11.5px] text-slate-300 bg-rose-950/30 p-2.5 rounded-xl border border-rose-500/20 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Catatan Logika:</strong> Begitu AI mendeteksi 1 saja bounding box label defect (NG), sistem <strong>langsung memutus timer OK</strong>, membunyikan alarm suara NG, dan mencatat event cacat ke database / offline buffer.
                  </span>
                </div>
              </div>

              {/* Section 4: Do's and Don'ts Table */}
              <div className="space-y-3">
                <h4 className="font-bold text-white text-base">3. Contoh Benar vs Contoh Salah</h4>
                <div className="overflow-x-auto rounded-2xl border border-white/10">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-white/5 text-slate-400 uppercase font-mono text-[11px] border-b border-white/10">
                      <tr>
                        <th className="p-3">Kategori</th>
                        <th className="p-3 text-emerald-400 font-bold">Format Benar (Sesuai Standar)</th>
                        <th className="p-3 text-rose-400 font-bold">Format Salah (Jangan Dipakai)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono text-slate-300">
                      <tr className="hover:bg-white/5">
                        <td className="p-3 font-sans font-semibold text-white">Komponen Normal (OK)</td>
                        <td className="p-3 text-emerald-400"><code>f-label</code>, <code>r-seal</code></td>
                        <td className="p-3 text-rose-400"><code>label</code>, <code>seal</code> (Tanpa prefix)</td>
                      </tr>
                      <tr className="hover:bg-white/5">
                        <td className="p-3 font-sans font-semibold text-white">Kecacatan / Defect (NG)</td>
                        <td className="p-3 text-emerald-400"><code>f-ng_scratch</code>, <code>r-defect_seal</code></td>
                        <td className="p-3 text-rose-400"><code>scratch</code>, <code>ng_baut</code> (Tanpa f-/r-)</td>
                      </tr>
                      <tr className="hover:bg-white/5">
                        <td className="p-3 font-sans font-semibold text-white">Pemisah Kata</td>
                        <td className="p-3 text-emerald-400"><code>f-baut_panjang</code> atau <code>f-baut-panjang</code></td>
                        <td className="p-3 text-rose-400"><code>f-baut panjang</code> (Mengandung spasi)</td>
                      </tr>
                      <tr className="hover:bg-white/5">
                        <td className="p-3 font-sans font-semibold text-white">Karakter Simbol</td>
                        <td className="p-3 text-emerald-400"><code>f-pin_1</code>, <code>r-cover_2</code></td>
                        <td className="p-3 text-rose-400"><code>f-pin#1</code>, <code>r-cover@2</code> (Simbol dilarang)</td>
                      </tr>
                      <tr className="hover:bg-white/5">
                        <td className="p-3 font-sans font-semibold text-white">Nama File Model</td>
                        <td className="p-3 text-emerald-400"><code>74231-0K550-00.pt</code></td>
                        <td className="p-3 text-rose-400"><code>model_final_v2.pt</code> (Tidak sesuai Part No)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Section 4: Auto-Generation Rule Workflow */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 to-slate-900/60 border border-blue-500/20 space-y-2">
                <h4 className="font-bold text-white text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-400" />
                  Alur Otomatisasi Saat Model Diupload
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Ketika Anda mengunggah file model <code className="text-white">.pt</code>, server akan langsung mengekstrak seluruh class name pada model tersebut. 
                  Sistem secara otomatis mendeteksi sisi Front/Rear dari prefix label dan menyimpannya ke tabel <strong>PartRule</strong> di database tanpa perlu input manual satu per satu.
                </p>
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                onClick={() => setShowGuideModal(false)}
                className="px-6 py-2.5 text-sm font-semibold text-slate-200 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl transition-all"
              >
                Saya Mengerti
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overwrite Confirmation Modal */}
      <ConfirmModal
        isOpen={showOverwriteModal}
        title="⚠️ Konfirmasi Menimpa Model AI"
        message={`Model AI untuk Part Number "${partNo}" sudah terdaftar di database. Apakah Anda yakin ingin MENIMPA berkas model lama dengan file baru ini?`}
        confirmText="Ya, Timpa Model"
        isDanger={true}
        onConfirm={executeUpload}
        onCancel={() => setShowOverwriteModal(false)}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deletePartNo)}
        title="Hapus Model AI"
        message={`Apakah Anda yakin ingin menghapus model ${deletePartNo}.pt? File akan dihapus permanen dari folder weights.`}
        confirmText="Hapus Permanen"
        isDanger={true}
        onConfirm={handleDeleteModel}
        onCancel={() => setDeletePartNo(null)}
      />
    </div>
  );
}
