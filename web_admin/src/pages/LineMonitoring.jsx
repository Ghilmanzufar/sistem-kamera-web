import React, { useState, useEffect } from 'react';
import { 
  Tv, User, Layers, CheckCircle, AlertOctagon, Activity, 
  RefreshCw, Clock, Radio, ShieldAlert, Cpu, Eye, UserCheck, 
  Calendar, Award, CheckCircle2, XCircle, BarChart3, Laptop, Camera,
  Maximize2, X, Play
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';

export default function LineMonitoring() {
  const [monitoringData, setMonitoringData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedStation, setSelectedStation] = useState(null);
  const [snapshotTick, setSnapshotTick] = useState(Date.now());

  // Polling data telemetry stasiun tiap 1.5 detik
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
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  // Tick 1 FPS (1000ms) untuk refresh preview snapshot thumbnail (hemat bandwidth)
  useEffect(() => {
    const tickInterval = setInterval(() => {
      setSnapshotTick(Date.now());
    }, 1000);
    return () => clearInterval(tickInterval);
  }, []);

  // Tutup modal Live View dengan tombol Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedStation(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const summary = monitoringData?.summary || {
    total_stations: 0,
    active_operators: 0,
    today_total_inspections: 0,
    today_ok: 0,
    today_ng: 0,
    alarm_ng_active: false
  };

  // Hanya stasiun yang memiliki operator yang sedang login/join
  const stations = (monitoringData?.stations || []).filter(
    st => st.operator?.is_active === true && st.operator?.name && st.operator?.name !== 'Tidak Ada Operator'
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
          <span className="text-xs sm:text-sm font-semibold text-slate-400 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Snapshot 1 FPS &bull; Klik kartu untuk Live Stream 30 FPS
          </span>
        </div>

        {stations.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 2xl:grid-cols-4 gap-5">
            {stations.map((st) => {
              const isStationNg = st.ng_active || st.status === 'NG';
              const isStationRunning = st.status === 'RUNNING' || st.status === 'OK';
              const percent = st.target_qty > 0 ? Math.min(100, Math.round((st.qty_completed / st.target_qty) * 100)) : 0;

              let cardBorder = 'border-white/10 hover:border-blue-500/50';
              if (isStationNg) cardBorder = 'border-rose-500 ring-2 ring-rose-500/50 animate-pulse';
              else if (isStationRunning) cardBorder = 'border-emerald-500/50 shadow-emerald-950/20';

              const loginDateStr = st.operator?.login_time
                ? new Date(st.operator.login_time * 1000).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
                : '-';

              return (
                <div
                  key={st.id}
                  className={`glass-card p-4 sm:p-5 rounded-3xl border-2 shadow-2xl space-y-4 transition-all duration-300 flex flex-col justify-between overflow-hidden ${cardBorder}`}
                >
                  <div className="min-w-0">
                    {/* Card Header: Line Name & Live Status Badge */}
                    <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3 mb-3.5 min-w-0">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-400/20 flex items-center justify-center text-blue-400 shrink-0">
                          <Tv className="w-4 h-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="font-black text-white text-sm sm:text-base tracking-wide truncate">{st.id}</h4>
                          <p className="text-[11px] text-slate-400 truncate">{st.camera_name}</p>
                        </div>
                      </div>

                      <div className="shrink-0">
                        <StatusBadge status={st.status} />
                      </div>
                    </div>

                    {/* Video Preview Snapshot (1 FPS Mode - Ringan & Hemat Bandwidth) */}
                    <div 
                      onClick={() => setSelectedStation(st)}
                      className="group relative rounded-2xl overflow-hidden bg-slate-950 border-2 border-slate-700/60 aspect-video flex items-center justify-center shadow-lg mb-4 cursor-pointer hover:border-blue-400 transition-all"
                      title="Klik untuk membuka Live Stream 30 FPS"
                    >
                      {st.is_camera_active ? (
                        <img
                          src={`${st.snapshot_url || '/api/camera_snapshot'}?t=${snapshotTick}`}
                          alt={`Preview ${st.line_name}`}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="text-center p-4 text-slate-400 text-xs">
                          <Camera className="w-8 h-8 mx-auto mb-1.5 text-slate-500 animate-pulse" />
                          <span className="font-bold text-slate-300">Kamera Standby</span>
                        </div>
                      )}

                      {st.is_camera_active && (
                        <div className="video-badge absolute top-3 left-3 bg-black/85 px-2.5 py-1 rounded-xl border border-white/25 text-[10px] font-extrabold flex items-center gap-1.5 shadow-2xl backdrop-blur-md">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="text-slate-200 tracking-wider">
                            1 FPS PREVIEW
                          </span>
                        </div>
                      )}

                      {/* Hover Overlay Button to Open 30 FPS Stream */}
                      {st.is_camera_active && (
                        <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center backdrop-blur-xs">
                          <div className="bg-blue-600/90 hover:bg-blue-500 text-white text-xs font-black px-4 py-2 rounded-xl flex items-center gap-2 shadow-xl transform scale-95 group-hover:scale-100 transition-transform">
                            <Maximize2 className="w-4 h-4" />
                            <span>Buka Live Stream (30 FPS)</span>
                          </div>
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
            <User className="w-14 h-14 text-slate-600 mx-auto" />
            <h4 className="text-lg font-black text-slate-300">Tidak Ada Operator yang Sedang Login</h4>
            <p className="text-xs sm:text-sm text-slate-400 max-w-md mx-auto">
              Saat ini belum ada operator yang login ke stasiun inspeksi. Card stasiun kerja akan otomatis muncul saat operator join ke sistem.
            </p>
          </div>
        )}
      </div>

      {/* MODAL ON-DEMAND LIVE STREAM 30 FPS (Hanya aktif saat dibuka) */}
      {selectedStation && (
        <div 
          className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fadeIn select-none"
          onClick={() => setSelectedStation(null)}
        >
          <div 
            className="glass-card bg-slate-900/95 border-2 border-blue-500/40 rounded-3xl shadow-2xl max-w-5xl w-full p-4 sm:p-6 space-y-4 overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3 sm:pb-4 gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shrink-0">
                  <Tv className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-xl font-black text-white truncate">{selectedStation.id}</h3>
                    <StatusBadge status={selectedStation.status} />
                  </div>
                  <p className="text-xs text-slate-400 truncate">
                    {selectedStation.line_name} &bull; Operator: <strong className="text-sky-300">{selectedStation.operator?.name}</strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs font-black px-3 py-1.5 rounded-xl flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
                  <span className="hidden sm:inline">LIVE STREAM</span>
                  <span>30 FPS</span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedStation(null)}
                  className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
                  title="Tutup (ESC)"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* 30 FPS Full Live Stream Video Container */}
            <div className="relative rounded-2xl overflow-hidden bg-black border-2 border-slate-700/80 aspect-video flex items-center justify-center shadow-2xl">
              {selectedStation.is_camera_active ? (
                <img
                  src={selectedStation.video_feed_url}
                  alt={`Live Stream 30 FPS ${selectedStation.id}`}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-center p-6 text-slate-400">
                  <Camera className="w-12 h-12 mx-auto mb-2 text-slate-500 animate-pulse" />
                  <span className="font-bold text-slate-200">Kamera Tidak Aktif</span>
                </div>
              )}
            </div>

            {/* Modal Telemetry Summary Footer */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-950/60 p-3.5 rounded-2xl border border-white/5 text-xs">
              <div>
                <span className="text-slate-400 block font-bold">Part Number</span>
                <span className="font-mono font-black text-white text-sm truncate block">{selectedStation.part_no || 'STANDBY'}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-bold">Sisi Part</span>
                <span className="font-bold text-blue-300 text-sm">SISI {selectedStation.current_side}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-bold">Progress Batch</span>
                <span className="font-bold text-emerald-400 text-sm">{selectedStation.qty_completed}/{selectedStation.target_qty} PCS</span>
              </div>
              <div>
                <span className="text-slate-400 block font-bold">Mode Live</span>
                <span className="font-bold text-amber-300 text-sm">On-Demand Stream</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
