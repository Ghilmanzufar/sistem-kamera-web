import React, { useState, useEffect, useCallback } from 'react';
import { Download, Activity, CheckCircle, AlertOctagon, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import StatCard from '../components/StatCard';
import HistoryFilterCard from '../components/history/HistoryFilterCard';
import HistoryDetailModal from '../components/history/HistoryDetailModal';
import HistoryPagination from '../components/history/HistoryPagination';

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

  const fetchLogs = useCallback(async (isSilent = false) => {
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
  }, [filterType, dateFilter, monthFilter, partFilter, statusFilter, opFilter, operatorOnly, operatorName]);

  useEffect(() => {
    fetchLogs(false);
    const interval = setInterval(() => {
      fetchLogs(true);
    }, 2500);
    return () => clearInterval(interval);
  }, [fetchLogs]);

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
      <HistoryFilterCard
        filterType={filterType}
        setFilterType={setFilterType}
        dateFilter={dateFilter}
        setDateFilter={setDateFilter}
        monthFilter={monthFilter}
        setMonthFilter={setMonthFilter}
        partFilter={partFilter}
        setPartFilter={setPartFilter}
        opFilter={opFilter}
        setOpFilter={setOpFilter}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        operatorOnly={operatorOnly}
        onSearchSubmit={handleSearchSubmit}
        onResetFilters={handleResetFilters}
      />

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
      <HistoryPagination
        totalLogs={logs.length}
        itemsPerPage={itemsPerPage}
        startIdx={startIdx}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />

      {/* Detail Modal Dialog */}
      <HistoryDetailModal
        selectedLog={selectedLog}
        onClose={() => setSelectedLog(null)}
      />
    </div>
  );
}
