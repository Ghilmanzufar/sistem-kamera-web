import React, { useState, useEffect } from 'react';
import { Plus, BookOpen } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';
import PageHeader from '../components/PageHeader';
import ConfirmModal from '../components/ConfirmModal';
import ModelGuideBanner from '../components/models/ModelGuideBanner';
import ModelGuideModal from '../components/models/ModelGuideModal';
import ModelDetailModal from '../components/models/ModelDetailModal';
import ModelUploadModal from '../components/models/ModelUploadModal';
import ModelTable from '../components/models/ModelTable';

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
      const isExisting = models.some((m) => m.part_no.toLowerCase() === partNo.trim().toLowerCase());
      if (isExisting) {
        setShowOverwriteModal(true);
        return;
      }
    }

    executeUpload();
  };

  const handleOpenDetail = async (part_no) => {
    try {
      const res = await api.get(`/api/admin/models/${encodeURIComponent(part_no)}/detail`);
      setSelectedDetail(res.data);
    } catch (err) {
      toast.error('Gagal memuat detail model');
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
              className="flex items-center gap-2 px-3.5 py-2.5 bg-white/5 hover:bg-white/10 text-sky-300 font-semibold text-sm rounded-xl border border-sky-500/30 hover:border-sky-400/50 shadow-sm transition-all cursor-pointer"
              title="Buka Panduan Standarisasi Labeling"
            >
              <BookOpen className="w-4 h-4 text-sky-400" />
              Panduan Standar Label
            </button>
            <button
              onClick={openUploadModal}
              className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Upload Model Baru
            </button>
          </div>
        }
      />

      {/* Standarisasi Labeling Banner */}
      <ModelGuideBanner
        showGuideBanner={showGuideBanner}
        onToggleBanner={() => setShowGuideBanner(!showGuideBanner)}
        onOpenGuideModal={() => setShowGuideModal(true)}
      />

      {/* Models Table */}
      <ModelTable
        models={models}
        loading={loading}
        convertingPartNo={convertingPartNo}
        onConvertOnnx={handleConvertOnnx}
        onOpenDetail={handleOpenDetail}
        onOpenEdit={openEditModal}
        onDelete={(partNo) => setDeletePartNo(partNo)}
      />

      {/* Detail Model Labels Modal */}
      <ModelDetailModal
        selectedDetail={selectedDetail}
        onClose={() => setSelectedDetail(null)}
        onDownload={handleDownloadModel}
      />

      {/* Upload/Edit Modal */}
      <ModelUploadModal
        isOpen={showModal}
        editingPartNo={editingPartNo}
        partNo={partNo}
        setPartNo={setPartNo}
        previewLoading={previewLoading}
        labelPreview={labelPreview}
        submitting={submitting}
        onFileChange={handleFileChange}
        onSubmit={handleSubmit}
        onClose={() => setShowModal(false)}
      />

      {/* Complete Labeling Standardization Guide Modal */}
      <ModelGuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
      />

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
