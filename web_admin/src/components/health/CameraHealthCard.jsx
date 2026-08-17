import React from 'react';
import { Video, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function CameraHealthCard({ camera = {} }) {
  return (
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
  );
}
