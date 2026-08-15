import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search, Filter, RotateCcw, Download, Activity, CheckCircle, AlertOctagon, ChevronLeft, ChevronRight, Info, User, Image as ImageIcon, X } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import StatCard from '../components/StatCard';

export default function History({ operatorOnly = false, operatorName = '' }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
  const modalCloseBtnRef = useRef(null);

  const fetchLogs = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    setError(null);
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
      const errMsg = err?.response?.data?.detail || err?.message || 'Gagal memuat log inspeksi';
      setError(errMsg);
      if (!isSilent) toast.error('Gagal memuat log inspeksi');
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [filterType, dateFilter, monthFilter, partFilter, statusFilter, opFilter, operatorOnly, operatorName]);

  // Initial fetch and auto-refresh (paused while modal is open to avoid background distractions)
  useEffect(() => {
    fetchLogs(false);
  }, [fetchLogs]);

  useEffect(() => {
    if (selectedLog) return; // Pause polling when inspecting a record modal

    const interval = setInterval(() => {
      fetchLogs(true);
    }, 2500);
    return () => clearInterval(interval);
  }, [fetchLogs, selectedLog]);

  // Keyboard Escape listener for Modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && selectedLog) {
        setSelectedLog(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLog]);

  // Auto-focus modal close button on open
  useEffect(() => {
    if (selectedLog && modalCloseBtnRef.current) {
      modalCloseBtnRef.current.focus();
    }
  }, [selectedLog]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchLogs(false);
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
    if (logs.length === 0) return toast.error('Tidak ada data untuk diekspor');

    const headers = ["ID Log", "Waktu", "ID Transaksi", "Part Number", "Nama Part", "Lot No", "Unique No", "Target Qty", "Actual Qty", "Status Deteksi", "Metode", "Confidence Score", "Operator"];
    const rows = logs.map(l => [
      l.id,
      l.created_at ? new Date(l.created_at).toLocaleString('id-ID') : '-',
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
        subtitle={operatorOnly ? `Catatan data hasil inspeksi kamera milik ${operatorName || 'Anda'}` : "Riwayat log hasil deteksi inspeksi kamera produksi seluruh station"}
        actionButton={
          isAdminOrPengawas ? (
            <button
              onClick={handleExportCSV}
              disabled={logs.length === 0}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm rounded-lg shadow-sm transition-all disabled:opacity-50 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              <Download className="w-4 h-4" />
              <span>Ekspor CSV</span>
            </button>
          ) : null
        }
      />

      {/* Summary Stat Cards with Quick Status Filter */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <StatCard 
          title="Total Inspeksi" 
          value={totalCount} 
          icon={Activity} 
          color="blue" 
          active={statusFilter === 'ALL'}
          onClick={() => setStatusFilter('ALL')} 
        />
        <StatCard 
          title="Komponen OK" 
          value={okCount} 
          icon={CheckCircle} 
          color="green" 
          active={statusFilter === 'OK'}
          onClick={() => setStatusFilter('OK')} 
        />
        <StatCard 
          title="Komponen NG" 
          value={ngCount} 
          icon={AlertOctagon} 
          color="rose" 
          active={statusFilter === 'NG'}
          onClick={() => setStatusFilter('NG')} 
        />
      </div>

      {/* Filter Controls Bar */}
      <div className="bg-slate-900/90 rounded-xl border border-slate-800 p-4 sm:p-5 space-y-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <Filter className="w-4 h-4 text-blue-400" />
            <h3 className="font-semibold text-white text-sm sm:text-base">Filter Log Data</h3>
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-950 p-1 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => { setFilterType('daily'); setMonthFilter(''); }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                filterType === 'daily'
                  ? 'bg-blue-600 text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Harian
            </button>
            <button
              type="button"
              onClick={() => { setFilterType('monthly'); setDateFilter(''); }}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 ${
                filterType === 'monthly'
                  ? 'bg-blue-600 text-white shadow-sm font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Bulanan
            </button>
          </div>
        </div>

        {/* Balanced Filter Form Grid */}
        <form onSubmit={handleSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-12 gap-3 items-end">
          {filterType === 'daily' ? (
            <div className="lg:col-span-3">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tanggal</label>
              <input
                type="date"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full h-10 bg-slate-950 border border-slate-700 rounded-lg px-3 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
              />
            </div>
          ) : (
            <div className="lg:col-span-3">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Bulan & Tahun</label>
              <input
                type="month"
                value={monthFilter}
                onChange={(e) => setMonthFilter(e.target.value)}
                className="w-full h-10 bg-slate-950 border border-slate-700 rounded-lg px-3 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
              />
            </div>
          )}

          <div className="lg:col-span-3">
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Part Number</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Contoh: 74231..."
                value={partFilter}
                onChange={(e) => setPartFilter(e.target.value)}
                className="w-full h-10 bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors font-mono focus-visible:ring-2 focus-visible:ring-blue-500"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          {!operatorOnly && (
            <div className="lg:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Operator</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Nama operator..."
                  value={opFilter}
                  onChange={(e) => setOpFilter(e.target.value)}
                  className="w-full h-10 bg-slate-950 border border-slate-700 rounded-lg pl-9 pr-3 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors focus-visible:ring-2 focus-visible:ring-blue-500"
                />
                <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              </div>
            </div>
          )}

          <div className={operatorOnly ? "lg:col-span-3" : "lg:col-span-2"}>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Status Deteksi</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full h-10 bg-slate-950 border border-slate-700 rounded-lg px-3 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors font-semibold focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <option value="ALL">Semua Status</option>
              <option value="OK">OK Saja</option>
              <option value="NG">NG Saja</option>
            </select>
          </div>

          <div className={`${operatorOnly ? "lg:col-span-3" : "lg:col-span-2"} flex items-center gap-2`}>
            <button
              type="submit"
              className="flex-1 h-10 px-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm rounded-lg shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Terapkan</span>
            </button>
            <button
              type="button"
              onClick={handleResetFilters}
              className="h-10 w-10 shrink-0 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition-colors cursor-pointer flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              title="Reset Filter"
              aria-label="Reset Filter"
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
        error={error}
        onRetry={() => fetchLogs(false)}
        emptyMessage="Tidak ada data riwayat inspeksi yang sesuai."
      >
        {currentLogs.map((log) => (
          <tr key={log.id} className="hover:bg-slate-800/40 transition-colors border-b border-slate-800/60">
            <td className="p-3.5 text-xs text-slate-300 font-sans font-medium">
              {log.created_at ? new Date(log.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : '-'}
            </td>
            <td className="p-3.5 text-xs sm:text-sm font-semibold text-white max-w-[180px] truncate" title={log.part_name || '-'}>
              {log.part_name || '-'}
            </td>
            <td className="p-3.5 text-xs font-mono text-slate-400 max-w-[100px] truncate" title={log.id_trans}>
              {log.id_trans || '-'}
            </td>
            <td className="p-3.5 text-xs sm:text-sm font-mono font-semibold text-slate-200 max-w-[120px] truncate" title={log.part_no || '-'}>
              {log.part_no || '-'}
            </td>
            <td className="p-3.5 text-xs sm:text-sm font-semibold text-slate-300">{log.target_qty ?? '-'}</td>
            <td className="p-3.5 text-xs sm:text-sm font-semibold text-slate-300">{log.qty_actual ?? '-'}</td>
            <td className="p-3.5">
              <StatusBadge status={log.detection_status || 'OK'} pulse={false} />
            </td>
            {!operatorOnly && (
              <td className="p-3.5">
                {log.method === 'MANUAL' ? (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                    Manual
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    AI Auto
                  </span>
                )}
              </td>
            )}
            <td className="p-3.5 text-xs sm:text-sm font-mono font-semibold text-slate-200">
              {log.confidence_score !== undefined ? `${(log.confidence_score * 100).toFixed(0)}%` : '100%'}
            </td>
            {!operatorOnly && (
              <td className="p-3.5 text-xs sm:text-sm text-sky-400 font-semibold">{log.operator_name || '-'}</td>
            )}
            <td className="p-3.5 text-center">
              <button
                type="button"
                onClick={() => setSelectedLog(log)}
                className="p-1.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-md transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                title="Lihat Detail Transaksi & Foto"
                aria-label="Lihat Detail Transaksi & Foto"
              >
                <Info className="w-4 h-4" />
              </button>
            </td>
          </tr>
        ))}
      </DataTable>

      {/* Pagination Controls Bar */}
      {logs.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-slate-900/90 rounded-xl border border-slate-800 shadow-sm text-xs sm:text-sm">
          <div className="flex items-center gap-2 text-slate-400">
            <span className="px-2.5 py-1 bg-slate-800 border border-slate-700 text-slate-300 rounded-md font-semibold text-xs">
              15 data per halaman
            </span>
            <span>
              Menampilkan <strong className="text-white">{startIdx + 1}</strong>–<strong className="text-white">{Math.min(startIdx + itemsPerPage, logs.length)}</strong> dari <strong className="text-white">{logs.length}</strong> data
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold text-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Sebelumnya</span>
            </button>

            <div className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-950 border border-slate-800 rounded-lg">
              <span className="text-blue-400">{currentPage}</span> / <span>{totalPages}</span>
            </div>

            <button
              type="button"
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold text-xs disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              <span>Selanjutnya</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Accessible Detail Modal Dialog */}
      {selectedLog && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedLog(null);
          }}
        >
          <div className="w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 id="modal-title" className="text-lg sm:text-xl font-bold text-white">
                  Detail <span className="text-blue-400">Log Inspeksi</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">ID Log: #{selectedLog.id} | Operator: <strong className="text-white">{selectedLog.operator_name || '-'}</strong></p>
              </div>
              <button
                ref={modalCloseBtnRef}
                type="button"
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                aria-label="Tutup dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Snapshot Bukti NG */}
            {selectedLog.image_path && (
              <div className="rounded-xl border border-rose-500/40 overflow-hidden bg-black flex flex-col items-center">
                <div className="w-full bg-rose-950/60 px-3.5 py-1.5 flex items-center gap-2 text-rose-300 font-semibold text-xs border-b border-rose-500/20">
                  <ImageIcon className="w-3.5 h-3.5" />
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Part Number</span>
                <span className="text-base font-bold text-white font-mono">{selectedLog.part_no || selectedLog.p_no || '-'}</span>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Nama Part</span>
                <span className="text-sm font-semibold text-white truncate block">{selectedLog.part_name || '-'}</span>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Nomor LOT</span>
                <span className="text-sm font-mono font-semibold text-white">{selectedLog.lot_no || '-'}</span>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Nomor Unik</span>
                <span className="text-sm font-mono font-semibold text-white">{selectedLog.unique_no || '-'}</span>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Target / Selesai</span>
                <span className="text-sm font-semibold text-slate-200">{selectedLog.target_qty ?? '-'} / {selectedLog.qty_actual ?? '-'}</span>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Status Deteksi</span>
                <div className="pt-1">
                  <StatusBadge status={selectedLog.detection_status || 'OK'} pulse={false} />
                </div>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Confidence Score</span>
                <span className="text-base font-mono font-bold text-emerald-400">
                  {selectedLog.confidence_score !== undefined ? `${(selectedLog.confidence_score * 100).toFixed(0)}%` : '100%'}
                </span>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Metode & Operator</span>
                <div className="pt-0.5 flex items-center justify-between text-xs sm:text-sm">
                  <span className="font-semibold text-white">{selectedLog.operator_name || '-'}</span>
                  <span className="text-slate-400 font-medium">({selectedLog.method === 'MANUAL' ? 'Manual' : 'AI Auto'})</span>
                </div>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 sm:col-span-2">
                <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Waktu Inspeksi</span>
                <span className="text-xs sm:text-sm font-medium text-slate-200">
                  {selectedLog.created_at ? new Date(selectedLog.created_at).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'medium' }) : '-'}
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

