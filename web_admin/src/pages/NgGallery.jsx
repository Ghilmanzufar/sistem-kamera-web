import React, { useState, useEffect } from 'react';
import { AlertOctagon, Search, Calendar, ChevronLeft, ChevronRight, X, Image as ImageIcon, User, Clock, Eye } from 'lucide-react';
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
  const itemsPerPage = 12;

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

  const totalPages = Math.max(1, Math.ceil(logs.length / itemsPerPage));
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginated = logs.slice(startIdx, startIdx + itemsPerPage);

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Galeri"
        highlightTitle="Hasil NG"
        subtitle="Riwayat hasil inspeksi cacat (NG) beserta foto bukti dari kamera AI"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total NG Tercatat" value={logs.length} icon={AlertOctagon} color="rose" />
        <StatCard
          title="Part NG Terbanyak"
          value={(() => {
            if (logs.length === 0) return '-';
            const counts = {};
            logs.forEach(l => { counts[l.part_no] = (counts[l.part_no] || 0) + 1; });
            return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';
          })()}
          icon={Search}
          color="amber"
        />
        <StatCard
          title="NG Dengan Foto"
          value={logs.filter(l => l.image_path).length}
          icon={ImageIcon}
          color="blue"
        />
      </div>

      {/* Filter Bar */}
      <form onSubmit={handleSearch} className="glass-card p-4 rounded-2xl border border-white/10 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-bold focus:outline-none focus:border-blue-500"
          />
        </div>
        <div className="flex items-center gap-2 flex-1 min-w-[180px]">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari Part Number..."
            value={partFilter}
            onChange={(e) => setPartFilter(e.target.value)}
            className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-bold placeholder:text-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-black rounded-xl transition-all cursor-pointer"
        >
          Cari NG
        </button>
      </form>

      {/* NG Gallery Grid */}
      {loading ? (
        <div className="text-center py-16 text-slate-400 text-sm font-bold animate-pulse">
          Memuat data NG...
        </div>
      ) : paginated.length === 0 ? (
        <div className="glass-card p-12 rounded-3xl border-2 border-white/10 text-center space-y-3">
          <AlertOctagon className="w-14 h-14 text-slate-600 mx-auto" />
          <h4 className="text-lg font-black text-slate-300">Tidak Ada Data NG Ditemukan</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Belum ada hasil inspeksi NG yang tercatat untuk filter yang dipilih.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {paginated.map((log) => {
            const hasImage = !!log.image_path;
            return (
              <div
                key={log.id}
                className="glass-card rounded-2xl border border-rose-500/30 overflow-hidden shadow-lg hover:shadow-rose-950/30 transition-all group cursor-pointer"
                onClick={() => setSelectedLog(log)}
              >
                {/* Image Preview */}
                <div className="relative aspect-video bg-slate-950 flex items-center justify-center overflow-hidden">
                  {hasImage ? (
                    <img
                      src={log.image_path}
                      alt={`NG ${log.part_no}`}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="text-center text-slate-500">
                      <ImageIcon className="w-10 h-10 mx-auto mb-1" />
                      <span className="text-xs font-bold">Tidak Ada Foto</span>
                    </div>
                  )}
                  <div className="absolute top-2 left-2">
                    <StatusBadge status="NG" />
                  </div>
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-8 h-8 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30">
                      <Eye className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Card Info */}
                <div className="p-3.5 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-black text-white text-sm truncate">{log.part_no || '-'}</span>
                    <span className="text-[10px] font-mono font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-white/10 shrink-0">
                      #{log.id}
                    </span>
                  </div>
                  <div className="text-xs text-slate-400 truncate">{log.part_name || '-'}</div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      <span className="font-bold truncate max-w-[80px]">{log.operator_name || '-'}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span className="font-mono">
                        {log.created_at ? new Date(log.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }) : '-'}
                      </span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
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
          <div className="w-full max-w-2xl bg-slate-900 border-2 border-rose-500/40 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-xl font-black text-white">
                  Detail <span className="text-rose-400">Cacat NG</span>
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Log #{selectedLog.id} | Operator: <strong className="text-white">{selectedLog.operator_name || '-'}</strong>
                </p>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 cursor-pointer transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Foto NG */}
            {selectedLog.image_path && (
              <div className="rounded-2xl border-2 border-rose-500/50 overflow-hidden bg-black">
                <div className="w-full bg-rose-950/80 px-4 py-2 flex items-center gap-2 text-rose-300 font-black text-xs border-b border-rose-500/30">
                  <ImageIcon className="w-4 h-4" />
                  <span>Foto Bukti Cacat (NG Record)</span>
                </div>
                <img
                  src={selectedLog.image_path}
                  alt="Foto Cacat NG"
                  className="w-full max-h-80 object-contain"
                />
              </div>
            )}

            {/* Detail Grid */}
            <div className="grid grid-cols-2 gap-3">
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
                <span className="block text-[11px] font-bold uppercase text-slate-400">Confidence</span>
                <span className="text-base font-mono font-black text-rose-400">
                  {selectedLog.confidence_score !== undefined ? `${(selectedLog.confidence_score * 100).toFixed(0)}%` : '-'}
                </span>
              </div>
              <div className="bg-black/30 p-3.5 rounded-2xl border border-white/5 space-y-1">
                <span className="block text-[11px] font-bold uppercase text-slate-400">Metode</span>
                <span className="text-sm font-bold text-white">{selectedLog.method === 'MANUAL' ? 'Manual' : 'AI YOLO'}</span>
              </div>
              <div className="bg-black/30 p-3.5 rounded-2xl border border-white/5 space-y-1 col-span-2">
                <span className="block text-[11px] font-bold uppercase text-slate-400">Waktu Inspeksi</span>
                <span className="text-sm font-semibold text-slate-200">
                  {selectedLog.created_at ? new Date(selectedLog.created_at).toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'medium' }) : '-'}
                </span>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedLog(null)}
                className="px-6 py-3 text-sm font-extrabold text-white bg-rose-600 hover:bg-rose-500 rounded-2xl shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
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
