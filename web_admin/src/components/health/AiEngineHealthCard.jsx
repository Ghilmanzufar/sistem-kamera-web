import React from 'react';
import { Cpu, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function AiEngineHealthCard({ ai = {} }) {
  return (
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
  );
}
