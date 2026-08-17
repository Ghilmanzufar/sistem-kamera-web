import React from 'react';
import { Server, Copy } from 'lucide-react';

export default function PublicHealthApiCard({ onCopyUrl }) {
  return (
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
            onClick={onCopyUrl}
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
  );
}
