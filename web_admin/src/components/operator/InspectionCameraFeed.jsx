import React from 'react';
import { Camera } from 'lucide-react';

export default function InspectionCameraFeed({ telemetry, children }) {
  return (
    <main className="flex-1 min-h-0 w-full relative flex items-center justify-center bg-black rounded-2xl border-2 border-slate-800 shadow-2xl overflow-hidden">
      {/* Floating Hold Progress Indicator */}
      {telemetry.live_metrics?.is_stabilizing && (
        <div className="absolute top-4 left-4 z-20 px-3.5 py-2 bg-slate-950/85 border border-teal-400/60 rounded-xl backdrop-blur-md text-teal-300 shadow-2xl flex items-center gap-3 animate-fadeIn pointer-events-none">
          <div className="w-3 h-3 rounded-full bg-teal-400 animate-ping shrink-0" />
          <div>
            <div className="text-[11px] font-black uppercase tracking-wider text-teal-200">
              Memverifikasi Stabilitas ({telemetry.live_metrics.hold_progress || 0}%)
            </div>
            <div className="w-32 bg-slate-800 rounded-full h-1.5 mt-1 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-teal-400 to-emerald-400 h-full transition-all duration-100 ease-out"
                style={{ width: `${telemetry.live_metrics.hold_progress || 0}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {telemetry.is_cam_active ? (
        <img
          src="/api/video_feed"
          alt="Live Camera Inspection AI Stream"
          className="w-full h-full object-contain max-h-full max-w-full block"
        />
      ) : (
        <div className="text-center p-6">
          <Camera className="w-16 h-16 text-slate-600 mx-auto mb-3 animate-pulse" />
          <h2 className="text-2xl sm:text-3xl font-black text-slate-200">KAMERA STANDBY (OFF)</h2>
          <p className="text-sm text-slate-400 mt-2 max-w-md mx-auto font-medium">
            Kamera saat ini dimatikan dari pengaturan perangkat. Nyalakan saklar kamera untuk melihat live video stream.
          </p>
        </div>
      )}

      {children}
    </main>
  );
}
