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
  const [detailFilter, setDetailFilter] = useState('all');

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
      {selectedDetail && (() => {
        const componentsWithValidation = (selectedDetail.komponen || []).map(c => ({
          ...c,
          validation: getLabelValidation(c.nama_komponen)
        }));

        const frontCount = componentsWithValidation.filter(c => c.validation.status === 'front').length;
        const rearCount = componentsWithValidation.filter(c => c.validation.status === 'rear').length;
        const defectCount = componentsWithValidation.filter(c => c.validation.isDefect).length;
        const nonStandardCount = componentsWithValidation.filter(c => c.validation.status === 'warning' && !c.validation.isDefect).length;

        const filteredComponents = componentsWithValidation.filter(c => {
          if (detailFilter === 'front') return c.validation.status === 'front';
          if (detailFilter === 'rear') return c.validation.status === 'rear';
          if (detailFilter === 'defect') return c.validation.isDefect;
          if (detailFilter === 'warning') return c.validation.status === 'warning';
          return true;
        });

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn" onClick={() => setSelectedDetail(null)}>
            <div className="w-full max-w-2xl p-8 glass-card border border-white/15 rounded-3xl shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto scrollbar-thin" onClick={e => e.stopPropagation()}>
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
                <button onClick={() => setSelectedDetail(null)} className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white font-bold">✕</button>
              </div>

              <div className="space-y-5 text-sm">
                {/* Meta Info Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 bg-black/40 border border-white/5 rounded-2xl text-center">
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">Ukuran Berkas</span>
                    <span className="text-base font-bold text-amber-400 font-mono">{selectedDetail.size_mb} MB</span>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">Engine Format</span>
                    <span className={`text-base font-bold font-mono ${selectedDetail.format === 'ONNX' ? 'text-purple-400' : 'text-blue-400'}`}>
                      {selectedDetail.format}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">Total Label</span>
                    <span className="text-base font-bold text-emerald-400 font-mono">{selectedDetail.komponen_count || componentsWithValidation.length}</span>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">Update Terakhir</span>
                    <span className="text-xs font-mono font-semibold text-slate-200 block truncate">{selectedDetail.last_modified}</span>
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
                        <div key={i} className="flex items-center justify-between p-3 bg-white/5 border border-white/5 rounded-xl text-slate-300 hover:bg-white/10 transition-colors">
                          <div className="flex items-center gap-3">
                            <span className={`px-2.5 py-0.5 rounded-md text-xs font-mono font-bold uppercase shadow-sm border ${c.validation.color}`}>
                              {c.validation.side}
                            </span>
                            <div>
                              <span className="font-semibold text-white text-base font-mono block">{c.nama_komponen}</span>
                              <span className="text-[11px] text-slate-400 block font-sans">
                                {c.validation.isDefect ? 'Trigger Reject Cacat (Auto NG)' : 'Komponen Normal Wajib (OK)'}
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
                    onClick={() => handleDownloadModel(selectedDetail.part_no)}
                    className="px-5 py-2.5 text-sm font-semibold text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-lg shadow-purple-600/30 flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <Download className="w-4 h-4" />
                    Download Berkas
                  </button>
                  <button
                    onClick={() => setSelectedDetail(null)}
                    className="px-5 py-2.5 text-sm font-semibold text-slate-300 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl cursor-pointer transition-all"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

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

              {/* Section 2: Prefix Rules Table with Real Case Study */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-white text-base flex items-center gap-2">
                    <Tag className="w-4 h-4 text-emerald-400" />
                    1. Ketentuan Prefix Sisi (Studi Kasus Nyata: Part <span className="font-mono text-emerald-300">74231-0K550-00</span>)
                  </h4>
                  <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-mono font-bold text-xs border border-emerald-500/30">
                    Standar Produksi
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Front Card */}
                  <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20 space-y-3 font-mono text-xs">
                    <div className="flex items-center justify-between font-sans">
                      <span className="font-bold text-sky-300 text-sm">Sisi Depan / FRONT (F)</span>
                      <span className="px-2 py-0.5 rounded-lg bg-sky-500/20 text-sky-300 font-mono font-bold text-xs border border-sky-500/30">F-</span>
                    </div>
                    <p className="text-slate-300 font-sans text-xs leading-relaxed">
                      Komponen atau defect yang terlihat dari arah depan wajib diawali prefix <code className="text-sky-300 font-bold font-mono">F-</code>.
                    </p>
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/5">
                        <span className="text-emerald-400 font-bold">✓ F-74231-0K550-00</span>
                        <span className="text-[10px] text-sky-300 bg-sky-500/20 px-1.5 py-0.5 rounded font-sans">Label Part (OK)</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/5">
                        <span className="text-emerald-400 font-bold">✓ F-HOLE</span>
                        <span className="text-[10px] text-sky-300 bg-sky-500/20 px-1.5 py-0.5 rounded font-sans">Lubang Depan (OK)</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/5">
                        <span className="text-rose-400 font-bold">⚠️ F-NG_SCRATCH</span>
                        <span className="text-[10px] text-rose-300 bg-rose-500/20 px-1.5 py-0.5 rounded font-sans">Goresan Depan (NG)</span>
                      </div>
                    </div>
                  </div>

                  {/* Rear Card */}
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3 font-mono text-xs">
                    <div className="flex items-center justify-between font-sans">
                      <span className="font-bold text-amber-300 text-sm">Sisi Belakang / REAR (R)</span>
                      <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 font-mono font-bold text-xs border border-amber-500/30">R-</span>
                    </div>
                    <p className="text-slate-300 font-sans text-xs leading-relaxed">
                      Komponen atau defect yang terlihat dari arah belakang wajib diawali prefix <code className="text-amber-300 font-bold font-mono">R-</code>.
                    </p>
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/5">
                        <span className="text-emerald-400 font-bold">✓ R-74231-0K550-00</span>
                        <span className="text-[10px] text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded font-sans">Body Belakang (OK)</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/5">
                        <span className="text-emerald-400 font-bold">✓ R-HOLE</span>
                        <span className="text-[10px] text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded font-sans">Lubang Baut (OK)</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/5">
                        <span className="text-emerald-400 font-bold">✓ R-KLIP-KUNING-01</span>
                        <span className="text-[10px] text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded font-sans">Klip 1 (OK)</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/5">
                        <span className="text-emerald-400 font-bold">✓ R-KLIP-KUNING-02</span>
                        <span className="text-[10px] text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded font-sans">Klip 2 (OK)</span>
                      </div>
                      <div className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/5">
                        <span className="text-rose-400 font-bold">⚠️ R-NG_KLIP_PATAH</span>
                        <span className="text-[10px] text-rose-300 bg-rose-500/20 px-1.5 py-0.5 rounded font-sans">Klip Rusak (NG)</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Defect & NG Label Rules */}
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
                    <div className="text-emerald-400">✓ F-NG</div>
                    <div className="text-emerald-400">✓ F-NG_SCRATCH</div>
                    <div className="text-emerald-400">✓ F-DEFECT_KONEKTOR</div>
                    <div className="text-emerald-400">✓ F-CRACK</div>
                  </div>
                  <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-1.5 font-mono">
                    <span className="text-amber-300 font-bold font-sans block">Defect Sisi Belakang (Rear):</span>
                    <div className="text-emerald-400">✓ R-NG</div>
                    <div className="text-emerald-400">✓ R-NG_KLIP_PATAH</div>
                    <div className="text-emerald-400">✓ R-DEFECT_PAD</div>
                    <div className="text-emerald-400">✓ R-SCRATCH</div>
                  </div>
                </div>

                <div className="text-[11.5px] text-slate-300 bg-rose-950/30 p-2.5 rounded-xl border border-rose-500/20 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Catatan Logika:</strong> Begitu AI mendeteksi 1 saja bounding box label defect (NG), sistem <strong>langsung memutus timer OK</strong>, membunyikan alarm suara NG, dan mencatat event cacat ke database / offline buffer.
                  </span>
                </div>
              </div>

              {/* Section 3: Do's and Don'ts Table */}
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
                        <td className="p-3 text-emerald-400"><code>F-74231-0K550-00</code>, <code>R-HOLE</code></td>
                        <td className="p-3 text-rose-400"><code>74231-0K550-00</code>, <code>HOLE</code> (Tanpa prefix)</td>
                      </tr>
                      <tr className="hover:bg-white/5">
                        <td className="p-3 font-sans font-semibold text-white">Kecacatan / Defect (NG)</td>
                        <td className="p-3 text-emerald-400"><code>F-NG_SCRATCH</code>, <code>R-NG_KLIP_PATAH</code></td>
                        <td className="p-3 text-rose-400"><code>SCRATCH</code>, <code>NG_BAUT</code> (Tanpa F-/R-)</td>
                      </tr>
                      <tr className="hover:bg-white/5">
                        <td className="p-3 font-sans font-semibold text-white">Pemisah Kata</td>
                        <td className="p-3 text-emerald-400"><code>R-KLIP-KUNING-01</code> atau <code>R-KLIP_KUNING_01</code></td>
                        <td className="p-3 text-rose-400"><code>R-KLIP KUNING 01</code> (Mengandung spasi)</td>
                      </tr>
                      <tr className="hover:bg-white/5">
                        <td className="p-3 font-sans font-semibold text-white">Karakter Simbol</td>
                        <td className="p-3 text-emerald-400"><code>F-PIN_1</code>, <code>R-COVER_2</code></td>
                        <td className="p-3 text-rose-400"><code>F-PIN#1</code>, <code>R-COVER@2</code> (Simbol dilarang)</td>
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
                  4. Alur Otomatisasi Saat Model Diupload
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
