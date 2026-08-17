import React from 'react';
import { Radio, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SisonHealthCard({ sison = {} }) {
  return (
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
  );
}
