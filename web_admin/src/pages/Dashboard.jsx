import React, { useState, useEffect } from 'react';
import { 
  Activity, CheckCircle2, Clock, AlertOctagon, Trash2, 
  TrendingUp, Radio, Filter, Layers, Check, XCircle, Sparkles
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';
import PageHeader from '../components/PageHeader';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import ConfirmModal from '../components/ConfirmModal';

export default function Dashboard() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showClearModal, setShowClearModal] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL', 'RUNNING', 'OK', 'NG'

  const fetchTransactions = async () => {
    try {
      const res = await api.get('/api/admin/transactions');
      setTransactions(res.data || []);
    } catch (err) {
      console.error('Failed to fetch transactions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    const interval = setInterval(fetchTransactions, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleClearRunning = async () => {
    setShowClearModal(false);
    setClearing(true);
    try {
      const res = await api.delete('/api/admin/transactions/running');
      if (res.data && res.data.success) {
        toast.success(res.data.message || 'Transaksi RUNNING berhasil dibersihkan!');
        fetchTransactions();
      }
    } catch (err) {
      toast.error('Gagal membersihkan data RUNNING');
    } finally {
      setClearing(false);
    }
  };

  const totalCount = transactions.length;
  const okCount = transactions.filter(t => t.status === 1).length;
  const runningCount = transactions.filter(t => t.status === 2).length;
  const ngCount = transactions.filter(t => t.status === 0 || t.status === 3).length;

  // Calculate Yield Rate (% OK)
  const passRateVal = totalCount > 0 ? (okCount / totalCount) * 100 : 100;
  const passRateStr = passRateVal.toFixed(1) + '%';

  // Filtered transactions for display
  const filtered = transactions.filter(t => {
    if (filterStatus === 'RUNNING') return t.status === 2;
    if (filterStatus === 'OK') return t.status === 1;
    if (filterStatus === 'NG') return t.status === 0 || t.status === 3;
    return true;
  });

  const displayTransactions = filtered.slice(0, 15);

  const tableHeaders = [
    "ID Trans", "Part No", "Unique No", "Nama Part", "Progres Qty (Aktual / Target)", "Status", "Mulai", "Selesai"
  ];

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Live"
        highlightTitle="Dashboard"
        subtitle="Pemantauan transaksi inspeksi kamera secara real-time"
        actionButton={
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-900/80 border border-white/10 text-xs font-mono text-slate-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span className="font-bold">Live Stream Sync (1s)</span>
          </div>
        }
      />

      {/* Structured Metric Grid - antislop-ui standard (Grounded, distinct, readable) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
        
        {/* Card 1: Total Transaksi */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-blue-500/30 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-black uppercase tracking-wider">Total Transaksi</span>
            <div className="w-7 h-7 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">{totalCount}</div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Seluruh riwayat inspeksi</div>
        </div>

        {/* Card 2: Inspeksi OK */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-emerald-500/30 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-300">Inspeksi OK</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-400">{okCount}</div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Part lolos standar kualitas</div>
        </div>

        {/* Card 3: Yield Rate */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-teal-500/30 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-teal-300">Yield Rate</span>
            <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-teal-300">{passRateStr}</div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Rasio kelolosan part (Target &gt; 95%)</div>
        </div>

        {/* Card 4: Proses Running */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-amber-500/30 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-amber-300">Sedang Berjalan</span>
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-400">{runningCount}</div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Part aktif di line inspeksi</div>
        </div>

        {/* Card 5: Cacat NG */}
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-rose-500/30 shadow-lg flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-black uppercase tracking-wider text-rose-300">Inspeksi NG</span>
            <div className="w-7 h-7 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <AlertOctagon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-rose-400">{ngCount}</div>
          <div className="text-[11px] text-slate-400 mt-1 font-medium">Part terdeteksi cacat / reject</div>
        </div>

      </div>

      {/* Live Table Container */}
      <div className="p-6 sm:p-7 bg-slate-900/90 border border-white/10 rounded-3xl shadow-xl space-y-5">
        
        {/* Table Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Tabs */}
            <button
              type="button"
              onClick={() => setFilterStatus('ALL')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                filterStatus === 'ALL'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Semua ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('RUNNING')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                filterStatus === 'RUNNING'
                  ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Running ({runningCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('OK')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                filterStatus === 'OK'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              OK ({okCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterStatus('NG')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer ${
                filterStatus === 'NG'
                  ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              NG ({ngCount})
            </button>
          </div>

          <div className="flex items-center gap-3">
            {runningCount > 0 && (
              <button
                type="button"
                onClick={() => setShowClearModal(true)}
                disabled={clearing}
                className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-extrabold text-rose-300 bg-rose-950/60 border border-rose-500/40 rounded-xl hover:bg-rose-600 hover:text-white transition-all disabled:opacity-50 cursor-pointer shadow"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Bersihkan RUNNING ({runningCount})</span>
              </button>
            )}
            <span className="text-xs font-semibold text-slate-400">
              Menampilkan {displayTransactions.length} transaksi
            </span>
          </div>
        </div>

        {/* Data Table */}
        <DataTable headers={tableHeaders} isLoading={loading} maxHeight="480px" center={true}>
          {displayTransactions.map((t) => {
            const targetQty = t.target_qty || 1;
            const actualQty = t.qty_actual || 0;
            const pct = Math.min(100, Math.round((actualQty / targetQty) * 100));

            return (
              <tr key={t.id_trans} className="hover:bg-white/[0.03] transition-colors border-b border-white/5">
                <td className="p-3.5 font-mono font-bold text-sky-400 text-center text-xs sm:text-sm">{t.id_trans}</td>
                <td className="p-3.5 text-center font-bold text-white text-xs sm:text-sm">{t.part_no || '-'}</td>
                <td className="p-3.5 text-center font-mono text-slate-300 text-xs sm:text-sm">{t.unique_no || '-'}</td>
                <td className="p-3.5 text-center font-medium text-slate-200 text-xs sm:text-sm truncate max-w-[150px]">{t.part_name || '-'}</td>

                {/* Progress Bar Visual (Target vs Actual) */}
                <td className="p-3.5">
                  <div className="flex flex-col gap-1 w-44 mx-auto">
                    <div className="flex justify-between items-center text-xs font-bold px-0.5">
                      <span className="text-emerald-400">{actualQty} Pcs</span>
                      <span className="text-slate-400">/ {targetQty} Pcs</span>
                      <span className="text-[10px] font-mono font-extrabold text-sky-300 bg-sky-500/20 px-1.5 py-0.5 rounded border border-sky-500/30">{pct}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-white/10">
                      <div 
                        className={`h-full transition-all duration-300 rounded-full ${
                          pct >= 100 
                            ? 'bg-emerald-500' 
                            : t.status === 0 
                            ? 'bg-rose-500' 
                            : 'bg-sky-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </td>

                <td className="p-3.5 text-center"><StatusBadge status={t.status} /></td>
                <td className="p-3.5 text-xs sm:text-sm font-semibold text-slate-300 text-center font-mono">
                  {t.start_time ? new Date(t.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                </td>
                <td className="p-3.5 text-xs sm:text-sm font-semibold text-slate-300 text-center font-mono">
                  {t.end_time ? new Date(t.end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                </td>
              </tr>
            );
          })}
        </DataTable>
      </div>

      <ConfirmModal
        isOpen={showClearModal}
        title="Hapus Transaksi RUNNING"
        message={`Apakah Anda yakin ingin menghapus ${runningCount} transaksi berstatus RUNNING yang menggantung dari database?`}
        confirmText="Hapus Data RUNNING"
        isDanger={true}
        onConfirm={handleClearRunning}
        onCancel={() => setShowClearModal(false)}
      />
    </div>
  );
}
