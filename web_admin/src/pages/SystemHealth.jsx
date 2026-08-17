import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';
import PageHeader from '../components/PageHeader';
import SystemHealthAlerts from '../components/health/SystemHealthAlerts';
import SystemHealthOverview from '../components/health/SystemHealthOverview';
import CameraHealthCard from '../components/health/CameraHealthCard';
import AiEngineHealthCard from '../components/health/AiEngineHealthCard';
import DatabaseHealthCard from '../components/health/DatabaseHealthCard';
import SisonHealthCard from '../components/health/SisonHealthCard';
import StorageHealthCard from '../components/health/StorageHealthCard';
import PublicHealthApiCard from '../components/health/PublicHealthApiCard';

export default function SystemHealth() {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHealth = async (isManual = false) => {
    if (isManual) setRefreshing(true);
    try {
      const res = await api.get('/api/health');
      setHealthData(res.data);
    } catch {
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
      <SystemHealthAlerts
        isCameraWarning={isCameraWarning}
        isDiskWarning={isDiskWarning}
        isBufferActive={isBufferActive}
        camera={camera}
        disk={disk}
        db={db}
      />

      {/* Overview Metric Top Banner */}
      <SystemHealthOverview
        healthData={healthData}
        isHealthy={isHealthy}
        isBufferActive={isBufferActive}
        camera={camera}
        ai={ai}
        db={db}
        uptime={uptime}
      />

      {/* Grid 5 Pilar Status Detail + Public Health API */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* PILAR 1: Hardware Kamera & Video Stream */}
        <CameraHealthCard camera={camera} />

        {/* PILAR 2: AI Inference Engine & Model */}
        <AiEngineHealthCard ai={ai} />

        {/* PILAR 3: Database PostgreSQL & Offline Buffer */}
        <DatabaseHealthCard db={db} />

        {/* PILAR 4: Integrasi SISON (ERP / MES Webhook) */}
        <SisonHealthCard sison={sison} />

        {/* PILAR 5: Server Resource & Storage Guard */}
        <StorageHealthCard
          disk={disk}
          resources={resources}
          isDiskWarning={isDiskWarning}
        />

        {/* Public Health Check API for IT / DevOps */}
        <PublicHealthApiCard onCopyUrl={copyHealthUrl} />
      </div>
    </div>
  );
}
