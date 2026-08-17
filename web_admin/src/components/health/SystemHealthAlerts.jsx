import React from 'react';
import { ShieldAlert, AlertTriangle, Database } from 'lucide-react';

export default function SystemHealthAlerts({
  isCameraWarning,
  isDiskWarning,
  isBufferActive,
  camera,
  disk,
  db
}) {
  return (
    <>
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
    </>
  );
}
