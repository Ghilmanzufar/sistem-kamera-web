import React, { useState, useEffect } from 'react';
import { 
  Tv, User, Layers, CheckCircle, AlertOctagon, Activity, 
  RefreshCw, Clock, Radio, ShieldAlert, Cpu, Eye
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';

export default function LineMonitoring() {
  const [monitoringData, setMonitoringData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMonitoring = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await api.get('/api/admin/line-monitoring');
      setMonitoringData(res.data);
    } catch (err) {
      if (!isSilent) toast.error('Gagal mengambil data monitoring stasiun line');
    } finally {
      if (!isSilent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitoring(false);
    const interval = setInterval(() => {
      fetchMonitoring(true);
    }, 1500); // Live poll setiap 1.5 detik
    return () => clearInterval(interval);
  }, []);

  const summary = monitoringData?.summary || {
    total_stations: 1,
    active_operators: 0,
    today_total_inspections: 0,
    today_ok: 0,
    today_ng: 0,
    alarm_ng_active: false
  };

  const stations = monitoringData?.stations || [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Monitoring"
        highlightTitle="Line & Operator"
        subtitle="Pantau stasiun kerja kamera inspeksi dan operator aktif secara real-time dari office"
        actionButton={
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
              LIVE MONITORING
            </span>
          </div>
        }
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Stasiun Line"
          value={summary.total_stations}
          icon={Tv}
          color="blue"
        />
        <StatCard
          title="Operator Aktif Bekerja"
          value={summary.active_operators}
          icon={User}
          color="green"
        />
        <StatCard
          title="Inspeksi Hari Ini (OK / NG)"
          value={`${summary.today_ok} / ${summary.today_ng}`}
          icon={Activity}
          color="indigo"
        />
        <StatCard
          title="Status Alarm Darurat"
          value={summary.alarm_ng_active ? "SIRENE AKTIF" : "NORMAL"}
          icon={summary.alarm_ng_active ? ShieldAlert : CheckCircle}
          color={summary.alarm_ng_active ? "rose" : "green"}
        />
      </div>

      {/* Grid Kartu Stasiun Kerja / Line Operator */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Radio className="w-4 h-4 text-blue-400 animate-pulse" />
            <span>Daftar Stasiun Line Produksi</span>
          </h3>
          <span className="text-xs text-slate-400">
            Pembaruan otomatis tiap 1.5s
          </span>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {stations.map((st) => {
            const isStationNg = st.ng_active || st.status === 'NG';
            const isStationRunning = st.status === 'RUNNING' || st.status === 'OK';
            const percent = st.target_qty > 0 ? Math.min(100, Math.round((st.qty_completed / st.target_qty) * 100)) : 0;

            let cardBorder = 'border-white/10';
            if (isStationNg) cardBorder = 'border-rose-500 ring-2 ring-rose-500/50 animate-pulse';
            else if (isStationRunning) cardBorder = 'border-emerald-500/50 shadow-emerald-950/20';

            const loginDateStr = st.operator?.login_time
              ? new Date(st.operator.login_time * 1000).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
              : '-';

            return (
              <div
                key={st.id}
                className={`glass-card p-6 rounded-3xl border-2 shadow-2xl space-y-5 transition-all duration-300 ${cardBorder}`}
              >
                {/* Card Header: Line Name & Live Status Badge */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-400/20 flex items-center justify-center text-blue-400">
                      <Tv className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-white text-base sm:text-lg tracking-wide">{st.line_name}</h4>
                      <p className="text-xs text-slate-400">{st.id} • Kamera: {st.camera_name} (Source: {st.camera_source})</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <StatusBadge status={st.status} />
                  </div>
                </div>

                {/* Video Live Preview Stream */}
                <div className="relative rounded-2xl overflow-hidden bg-black border border-white/10 aspect-video flex items-center justify-center shadow-inner">
                  {st.is_camera_active ? (
                    <img
                      src={st.video_feed_url}
                      alt={`Live Feed ${st.line_name}`}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="text-center p-4 text-slate-500 text-xs">
                      Kamera Offline / Standby
                    </div>
                  )}

                  {/* Overlay Tag */}
                  <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-[10px] font-bold text-white flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                    <span>LIVE STREAM</span>
                  </div>

                  {st.status && (
                    <div className="absolute bottom-3 right-3 bg-black/80 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 text-xs font-bold text-emerald-400">
                      {st.last_pesan_ui || st.status}
                    </div>
                  )}
                </div>

                {/* Operator Info & Inspection Target Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Operator Info Box */}
                  <div className="bg-slate-900/80 p-4 rounded-2xl border border-white/5 space-y-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 block flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-sky-400" />
                      <span>Operator Bertugas</span>
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-white">{st.operator?.name || '-'}</span>
                      {st.operator?.is_active && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Aktif
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Login: {loginDateStr}</span>
                    </div>
                  </div>

                  {/* Part Number & Sisi */}
                  <div className="bg-slate-900/80 p-4 rounded-2xl border border-white/5 space-y-2">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-amber-400 block flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5" />
                      <span>Part Aktif & Sisi</span>
                    </span>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-black text-white truncate max-w-[140px]">
                        {st.part_no || 'STANDBY'}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-black bg-blue-500/20 text-blue-300 border border-blue-500/30">
                        SISI {st.current_side}
                      </span>
                    </div>
                    <div className="text-xs text-slate-300 font-bold">
                      Progress: {st.qty_completed} / {st.target_qty} PCS ({percent}%)
                    </div>
                  </div>
                </div>

                {/* Progress Bar Lot QTY */}
                {st.target_qty > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold text-slate-400">
                      <span>Penyelesaian Target Lot:</span>
                      <span className="text-white font-bold">{st.qty_completed} dari {st.target_qty} PCS</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-white/5">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-500 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
