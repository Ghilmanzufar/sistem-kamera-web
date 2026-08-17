import React from 'react';
import { Activity, Camera, Zap, Database, Clock } from 'lucide-react';

export default function SystemHealthOverview({
  healthData,
  isHealthy,
  isBufferActive,
  camera,
  ai,
  db,
  uptime
}) {
  return (
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
  );
}
