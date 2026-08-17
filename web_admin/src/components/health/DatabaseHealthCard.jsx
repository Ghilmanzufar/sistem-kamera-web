import React from 'react';
import { Database, ShieldCheck, CheckCircle2 } from 'lucide-react';

export default function DatabaseHealthCard({ db = {} }) {
  return (
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
  );
}
