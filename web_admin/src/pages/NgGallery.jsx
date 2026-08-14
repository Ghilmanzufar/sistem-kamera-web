import React, { useState, useEffect } from 'react';
import { 
  AlertOctagon, 
  Search, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  X, 
  User, 
  Clock, 
  Eye, 
  FileText, 
  Layers, 
  Activity,
  Cpu,
  Hash
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';

export default function NgGallery() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('');
  const [partFilter, setPartFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedLog, setSelectedLog] = useState(null);
  const itemsPerPage = 10;

  const fetchNgLogs = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const params = { status_filter: 'NG' };
      if (dateFilter) params.date_filter = dateFilter;
      if (partFilter) params.part_filter = partFilter;
      const res = await api.get('/api/admin/inspection-logs', { params });
      setLogs(res.data || []);
      if (!silent) setCurrentPage(1);
    } catch {
      if (!silent) toast.error('Gagal memuat data NG');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchNgLogs(false);
    const interval = setInterval(() => fetchNgLogs(true), 5000);
    return () => clearInterval(interval);
  }, [dateFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchNgLogs();
  };

  const handleReset = () => {
    setDateFilter('');
    setPartFilter('');
    setTimeout(() => fetchNgLogs(), 50);
  };

  const totalPages = Math.max(1, Math.ceil(logs.length / itemsPerPage));
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginated = logs.slice(startIdx, startIdx + itemsPerPage);

  const topPart = (() => {
    if (logs.length === 0) return '-';
    const counts = {};
    logs.forEach(l => { 
      const p = l.part_no || '-';
      counts[p] = (counts[p] || 0) + 1; 
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';
  })();

  const manualCount = logs.filter(l => l.method === 'MANUAL').length;
  const aiCount = logs.length - manualCount;

  return (
    <div className="space-y-6 font-sans pb-12">
      <PageHeader
        title="Rekap Data"
        highlightTitle="Hasil NG"
        subtitle="Riwayat pencatatan hasil inspeksi cacat (NG) part produksi dari kamera AI dan konfirmasi operator"
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard 
          title="Total NG Tercatat" 
          value={logs.length} 
          icon={AlertOctagon} 
          color="rose" 
        />
        <StatCard
          title="Part NG Terbanyak"
          value={topPart}
          icon={Search}
          color="amber"
        />
        <StatCard
          title="Deteksi AI vs Manual"
          value={`${aiCount} AI / ${manualCount} Manual`}
          icon={Cpu}
          color="blue"
        />
      </div>

      {/* Filter & Search Bar */}
      <form onSubmit={handleSearch} className="glass-card p-4 rounded-2xl border border-white/10 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-rose-500"
          />
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari Part Number atau ID Transaksi..."
            value={partFilter}
            onChange={(e) => setPartFilter(e.target.value)}
            className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-bold placeholder:text-slate-500 focus:outline-none focus:border-rose-500"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl transition-all cursor-pointer shadow-md shadow-rose-600/30"
        >
          Cari Data
        </button>
        {(dateFilter || partFilter) && (
          <button
            type="button"
            onClick={handleReset}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Reset
          </button>
        )}
      </form>

      {/* Main Data Table */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-sm font-bold animate-pulse">
          Memuat data rekap NG...
        </div>
      ) : paginated.length === 0 ? (
        <div className="glass-card p-12 rounded-3xl border border-white/10 text-center space-y-3">
          <AlertOctagon className="w-14 h-14 text-slate-600 mx-auto" />
          <h4 className="text-lg font-black text-slate-300">Tidak Ada Data NG Ditemukan</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Belum ada data part cacat (NG) yang tercatat sesuai filter yang dipilih.
          </p>
        </div>
      ) : (
        <div className="glass-card rounded-3xl border border-white/10 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-950/80 border-b border-white/10 text-slate-400 font-extrabold uppercase tracking-wider">
                  <th className="py-3.5 px-4"># ID Log</th>
                  <th className="py-3.5 px-4">ID Transaksi</th>
                  <th className="py-3.5 px-4">Part Number</th>
                  <th className="py-3.5 px-4">Nama Part</th>
                  <th className="py-3.5 px-4">Lot / Unique</th>
                  <th className="py-3.5 px-4">Operator</th>
                  <th className="py-3.5 px-4">Metode</th>
                  <th className="py-3.5 px-4">Waktu Inspeksi</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {paginated.map((log) => (
                  <tr 
                    key={log.id} 
                    className="hover:bg-rose-500/5 transition-colors cursor-pointer"
                    onClick={() => setSelectedLog(log)}
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-400">
                      #{log.id}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-bold text-rose-300">
                      {log.id_trans || '-'}
                    </td>
                    <td className="py-3.5 px-4 font-black text-white">
                      {log.part_no || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-slate-300 max-w-[150px] truncate">
                      {log.part_name || '-'}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                      <div>LOT: <span className="text-white font-bold">{log.lot_no || '-'}</span></div>
                      <div>UNQ: <span className="text-white font-bold">{log.unique_no || '-'}</span></div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-200">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{log.operator_name || '-'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                        log.method === 'MANUAL'
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                      }`}>
                        {log.method === 'MANUAL' ? 'Manual Reject' : 'AI Detector'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400">
                      {log.created_at ? new Date(log.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLog(log);
                        }}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
                        title="Lihat Detail Log"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {logs.length > itemsPerPage && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs font-bold text-slate-400">
            Menampilkan {startIdx + 1} - {Math.min(startIdx + itemsPerPage, logs.length)} dari {logs.length} data NG
          </span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 rounded-xl bg-slate-800 border border-white/10 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1.5 text-xs font-black text-white bg-slate-900 border border-white/10 rounded-xl">
              {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 rounded-xl bg-slate-800 border border-white/10 text-slate-300 hover:text-white disabled:opacity-30 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-xl bg-slate-900 border-2 border-rose-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-xl font-black text-white flex items-center gap-2">
                  <AlertOctagon className="w-5 h-5 text-rose-400" />
                  <span>Detail Rekap <span className="text-rose-400">Cacat (NG)</span></span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Log ID: <strong className="text-white">#{selectedLog.id}</strong> | Status: <strong className="text-rose-400">NG / REJECT</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Detail Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-black/30 p-3.5 rounded-2xl border border-white/5 space-y-1">
                <span className="block text-[11px] font-bold uppercase text-slate-400">ID Transaksi</span>
                <span className="text-sm font-mono font-black text-rose-300 truncate block">{selectedLog.id_trans || '-'}</span>
              </div>
              <div className="bg-black/30 p-3.5 rounded-2xl border border-white/5 space-y-1">
                <span className="block text-[11px] font-bold uppercase text-slate-400">Operator</span>
                <span className="text-sm font-bold text-white truncate block">{selectedLog.operator_name || '-'}</span>
              </div>
              <div className="bg-black/30 p-3.5 rounded-2xl border border-white/5 space-y-1">
                <span className="block text-[11px] font-bold uppercase text-slate-400">Part Number</span>
                <span className="text-base font-black text-white">{selectedLog.part_no || '-'}</span>
              </div>
              <div className="bg-black/30 p-3.5 rounded-2xl border border-white/5 space-y-1">
                <span className="block text-[11px] font-bold uppercase text-slate-400">Nama Part</span>
                <span className="text-sm font-bold text-white truncate block">{selectedLog.part_name || '-'}</span>
              </div>
              <div className="bg-black/30 p-3.5 rounded-2xl border border-white/5 space-y-1">
                <span className="block text-[11px] font-bold uppercase text-slate-400">Lot No</span>
                <span className="text-sm font-mono font-bold text-white">{selectedLog.lot_no || '-'}</span>
              </div>
              <div className="bg-black/30 p-3.5 rounded-2xl border border-white/5 space-y-1">
                <span className="block text-[11px] font-bold uppercase text-slate-400">Unique No</span>
                <span className="text-sm font-mono font-bold text-white">{selectedLog.unique_no || '-'}</span>
              </div>
              <div className="bg-black/30 p-3.5 rounded-2xl border border-white/5 space-y-1">
                <span className="block text-[11px] font-bold uppercase text-slate-400">Metode Deteksi</span>
                <span className="text-sm font-bold text-white">{selectedLog.method === 'MANUAL' ? 'Manual Operator' : 'AI YOLOv8'}</span>
              </div>
              <div className="bg-black/30 p-3.5 rounded-2xl border border-white/5 space-y-1">
                <span className="block text-[11px] font-bold uppercase text-slate-400">Confidence Score</span>
                <span className="text-base font-mono font-black text-rose-400">
                  {selectedLog.confidence_score !== undefined ? `${(selectedLog.confidence_score * 100).toFixed(0)}%` : '-'}
                </span>
              </div>
              <div className="bg-black/30 p-3.5 rounded-2xl border border-white/5 space-y-1 col-span-2">
                <span className="block text-[11px] font-bold uppercase text-slate-400">Waktu Lengkap Inspeksi</span>
                <span className="text-sm font-semibold text-slate-200">
                  {selectedLog.created_at ? new Date(selectedLog.created_at).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'medium' }) : '-'}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-6 py-2.5 text-sm font-extrabold text-white bg-rose-600 hover:bg-rose-500 rounded-2xl shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
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
