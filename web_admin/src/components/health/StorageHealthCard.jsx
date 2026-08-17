import React from 'react';
import { HardDrive } from 'lucide-react';

export default function StorageHealthCard({
  disk = {},
  resources = {},
  isDiskWarning = false
}) {
  return (
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
  );
}
