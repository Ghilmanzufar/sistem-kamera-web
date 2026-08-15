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

  const headers = operatorOnly
    ? ["Waktu", "Part Name", "ID Trans", "Part No", "Target", "Aktual", "Status Deteksi", "Confidence", "Aksi"]
    : ["Waktu", "Part Name", "ID Trans", "Part No", "Target", "Aktual", "Status Deteksi", "Metode", "Confidence", "Operator", "Aksi"];

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title={operatorOnly ? "Riwayat Kerja" : "History"}
        highlightTitle={operatorOnly ? `Operator (${operatorName || 'Saya'})` : "Inspeksi"}
        subtitle={operatorOnly ? `Menampilkan catatan data hasil inspeksi kamera milik ${operatorName || 'Anda'}` : "Riwayat hasil deteksi inspeksi kamera produksi seluruh station"}
        actionButton={
          isAdminOrPengawas ? (
            <button
              onClick={handleExportCSV}
              disabled={logs.length === 0}
              className="flex items-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-xl shadow-emerald-600/30 transition-all disabled:opacity-50 cursor-pointer hover:scale-105 active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Export CSV / Excel</span>
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
      <div className="glass-card p-6 sm:p-7 rounded-3xl border-2 border-white/10 space-y-5 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <Filter className="w-5 h-5 text-blue-400" />
            <h3 className="font-extrabold text-white text-base sm:text-lg">Filter Log Data</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { setFilterType('daily'); setMonthFilter(''); }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                filterType === 'daily'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-black'
                  : 'bg-black/20 text-slate-400 hover:text-white border border-white/10'
              }`}
            >
              Harian
            </button>
            <button
              type="button"
              onClick={() => { setFilterType('monthly'); setDateFilter(''); }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                filterType === 'monthly'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-black'
                  : 'bg-black/20 text-slate-400 hover:text-white border border-white/10'
              }`}
            >
              Bulanan
            </button>
          </div>
        </div>

        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filterType === 'daily' ? (
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-300 mb-1.5">Tanggal</label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full bg-slate-900 border-2 border-white/10 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          ) : (
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-300 mb-1.5">Bulan & Tahun</label>
              <input
                type="month"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="w-full bg-slate-900 border-2 border-white/10 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-300 mb-1.5">Cari Part Number</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Contoh: 74231..."
                value={partFilter}
                onChange={(e) => setPartFilter(e.target.value)}
                className="w-full bg-slate-900 border-2 border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors font-mono"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>

          {!operatorOnly && (
            <div>
              <label className="block text-xs sm:text-sm font-bold text-slate-300 mb-1.5">Operator</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Filter nama operator..."
                  value={opFilter}
                  onChange={(e) => setOpFilter(e.target.value)}
                  className="w-full bg-slate-900 border-2 border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-300 mb-1.5">Status Deteksi</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-slate-900 border-2 border-white/10 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 transition-colors font-bold"
            >
              <option value="ALL">Semua Status</option>
              <option value="OK">OK Saja</option>
              <option value="NG">NG Saja</option>
            </select>
          </div>

          <div className="flex items-end gap-2">
            <button
              type="submit"
              className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              <span>Terapkan Filter</span>
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl border-2 border-white/10 transition-all cursor-pointer shadow-md"
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
          <tr key={log.id} className="hover:bg-white/[0.03] transition-colors border-b border-white/5">
            <td className="p-4 text-xs sm:text-sm text-slate-300 font-sans font-medium">
              {log.created_at ? new Date(log.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : '-'}
            </td>
            <td className="p-4 text-xs sm:text-sm font-extrabold text-white max-w-[180px] truncate" title={log.part_name || '-'}>
              {log.part_name || '-'}
            </td>
            <td className="p-4 text-xs sm:text-sm font-mono text-slate-400 max-w-[100px] truncate" title={log.id_trans}>
              {log.id_trans || '-'}
            </td>
            <td className="p-4 text-xs sm:text-sm font-mono font-bold text-slate-200 max-w-[120px] truncate" title={log.part_no || '-'}>
              {log.part_no || '-'}
            </td>
            <td className="p-4 text-xs sm:text-sm font-bold text-slate-200">{log.target_qty ?? '-'}</td>
            <td className="p-4 text-xs sm:text-sm font-bold text-slate-200">{log.qty_actual ?? '-'}</td>
            <td className="p-4">
              <StatusBadge status={log.detection_status || 'OK'} />
            </td>
            {!operatorOnly && (
              <td className="p-4">
                {log.method === 'MANUAL' ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-black bg-amber-500/15 text-amber-300 border border-amber-500/30">
                    Manual
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-xl text-xs font-black bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    AI YOLO
                  </span>
                )}
              </td>
            )}
            <td className="p-4 text-xs sm:text-sm font-mono font-bold text-slate-200">
              {log.confidence_score !== undefined ? `${(log.confidence_score * 100).toFixed(0)}%` : '100%'}
            </td>
            {!operatorOnly && (
              <td className="p-4 text-xs sm:text-sm text-sky-400 font-extrabold">{log.operator_name || '-'}</td>
            )}
            <td className="p-4 text-center">
              <button
                type="button"
                onClick={() => setSelectedLog(log)}
                className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-400/15 rounded-xl transition-all cursor-pointer"
                title="Lihat Detail Transaksi & Foto"
              >
                <Info className="w-5 h-5" />
              </button>
            </td>
          </tr>
        ))}
      </DataTable>

      {/* Pagination Controls Bar */}
      {logs.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-900/60 rounded-2xl border-2 border-white/10 shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-300">
            <span className="px-3 py-1 bg-blue-500/20 border border-blue-400/30 text-blue-300 rounded-xl font-extrabold">
              Max 15 Data / Halaman
            </span>
            <span className="text-slate-400">
              Menampilkan <strong>{startIdx + 1}</strong> - <strong>{Math.min(startIdx + itemsPerPage, logs.length)}</strong> dari <strong>{logs.length}</strong> riwayat
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border-2 border-white/15 text-white font-extrabold text-xs sm:text-sm disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-md flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Sebelumnya</span>
            </button>

            <div className="px-4 py-2 text-xs sm:text-sm font-black text-white bg-slate-950 border-2 border-blue-500/40 rounded-xl shadow-inner">
              <span className="text-blue-400">{currentPage}</span> / <span>{totalPages}</span>
            </div>

            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs sm:text-sm disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-md shadow-blue-600/30 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
            >
              <span>Selanjutnya</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal Dialog */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-2xl bg-slate-900 border-2 border-white/15 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  Detail <span className="text-blue-400">Log Inspeksi</span>
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 mt-1">ID Log: #{selectedLog.id} | Operator: <strong className="text-white">{selectedLog.operator_name || '-'}</strong></p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
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
                onClick={() => setSelectedLog(null)}
                className="px-8 py-3.5 text-sm font-extrabold text-white bg-blue-600 hover:bg-blue-500 rounded-2xl shadow-xl shadow-blue-600/30 transition-all cursor-pointer hover:scale-105"
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
