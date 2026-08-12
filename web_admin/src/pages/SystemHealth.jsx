import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  HardDrive, 
  Database, 
  Cpu, 
  Wifi, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Copy, 
  Server, 
  ShieldCheck, 
  Zap,
  Camera,
  Video,
  Radio,
  ExternalLink,
  ShieldAlert
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import api from '../api/client';
import PageHeader from '../components/PageHeader';

export default function SystemHealth() {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHealth = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await api.get('/api/health');
      setHealthData(res.data);
    } catch (err) {
      toast.error('Gagal mengambil data telemetri status sistem');
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(() => {
      fetchHealth();
    }, 4000); // Auto-refresh setiap 4 detik
    return () => clearInterval(interval);
  }, []);

  const copyHealthUrl = () => {
    const url = `${window.location.origin}/api/health`;
    navigator.clipboard.writeText(url);
    toast.success('Endpoint URL disalin ke clipboard!');
  };

  if (loading && !healthData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] space-y-4">
        <RefreshCw className="w-10 h-10 text-blue-400 animate-spin" />
        <p className="text-sm font-semibold text-slate-300">Memuat telemetri & status sistem...</p>
      </div>
    );
  }

  const camera = healthData?.camera || {};
  const ai = healthData?.ai_engine || {};
  const db = healthData?.database || {};
  const sison = healthData?.sison || {};
  const disk = healthData?.disk_storage || {};
  const resources = healthData?.system_resources || {};
  const uptime = healthData?.uptime || {};

  const isHealthy = healthData?.status === 'HEALTHY';
  const isDiskWarning = disk.is_low_space_warning;
  const isCameraWarning = camera.is_active && !camera.is_connected;
  const isBufferActive = (db.offline_buffer_unsynced_count || 0) > 0 || db.status !== 'CONNECTED';

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <PageHeader
        title="Status"
        highlightTitle="Sistem & Health Telemetri"
        subtitle="Monitoring operasional 5 komponen kunci: Kamera Stream, Engine AI, Database & Offline Buffer, Integrasi SISON, dan Penyimpanan Server"
        actionButton={
          <button
            onClick={() => fetchHealth(true)}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 font-semibold text-sm rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-sm"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Status</span>
          </button>
        }
      />

      {/* Critical Alert Banners */}
      {isCameraWarning && (
        <div className="p-4 bg-rose-500/15 border border-rose-500/30 rounded-2xl flex items-start gap-3.5 text-rose-200 animate-pulse">
          <ShieldAlert className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-white">⚠️ Gangguan Hardware: Kamera Aktif Terputus / Tidak Terbaca!</h4>
            <p className="text-xs text-rose-200/90 leading-relaxed">
              Video stream kamera <strong>{camera.name} (Source: {camera.source})</strong> tidak merespon frame. 
              Sistem sedang mencoba auto-reconnect ({camera.reconnect_attempts || 0}x). Periksa koneksi kabel USB kamera.
            </p>
          </div>
        </div>
      )}

      {isDiskWarning && (
        <div className="p-4 bg-rose-500/15 border border-rose-500/30 rounded-2xl flex items-start gap-3.5 text-rose-200">
          <AlertTriangle className="w-6 h-6 text-rose-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-white">⚠️ Kapasitas Harddisk Kritis (&lt; 10% Tersisa)!</h4>
            <p className="text-xs text-rose-200/90 leading-relaxed">
              Sisa ruang penyimpanan hanya <strong>{disk.free_gb} GB ({disk.free_percent}%)</strong>. 
              Segera backup foto NG atau tambah kapasitas drive agar penyimpanan bukti inspeksi tidak terhenti.
            </p>
          </div>
        </div>
      )}

      {isBufferActive && (
        <div className="p-4 bg-amber-500/15 border border-amber-500/30 rounded-2xl flex items-start gap-3.5 text-amber-200">
          <Database className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-white">⏳ Mode Failover Aktif: Offline Buffer Berjalan</h4>
            <p className="text-xs text-amber-200/90 leading-relaxed">
              Terdapat <strong>{db.offline_buffer_unsynced_count} log inspeksi</strong> dalam antrean buffer SQLite lokal. 
              Data akan otomatis disinkronkan ke server PostgreSQL saat koneksi stabil (*Zero Data Loss*).
            </p>
          </div>
        </div>
      )}

      {/* Overview Metric Top Banner */}
      <div className="glass-card p-6 border border-white/10 rounded-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        
        {/* 1. Status Utama */}
        <div className="p-4 bg-black/30 border border-white/5 rounded-xl flex items-center gap-3.5">
          <div className={`p-3 rounded-xl border shrink-0 ${
            isHealthy 
              ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400' 
              : isBufferActive 
              ? 'bg-amber-500/20 border-amber-500/30 text-amber-400'
              : 'bg-rose-500/20 border-rose-500/30 text-rose-400'
          }`}>
            <Activity className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] uppercase font-bold text-slate-400 block tracking-wider">Status Server</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${isHealthy ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`}></span>
              <span className={`text-base font-black truncate ${
                isHealthy ? 'text-emerald-400' : isBufferActive ? 'text-amber-400' : 'text-rose-400'
              }`}>
                {healthData?.status || 'UNKNOWN'}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Kamera Live FPS */}
        <div className="p-4 bg-black/30 border border-white/5 rounded-xl flex items-center gap-3.5">
          <div className={`p-3 rounded-xl border shrink-0 ${
            camera.is_connected 
              ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400' 
              : 'bg-slate-500/20 border-slate-500/30 text-slate-400'
          }`}>
            <Camera className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] uppercase font-bold text-slate-400 block tracking-wider">Kamera & FPS</span>
            <span className="text-base font-black text-white font-mono mt-0.5 block truncate">
              {camera.is_connected ? `${camera.fps || 0} FPS` : (camera.is_active ? 'Reconnecting' : 'Standby')}
            </span>
          </div>
        </div>

        {/* 3. AI Inference Latency */}
        <div className="p-4 bg-black/30 border border-white/5 rounded-xl flex items-center gap-3.5">
          <div className="p-3 bg-purple-500/20 border border-purple-500/30 rounded-xl text-purple-400 shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] uppercase font-bold text-slate-400 block tracking-wider">Latensi AI</span>
            <span className="text-base font-black text-purple-300 font-mono mt-0.5 block truncate">
              {ai.inference_latency_ms ? `${ai.inference_latency_ms} ms` : 'Ready'}
            </span>
          </div>
        </div>

        {/* 4. Database & Latency */}
        <div className="p-4 bg-black/30 border border-white/5 rounded-xl flex items-center gap-3.5">
          <div className="p-3 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-400 shrink-0">
            <Database className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] uppercase font-bold text-slate-400 block tracking-wider">PostgreSQL</span>
            <span className="text-base font-black text-emerald-400 font-mono mt-0.5 block truncate">
              {db.status === 'CONNECTED' ? `${db.latency_ms}ms` : 'Offline'}
            </span>
          </div>
        </div>

        {/* 5. Uptime Server */}
        <div className="p-4 bg-black/30 border border-white/5 rounded-xl flex items-center gap-3.5">
          <div className="p-3 bg-blue-500/20 border border-blue-500/30 rounded-xl text-blue-400 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-[11px] uppercase font-bold text-slate-400 block tracking-wider">Uptime Server</span>
            <span className="text-base font-black text-white font-mono mt-0.5 block truncate">
              {uptime.human || '0s'}
            </span>
          </div>
        </div>

      </div>

      {/* Grid 5 Pilar Status Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* PILAR 1: Hardware Kamera & Video Stream */}
        <div className="glass-card p-6 border border-white/10 rounded-2xl space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-cyan-500/20 border border-cyan-500/30 rounded-xl text-cyan-400">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">1. Hardware Kamera & Video Feed</h3>
                <p className="text-xs text-slate-400">Status capture device USB, FPS, dan auto-reconnect</p>
              </div>
            </div>
            <Link 
              to="/camera" 
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold transition-colors"
            >
              <span>Atur Kamera</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
            <div className="p-3.5 bg-black/30 border border-white/5 rounded-xl">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">Status Feed</span>
              <span className={`text-sm font-bold font-mono flex items-center gap-1.5 ${
                camera.is_connected ? 'text-emerald-400' : (camera.is_active ? 'text-rose-400' : 'text-slate-400')
              }`}>
                <span className={`w-2 h-2 rounded-full ${camera.is_connected ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`}></span>
                {camera.status || 'STANDBY'}
              </span>
            </div>

            <div className="p-3.5 bg-black/30 border border-white/5 rounded-xl">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">Frame Rate (FPS)</span>
              <span className="text-sm font-bold text-cyan-300 font-mono">
                {camera.fps ? `${camera.fps} FPS` : '0 FPS'}
              </span>
            </div>

            <div className="p-3.5 bg-black/30 border border-white/5 rounded-xl">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">Source Port</span>
              <span className="text-sm font-bold text-white font-mono">
                Index [{camera.source || '0'}]
              </span>
            </div>
          </div>

          <div className="p-3.5 bg-white/5 border border-white/5 rounded-xl text-xs space-y-1.5">
            <div className="flex justify-between text-slate-300 font-medium">
              <span>Perangkat Aktif:</span>
              <strong className="text-white">{camera.name || 'USB Video Camera'}</strong>
            </div>
            <div className="flex justify-between text-slate-300 font-medium">
              <span>Total Frame Terbaca:</span>
              <strong className="text-cyan-300 font-mono">{(camera.total_frames_processed || 0).toLocaleString()} Frame</strong>
            </div>
            <div className="flex justify-between text-slate-300 font-medium">
              <span>HUD Text Terakhir:</span>
              <span className="text-amber-300 font-mono truncate max-w-[200px]">{camera.last_pesan_ui || 'Standby'}</span>
            </div>
          </div>
        </div>

        {/* PILAR 2: AI Inference Engine & Model */}
        <div className="glass-card p-6 border border-white/10 rounded-2xl space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-500/20 border border-purple-500/30 rounded-xl text-purple-400">
                <Cpu className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">2. AI Inference Engine (YOLOv8)</h3>
                <p className="text-xs text-slate-400">Kecepatan inferensi model, part number, dan in-memory cache</p>
              </div>
            </div>
            <Link 
              to="/models" 
              className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 font-semibold transition-colors"
            >
              <span>Model AI</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
            <div className="p-3.5 bg-black/30 border border-white/5 rounded-xl">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">State Inspeksi</span>
              <span className="text-sm font-bold text-purple-300 font-mono">
                {ai.system_state || 'STANDBY'}
              </span>
            </div>

            <div className="p-3.5 bg-black/30 border border-white/5 rounded-xl">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">Latensi / Frame</span>
              <span className="text-sm font-bold text-emerald-400 font-mono">
                {ai.inference_latency_ms ? `${ai.inference_latency_ms} ms` : '< 35 ms'}
              </span>
            </div>

            <div className="p-3.5 bg-black/30 border border-white/5 rounded-xl">
              <span className="text-[11px] font-semibold text-slate-400 block mb-1">Model di RAM</span>
              <span className="text-sm font-bold text-white font-mono">
                {ai.cached_models_count || 0} Model Aktif
              </span>
            </div>
          </div>

          <div className="p-3.5 bg-white/5 border border-white/5 rounded-xl text-xs space-y-1.5">
            <div className="flex justify-between text-slate-300 font-medium">
              <span>Part Number Aktif:</span>
              <strong className="text-cyan-300 font-mono">{ai.active_part_no || 'STANDBY'}</strong>
            </div>
            <div className="flex justify-between text-slate-300 font-medium">
              <span>Model Loaded (.pt):</span>
              <strong className="text-purple-300 font-mono truncate max-w-[220px]">{ai.active_model_name || 'yolov8n.pt'}</strong>
            </div>
            <div className="flex justify-between text-slate-300 font-medium">
              <span>Mode Inspeksi:</span>
              <span className="text-white font-semibold">{ai.mode || 'AI Vision (Automatic)'}</span>
            </div>
          </div>
        </div>

        {/* PILAR 3: Database & Offline Buffer Resiliency */}
        <div className="glass-card p-6 border border-white/10 rounded-2xl space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-emerald-400">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">3. Database PostgreSQL & Offline Buffer</h3>
                <p className="text-xs text-slate-400">Penyimpanan riwayat transaksi dan failover SQLite lokal</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-bold font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              Zero Data Loss
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-black/30 border border-white/5 rounded-xl">
              <span className="text-xs font-semibold text-slate-400 block mb-1">Status PostgreSQL</span>
              <span className="text-base font-bold text-emerald-400 flex items-center gap-2 font-mono">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                {db.status || 'CONNECTED'}
              </span>
              <span className="text-[11px] text-slate-400 font-mono mt-1 block">Latensi Query: {db.latency_ms || 0} ms</span>
            </div>

            <div className="p-4 bg-black/30 border border-white/5 rounded-xl">
              <span className="text-xs font-semibold text-slate-400 block mb-1">Offline Buffer Queue</span>
              <span className={`text-base font-bold font-mono ${
                (db.offline_buffer_unsynced_count || 0) > 0 ? 'text-amber-400' : 'text-white'
              }`}>
                {db.offline_buffer_unsynced_count || 0} Antrean
              </span>
              <span className="text-[11px] text-slate-400 font-sans mt-1 block">
                {(db.offline_buffer_unsynced_count || 0) === 0 ? '✅ Semua log tersinkronisasi' : '⏳ Auto-flushing ke DB...'}
              </span>
            </div>
          </div>

          <div className="p-3.5 bg-white/5 border border-white/5 rounded-xl text-xs space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-slate-200">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Proteksi Failover SQLite Otomatis</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Jika service database perusahaan mengalami kendala / restart, seluruh log inspeksi disimpan aman di file buffer lokal dan otomatis di-flush kembali saat PostgreSQL terhubung.
            </p>
          </div>
        </div>

        {/* PILAR 4: Integrasi SISON (ERP / MES Webhook) */}
        <div className="glass-card p-6 border border-white/10 rounded-2xl space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-400">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">4. Integrasi Sistem SISON (MES / ERP)</h3>
                <p className="text-xs text-slate-400">Komunikasi dua arah penerima part & pengirim hasil inspeksi</p>
              </div>
            </div>
            <Link 
              to="/sison-config" 
              className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold transition-colors"
            >
              <span>Konfigurasi SISON</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            <div className="p-3.5 bg-black/30 border border-white/5 rounded-xl space-y-1.5">
              <span className="text-[11px] font-semibold text-slate-400 block">Target Webhook Callback URL:</span>
              <span className="text-xs font-mono text-amber-300 block truncate">
                {sison.callback_url || 'http://localhost:3000/api/kamera/callback'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3.5 text-xs">
              <div className="p-3 bg-white/5 rounded-xl">
                <span className="text-slate-400 block text-[11px] mb-0.5">Pemicu Transaksi:</span>
                <strong className="text-white font-mono">POST /api/start</strong>
              </div>
              <div className="p-3 bg-white/5 rounded-xl">
                <span className="text-slate-400 block text-[11px] mb-0.5">Mekanisme Retry:</span>
                <strong className="text-emerald-400">Auto 3x + SQLite Buffer</strong>
              </div>
            </div>
          </div>
        </div>

        {/* PILAR 5: Server Resource & Storage Guard */}
        <div className="glass-card p-6 border border-white/10 rounded-2xl space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/20 border border-blue-500/30 rounded-xl text-blue-400">
                <HardDrive className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">5. Kapasitas Penyimpanan Harddisk (Storage)</h3>
                <p className="text-xs text-slate-400">Monitoring drive untuk foto cacat NG & file bobot model AI</p>
              </div>
            </div>
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold font-mono border ${
              isDiskWarning 
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' 
                : 'bg-blue-500/20 text-blue-300 border-blue-500/30'
            }`}>
              {disk.free_percent}% Tersedia
            </span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs font-mono font-semibold text-slate-300">
              <span>Terpakai: {disk.used_gb} GB ({disk.used_percent}%)</span>
              <span>Sisa: {disk.free_gb} GB ({disk.free_percent}%)</span>
            </div>
            {/* Visual Storage Progress Bar */}
            <div className="w-full h-3 bg-black/40 border border-white/10 rounded-full overflow-hidden p-0.5">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  disk.used_percent > 90 
                    ? 'bg-rose-500 shadow-lg shadow-rose-500/50' 
                    : disk.used_percent > 75 
                    ? 'bg-amber-500' 
                    : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(0, disk.used_percent || 0))}%` }}
              ></div>
            </div>
            <div className="flex justify-between text-[11px] text-slate-400 pt-1">
              <span>Total Drive: <strong className="text-white font-mono">{disk.total_gb} GB</strong></span>
              <span>Pembersihan Otomatis: <strong className="text-emerald-400">Setiap 24 Jam (&gt; 30 Hari)</strong></span>
            </div>
          </div>

          {/* Quick CPU & RAM load indicator */}
          {(resources.cpu_percent > 0 || resources.ram_percent > 0) && (
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 bg-black/30 border border-white/5 rounded-xl">
                <span className="text-[11px] text-slate-400 block mb-0.5">Beban CPU Host:</span>
                <strong className="text-sm font-mono text-cyan-300">{resources.cpu_percent}%</strong>
              </div>
              <div className="p-3 bg-black/30 border border-white/5 rounded-xl">
                <span className="text-[11px] text-slate-400 block mb-0.5">RAM Terpakai:</span>
                <strong className="text-sm font-mono text-purple-300">{resources.ram_used_gb} / {resources.ram_total_gb} GB ({resources.ram_percent}%)</strong>
              </div>
            </div>
          )}
        </div>

        {/* Public Health Check API for IT / DevOps */}
        <div className="glass-card p-6 border border-white/10 rounded-2xl space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-slate-500/20 border border-slate-500/30 rounded-xl text-slate-300">
                <Server className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">API Endpoint IT & Enterprise Monitoring</h3>
                <p className="text-xs text-slate-400">Public JSON Health Check untuk Uptime Kuma, Zabbix, PRTG, Docker</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300">
              URL Endpoint Health Check:
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={`${window.location.origin}/api/health`}
                className="w-full px-4 py-2.5 bg-black/40 border border-white/10 rounded-xl text-cyan-300 font-mono text-xs focus:outline-none"
              />
              <button
                onClick={copyHealthUrl}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer shadow-md"
              >
                <Copy className="w-4 h-4" />
                <span>Salin URL</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Endpoint ini merespon format JSON standar HTTP 200 tanpa memerlukan autentikasi Bearer Token, sehingga dapat di-probe oleh firewall atau monitoring agent internal perusahaan.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
