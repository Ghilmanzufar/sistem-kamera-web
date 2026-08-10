import React, { useState, useEffect } from 'react';
import { 
  Tv, User, Layers, CheckCircle, AlertOctagon, Activity, 
  RefreshCw, Clock, Radio, ShieldAlert, Cpu, Eye, UserCheck, 
  Calendar, Award, CheckCircle2, XCircle, BarChart3, Laptop
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
  const activeOpsList = monitoringData?.active_operators_list || [];

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Monitoring"
        highlightTitle="Line & Operator"
        subtitle="Pantau seluruh stasiun kerja kamera inspeksi dan operator aktif secara real-time dari office"
        actionButton={
          <div className="flex items-center gap-2">
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3.5 py-1.5 rounded-xl border border-emerald-500/20 shadow-sm">
              LIVE MONITORING
            </span>
          </div>
        }
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Stasiun Aktif"
          value={summary.total_stations}
          icon={Tv}
          color="blue"
        />
        <StatCard
          title="Operator Online (Aktif)"
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

      {/* 🌟 KOTAK KHUSUS: INFORMASI DAFTAR OPERATOR PENGGUNA KAMERA SAAT INI 🌟 */}
      <div className="glass-card p-6 sm:p-7 rounded-3xl border-2 border-blue-500/30 bg-gradient-to-br from-slate-900/95 via-slate-900/80 to-blue-950/40 shadow-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/20 border border-blue-400/40 flex items-center justify-center text-blue-400 shadow-lg shadow-blue-600/20">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg sm:text-xl font-black text-white tracking-wide flex items-center gap-2">
                <span>Informasi Operator Pengguna Kamera</span>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {activeOpsList.length} Operator Online
                </span>
              </h3>
              <p className="text-xs text-slate-400">Data profil seluruh operator yang sedang mengoperasikan sistem kamera di line produksi</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeOpsList.length > 0 ? (
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm animate-pulse">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <span>{activeOpsList.length} OPERATOR ONLINE</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-slate-800 text-slate-400 border border-white/10">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
                <span>BELUM ADA OPERATOR LOGIN</span>
              </span>
            )}
          </div>
        </div>

        {/* Daftar Operator Aktif dalam Bentuk Grid Card */}
        {activeOpsList.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {activeOpsList.map((op, idx) => {
              const loginDate = op.login_time ? new Date(op.login_time * 1000) : new Date();
              const loginStr = loginDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
              const diffMins = Math.max(0, Math.floor((Date.now() / 1000 - (op.login_time || Date.now() / 1000)) / 60));
              const durStr = diffMins >= 60 ? `${Math.floor(diffMins / 60)}j ${diffMins % 60}m` : `${diffMins} menit`;

              return (
                <div key={op.username || idx} className="bg-slate-900/90 p-4 rounded-2xl border border-white/10 space-y-3 shadow-md hover:border-blue-400/40 transition-all">
                  <div className="flex items-center justify-between border-b border-white/5 pb-2.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 font-black text-sm">
                        {op.fullname ? op.fullname.charAt(0).toUpperCase() : 'O'}
                      </div>
                      <div>
                        <span className="text-sm font-black text-white block truncate max-w-[130px]">{op.fullname || op.username}</span>
                        <span className="text-[11px] text-slate-400">@{op.username}</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                      ONLINE
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Stasiun Kerja:</span>
                      <span className="font-bold text-sky-300">Station {idx + 1}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Mulai Login:</span>
                      <span className="font-mono">{loginStr}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Durasi Kerja:</span>
                      <span className="font-bold text-amber-300">{durStr}</span>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span className="text-slate-400">Client IP:</span>
                      <span className="font-mono text-[11px] text-slate-400">{op.client_ip || '127.0.0.1'}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-black/20 p-6 rounded-2xl border border-white/5 text-center text-slate-400 text-xs">
            Saat ini belum ada operator yang membuka layar kamera di stasiun komputer mana pun.
          </div>
        )}
      </div>

      {/* Grid Dinamis Kartu Stasiun Kerja / Line Operator */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Radio className="w-4 h-4 text-blue-400 animate-pulse" />
            <span>Daftar Stasiun Line Produksi ({stations.length} Stasiun)</span>
          </h3>
          <span className="text-xs text-slate-400">
            Pembaruan otomatis tiap 1.5s
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
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
                className={`glass-card p-5 rounded-3xl border-2 shadow-2xl space-y-4 transition-all duration-300 flex flex-col justify-between ${cardBorder}`}
              >
                <div>
                  {/* Card Header: Line Name & Live Status Badge */}
                  <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-400/20 flex items-center justify-center text-blue-400">
                        <Tv className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-white text-sm tracking-wide">{st.id}</h4>
                        <p className="text-[10px] text-slate-400 truncate max-w-[120px]">{st.camera_name}</p>
                      </div>
                    </div>

                    <StatusBadge status={st.status} />
                  </div>

                  {/* Video Live Preview Stream */}
                  <div className="relative rounded-2xl overflow-hidden bg-black border border-white/10 aspect-video flex items-center justify-center shadow-inner mb-3">
                    {st.is_camera_active ? (
                      <img
                        src={st.video_feed_url}
                        alt={`Live Feed ${st.line_name}`}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="text-center p-3 text-slate-500 text-[11px]">
                        <Laptop className="w-6 h-6 mx-auto mb-1 text-slate-600" />
                        Slot Stasiun Standby
                      </div>
                    )}

                    {st.is_camera_active && (
                      <div className="absolute top-2 left-2 bg-black/70 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/10 text-[9px] font-bold text-white flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                        <span>LIVE</span>
                      </div>
                    )}
                  </div>

                  {/* Operator Info Box */}
                  <div className="bg-slate-900/80 p-3 rounded-2xl border border-white/5 space-y-1.5 mb-2.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-extrabold uppercase text-slate-400 flex items-center gap-1">
                        <User className="w-3 text-sky-400" />
                        <span>Operator:</span>
                      </span>
                      {st.operator?.is_active && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Aktif
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-black text-white truncate">
                      {st.operator?.name || 'Tidak Ada Operator'}
                    </div>
                    <div className="text-[10px] text-slate-400">
                      Login: {loginDateStr}
                    </div>
                  </div>

                  {/* Part Number & Progress */}
                  <div className="bg-slate-900/80 p-3 rounded-2xl border border-white/5 space-y-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-amber-400">Part Aktif:</span>
                      <span className="text-[10px] font-bold text-blue-300">Sisi {st.current_side}</span>
                    </div>
                    <div className="font-mono font-bold text-white text-xs truncate">
                      {st.part_no || 'STANDBY'}
                    </div>
                    {st.target_qty > 0 && (
                      <div className="text-[10px] text-slate-400 pt-1">
                        Progress: {st.qty_completed}/{st.target_qty} PCS ({percent}%)
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress Bar */}
                {st.target_qty > 0 && (
                  <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden border border-white/5 mt-2">
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
      </div>
    </div>
  );
}
