import React, { useState, useEffect } from 'react';
import { Calendar, Search, Filter, RotateCcw, Download, Activity, CheckCircle, AlertOctagon, ChevronLeft, ChevronRight, Info, User, Image as ImageIcon } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import StatCard from '../components/StatCard';

export default function History({ operatorOnly = false, operatorName = '' }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [filterType, setFilterType] = useState('daily'); // 'daily' or 'monthly'
  const [dateFilter, setDateFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [partFilter, setPartFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [opFilter, setOpFilter] = useState(operatorOnly ? operatorName : '');

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Detail Modal state
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const params = {};
      if (filterType === 'daily' && dateFilter) params.date_filter = dateFilter;
      if (filterType === 'monthly' && monthFilter) params.month_filter = monthFilter;
      if (partFilter) params.part_filter = partFilter;
      if (statusFilter && statusFilter !== 'ALL') params.status_filter = statusFilter;
      
      const effectiveOp = operatorOnly ? operatorName : opFilter;
      if (effectiveOp && effectiveOp.trim()) params.operator_filter = effectiveOp.trim();

      const res = await api.get('/api/admin/inspection-logs', { params });
      setLogs(res.data || []);
      if (!isSilent) setCurrentPage(1);
    } catch (err) {
      console.error('Failed to fetch inspection logs', err);
      if (!isSilent) toast.error('Gagal memuat log inspeksi');
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(false);
    const interval = setInterval(() => {
      fetchLogs(true);
    }, 2500);
    return () => clearInterval(interval);
  }, [filterType, dateFilter, monthFilter, statusFilter, opFilter, operatorOnly, operatorName]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs();
  };

  const handleResetFilters = () => {
    setFilterType('daily');
    setDateFilter('');
    setMonthFilter('');
    setPartFilter('');
    setStatusFilter('ALL');
    if (!operatorOnly) setOpFilter('');
  };

  // Export to CSV
  const handleExportCSV = () => {
    if (logs.length === 0) return toast.error('Tidak ada data untuk diexport!');

    const headers = ["ID Log", "Waktu", "ID Transaksi", "Part Number", "Nama Part", "Lot No", "Unique No", "Target Qty", "Actual Qty", "Status Deteksi", "Metode", "Confidence Score", "Operator"];
    const rows = logs.map(l => [
      l.id,
      l.created_at ? new Date(l.created_at).toLocaleString() : '-',
      `"${l.id_trans || '-'}"`,
      `"${l.part_no || '-'}"`,
      `"${l.part_name || '-'}"`,
      `"${l.lot_no || '-'}"`,
      `"${l.unique_no || '-'}"`,
      l.target_qty ?? '-',
      l.qty_actual ?? '-',
      l.detection_status || 'OK',
      l.method === 'MANUAL' ? 'Manual Visual' : 'AI Auto',
      l.confidence_score !== undefined ? `${(l.confidence_score * 100).toFixed(0)}%` : '100%',
      `"${l.operator_name || '-'}"`
    ]);

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const dateSuffix = filterType === 'monthly' ? (monthFilter || 'Bulan_Ini') : (dateFilter || 'Hari_Ini');
    const filename = `Inspection_History_${operatorOnly ? operatorName + '_' : ''}${dateSuffix}_${new Date().toISOString().slice(0, 10)}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success(`Berhasil mengunduh ${logs.length} data ke ${filename}`);
  };

  // Summary Metrics
  const totalCount = logs.length;
  const okCount = logs.filter(l => (l.detection_status || 'OK').toUpperCase() === 'OK').length;
  const ngCount = logs.filter(l => (l.detection_status || '').toUpperCase() === 'NG').length;

  // Pagination Logic
  const totalPages = Math.ceil(logs.length / itemsPerPage) || 1;
  const startIdx = (currentPage - 1) * itemsPerPage;
  const currentLogs = logs.slice(startIdx, startIdx + itemsPerPage);

  const rawRole = (localStorage.getItem('user_role') || 'pengawas').toLowerCase();
  const isAdminOrPengawas = rawRole === 'admin' || rawRole === 'pengawas';

  const headers = ["# ID", "Waktu", "ID Trans", "Part No", "Target", "Aktual", "Status Deteksi", "Metode", "Confidence", "Operator", "Aksi"];

  return (
    <div className="space-y-6">
      <PageHeader
        title={operatorOnly ? "Riwayat Kerja" : "History"}
        highlightTitle={operatorOnly ? `Operator (${operatorName || 'Saya'})` : "Inspeksi"}
        subtitle={operatorOnly ? `Menampilkan catatan data hasil inspeksi kamera milik ${operatorName || 'Anda'}` : "Riwayat hasil deteksi inspeksi kamera produksi seluruh station"}
        actionButton={
          isAdminOrPengawas ? (
            <button
              onClick={handleExportCSV}
              disabled={logs.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Export CSV / Excel
            </button>
          ) : null
        }
      />

      {/* Summary Stat Cards with Quick Filter Click */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard 
          title="Total Inspeksi" 
          value={totalCount} 
          icon={Activity} 
          color="blue" 
          onClick={() => setStatusFilter('ALL')} 
        />
        <StatCard 
          title="Komponen OK" 
          value={okCount} 
          icon={CheckCircle} 
          color="green" 
          onClick={() => setStatusFilter('OK')} 
        />
        <StatCard 
          title="Komponen Cacat (NG)" 
          value={ngCount} 
          icon={AlertOctagon} 
          color="rose" 
          onClick={() => setStatusFilter('NG')} 
        />
      </div>

      {/* Filter Controls Card */}
      <div className="glass-card p-6 rounded-3xl border border-white/10 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold text-white">Filter Log Data</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { setFilterType('daily'); setMonthFilter(''); }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                filterType === 'daily'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-black/20 text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              Harian
            </button>
            <button
              type="button"
              onClick={() => { setFilterType('monthly'); setDateFilter(''); }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                filterType === 'monthly'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-black/20 text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              Bulanan
            </button>
          </div>
        </div>

        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filterType === 'daily' ? (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Tanggal</label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Bulan & Tahun</label>
              <input
                type="month"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Cari Part Number</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Contoh: 74231..."
                value={partFilter}
                onChange={(e) => setPartFilter(e.target.value)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl pl-9 pr-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {!operatorOnly && (
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Operator</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filter nama operator..."
                  value={opFilter}
                  onChange={(e) => setOpFilter(e.target.value)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl pl-9 pr-3.5 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Status Deteksi</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-900 border border-white/10 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
            >
              <option value="ALL">Semua Status</option>
              <option value="OK">OK Saja</option>
              <option value="NG">NG Saja</option>
            </select>
          </div>

          <div className={`flex items-end gap-2 ${operatorOnly ? '' : 'sm:col-span-2 lg:col-span-1'}`}>
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
            >
              <Search className="w-3.5 h-3.5" />
              Terapkan
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-white/10 transition-all cursor-pointer"
              title="Reset Filter"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>

      {/* Main DataTable */}
      <DataTable
        headers={headers}
        loading={loading}
        emptyMessage="Tidak ada data riwayat inspeksi ditemukan"
      >
        {currentLogs.map((log) => (
          <tr key={log.id} className="hover:bg-white/[0.02] transition-colors border-b border-white/5">
            <td className="p-4 text-xs font-mono text-slate-400">#{log.id}</td>
            <td className="p-4 text-xs text-slate-300 font-sans">
              {log.created_at ? new Date(log.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : '-'}
            </td>
            <td className="p-4 text-xs font-mono text-slate-400 max-w-[100px] truncate" title={log.id_trans}>
              {log.id_trans || '-'}
            </td>
            <td className="p-4">
              <span className="font-semibold text-white text-xs block">{log.part_no || '-'}</span>
              <span className="text-[11px] text-slate-400 block truncate max-w-[130px]">{log.part_name || '-'}</span>
            </td>
            <td className="p-4 text-xs font-semibold text-slate-300">{log.target_qty ?? '-'}</td>
            <td className="p-4 text-xs font-semibold text-slate-300">{log.qty_actual ?? '-'}</td>
            <td className="p-4">
              <StatusBadge status={log.detection_status || 'OK'} />
            </td>
            <td className="p-4">
              {log.method === 'MANUAL' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                  Manual
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  AI YOLO
                </span>
              )}
            </td>
            <td className="p-4 text-xs font-mono text-slate-300">
              {log.confidence_score !== undefined ? `${(log.confidence_score * 100).toFixed(0)}%` : '100%'}
            </td>
            <td className="p-4 text-xs text-sky-300 font-medium">{log.operator_name || '-'}</td>
            <td className="p-4 text-center">
              <button
                type="button"
                onClick={() => setSelectedLog(log)}
                className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-400/10 rounded-lg transition-all cursor-pointer"
                title="Lihat Detail Transaksi & Foto"
              >
                <Info className="w-4 h-4" />
              </button>
            </td>
          </tr>
        ))}
      </DataTable>

      {/* Pagination Controls */}
      {logs.length > itemsPerPage && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-slate-400">
            Menampilkan {startIdx + 1} - {Math.min(startIdx + itemsPerPage, logs.length)} dari {logs.length} data
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-xl bg-slate-800 border border-white/10 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 text-xs font-semibold text-white">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl bg-slate-800 border border-white/10 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal Dialog */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-2xl bg-slate-900 border border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-white">
                  Detail <span className="text-blue-400">Log Inspeksi</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">ID Log: #{selectedLog.id} | Operator: {selectedLog.operator_name || '-'}</p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-white text-xl font-bold p-1 cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Foto NG Bukti Snapshot jika ada */}
            {selectedLog.image_path && (
              <div className="rounded-2xl border-2 border-rose-500/50 overflow-hidden bg-black flex flex-col items-center">
                <div className="w-full bg-rose-950/80 px-4 py-1.5 flex items-center gap-2 text-rose-300 font-bold text-xs border-b border-rose-500/30">
                  <ImageIcon className="w-4 h-4" />
                  <span>Foto Bukti Cacat (NG Record)</span>
                </div>
                <img
                  src={selectedLog.image_path}
                  alt="Foto Cacat NG"
                  className="w-full max-h-64 object-contain"
                />
              </div>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-black/30 p-4 rounded-2xl border border-white/5 space-y-1">
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Part Number</span>
                <span className="text-lg font-semibold text-white">{selectedLog.part_no || selectedLog.p_no || '-'}</span>
              </div>

              <div className="bg-black/30 p-4 rounded-2xl border border-white/5 space-y-1">
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Nama Part / Komponen</span>
                <span className="text-lg font-semibold text-white truncate block">{selectedLog.part_name || '-'}</span>
              </div>

              <div className="bg-black/30 p-4 rounded-2xl border border-white/5 space-y-1">
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Nomor LOT (Lot No)</span>
                <span className="text-lg font-mono font-semibold text-white">{selectedLog.lot_no || '-'}</span>
              </div>

              <div className="bg-black/30 p-4 rounded-2xl border border-white/5 space-y-1">
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Nomor Unik (Unique No)</span>
                <span className="text-lg font-mono font-semibold text-white">{selectedLog.unique_no || '-'}</span>
              </div>

              <div className="bg-black/30 p-4 rounded-2xl border border-white/5 space-y-1">
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Target Qty / Selesai</span>
                <span className="text-lg font-semibold text-slate-200">{selectedLog.target_qty ?? '-'} / {selectedLog.qty_actual ?? '-'}</span>
              </div>

              <div className="bg-black/30 p-4 rounded-2xl border border-white/5 space-y-1">
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Status Deteksi</span>
                <div className="pt-1">
                  <StatusBadge status={selectedLog.detection_status || 'OK'} />
                </div>
              </div>

              <div className="bg-black/30 p-4 rounded-2xl border border-white/5 space-y-1">
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Confidence Score</span>
                <span className="text-lg font-mono font-semibold text-emerald-400">
                  {selectedLog.confidence_score !== undefined ? `${(selectedLog.confidence_score * 100).toFixed(0)}%` : '100%'}
                </span>
              </div>

              <div className="bg-black/30 p-4 rounded-2xl border border-white/5 space-y-1">
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Metode & Operator</span>
                <div className="pt-1 flex items-center justify-between">
                  <span className="text-sm font-bold text-white">{selectedLog.operator_name || '-'}</span>
                  <span className="text-xs text-slate-400">({selectedLog.method === 'MANUAL' ? 'Manual' : 'AI YOLO'})</span>
                </div>
              </div>

              <div className="bg-black/30 p-4 rounded-2xl border border-white/5 space-y-1 md:col-span-2">
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Waktu Inspeksi</span>
                <span className="text-sm font-medium text-slate-200">
                  {selectedLog.created_at ? new Date(selectedLog.created_at).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'medium' }) : '-'}
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-8 py-3 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
              >
                Tutup Informasi
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
