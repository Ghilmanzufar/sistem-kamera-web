import React, { useState, useEffect } from 'react';
import { 
  Tv, User, Layers, CheckCircle, AlertOctagon, Activity, 
  RefreshCw, Clock, Radio, ShieldAlert, Cpu, Eye, UserCheck, 
  Calendar, Award, CheckCircle2, XCircle, BarChart3, Laptop, Camera
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
    total_stations: 0,
    active_operators: 0,
    today_total_inspections: 0,
    today_ok: 0,
    today_ng: 0,
    alarm_ng_active: false
  };

  // Hanya stasiun yang benar-benar aktif (kamera live atau ada operator bertugas)
  const stations = (monitoringData?.stations || []).filter(
    st => st.is_camera_active === true || (st.operator?.is_active === true && st.operator?.name !== 'Tidak Ada Operator')
  );

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Monitoring"
        highlightTitle="Line Produksi"
        subtitle="Pantau seluruh stasiun kerja kamera inspeksi aktif secara real-time dari office"
        actionButton={
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs sm:text-sm font-extrabold text-emerald-400 bg-emerald-500/10 px-4 py-2 rounded-xl border-2 border-emerald-500/20 shadow-sm">
              LIVE MONITORING
            </span>
          </div>
        }
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Stasiun Aktif"
          value={stations.length}
          icon={Tv}
          color="blue"
        />
        <StatCard
          title="Operator Bertugas (Online)"
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

      {/* Daftar Kartu Stasiun Line Produksi yang AKTIF Saja */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
            <Radio className="w-5 h-5 text-emerald-400 animate-pulse" />
            <span>Stasiun Line Produksi Aktif ({stations.length} Stasiun)</span>
          </h3>
          <span className="text-xs sm:text-sm font-semibold text-slate-400">
            Pembaruan otomatis tiap 1.5s
          </span>
        </div>

        {stations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
                  className={`glass-card p-6 rounded-3xl border-2 shadow-2xl space-y-4 transition-all duration-300 flex flex-col justify-between ${cardBorder}`}
                >
                  <div>
                    {/* Card Header: Line Name & Live Status Badge */}
                    <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3.5 mb-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-blue-500/10 border border-blue-400/20 flex items-center justify-center text-blue-400">
                          <Tv className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-black text-white text-base sm:text-lg tracking-wide">{st.id}</h4>
                          <p className="text-xs text-slate-400 truncate max-w-[130px]">{st.camera_name}</p>
                        </div>
                      </div>

                      <StatusBadge status={st.status} />
                    </div>

                    {/* Video Live Preview Stream */}
                    <div className="relative rounded-2xl overflow-hidden bg-slate-950 border-2 border-slate-700/60 aspect-video flex items-center justify-center shadow-lg mb-4">
                      {st.is_camera_active ? (
                        <img
                          src={st.video_feed_url}
                          alt={`Live Feed ${st.line_name}`}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="text-center p-4 text-slate-400 text-xs">
                          <Camera className="w-8 h-8 mx-auto mb-1.5 text-slate-500 animate-pulse" />
                          <span className="font-bold text-slate-300">Kamera Standby</span>
                        </div>
                      )}

                      {st.is_camera_active && (
                        <div className="video-badge absolute top-3 left-3 bg-black/85 px-3 py-1.5 rounded-xl border border-white/30 text-xs font-black flex items-center gap-2 shadow-2xl backdrop-blur-md">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                          <span style={{ color: '#ffffff' }} className="text-white font-black tracking-wider text-xs">
                            LIVE STREAM
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Operator Info Box */}
                    <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-white/5 space-y-1.5 mb-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold uppercase text-slate-400 flex items-center gap-1.5">
                          <User className="w-4 h-4 text-sky-400" />
                          <span>Operator Bertugas:</span>
                        </span>
                        {st.operator?.is_active && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            Aktif
                          </span>
                        )}
                      </div>
                      <div className="text-sm sm:text-base font-black text-white truncate">
                        {st.operator?.name || 'Tidak Ada Operator'}
                      </div>
                      <div className="text-xs text-slate-400">
                        Login: <strong className="font-mono text-slate-300">{loginDateStr}</strong>
                      </div>
                    </div>

                    {/* Part Number & Progress */}
                    <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-white/5 space-y-1.5 text-xs sm:text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase text-amber-400">Part Aktif:</span>
                        <span className="text-xs font-bold text-blue-300">Sisi {st.current_side}</span>
                      </div>
                      <div className="font-mono font-black text-white text-sm sm:text-base truncate">
                        {st.part_no || 'STANDBY'}
                      </div>
                      {st.target_qty > 0 && (
                        <div className="text-xs font-bold text-slate-300 pt-1">
                          Progress: {st.qty_completed}/{st.target_qty} PCS ({percent}%)
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {st.target_qty > 0 && (
                    <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-white/5 mt-3">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-emerald-400 transition-all duration-500 rounded-full"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-card p-12 rounded-3xl border-2 border-white/10 text-center space-y-3 shadow-xl">
            <Camera className="w-14 h-14 text-slate-600 mx-auto" />
            <h4 className="text-lg font-black text-slate-300">Tidak Ada Stasiun Kerja yang Sedang Aktif</h4>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
              Saat ini belum ada kamera yang menyala atau operator yang membuka layar inspeksi. Stasiun kerja akan otomatis muncul saat stasiun line mulai beroperasi.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
