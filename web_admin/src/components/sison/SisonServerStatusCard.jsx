import React from 'react';
import { ShieldCheck, Check, Copy, Server } from 'lucide-react';

export default function SisonServerStatusCard({
  serverIp,
  copiedIp,
  onCopyIp
}) {
  return (
    <div className="glass-card p-6 sm:p-8 border border-white/10 rounded-3xl shadow-2xl space-y-5 flex flex-col justify-between">
      <div className="space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-white/10">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Status Jaringan & Server</h3>
            <p className="text-xs text-slate-400">Parameter port & protokol aktif</p>
          </div>
        </div>

        <div className="space-y-2.5 text-xs">
          <div className="flex justify-between items-center p-2.5 bg-black/30 rounded-xl border border-white/5">
            <span className="text-slate-400 font-medium">IP PC Kamera:</span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-bold text-emerald-400">{serverIp}</span>
              <button
                onClick={onCopyIp}
                className="text-slate-400 hover:text-white cursor-pointer"
                title="Salin IP"
              >
                {copiedIp ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
          <div className="flex justify-between p-2.5 bg-black/30 rounded-xl border border-white/5">
            <span className="text-slate-400 font-medium">Port Server:</span>
            <span className="font-mono font-bold text-emerald-400">:8000</span>
          </div>
          <div className="flex justify-between p-2.5 bg-black/30 rounded-xl border border-white/5">
            <span className="text-slate-400 font-medium">Metode Autentikasi:</span>
            <span className="font-mono font-bold text-blue-300">Bearer Token</span>
          </div>
          <div className="flex justify-between p-2.5 bg-black/30 rounded-xl border border-white/5">
            <span className="text-slate-400 font-medium">Keandalan Webhook:</span>
            <span className="font-mono font-bold text-emerald-400">Auto-Retry (3x)</span>
          </div>
          <div className="flex justify-between p-2.5 bg-black/30 rounded-xl border border-white/5">
            <span className="text-slate-400 font-medium">Format Payload:</span>
            <span className="font-mono font-bold text-amber-300">application/json</span>
          </div>
        </div>
      </div>

      {/* Rekomendasi Jaringan IT Pabrik */}
      <div className="p-3.5 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 space-y-1.5">
        <div className="font-bold flex items-center gap-1.5 text-white">
          <Server className="w-4 h-4 text-blue-400" />
          Rekomendasi IT & Jaringan
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed">
          Gunakan <strong>Static IP</strong> pada PC Kamera atau kunci <strong>DHCP Reservation (MAC Address Binding)</strong> di router agar IP tidak pernah berubah saat PC restart.
        </p>
      </div>
    </div>
  );
}
