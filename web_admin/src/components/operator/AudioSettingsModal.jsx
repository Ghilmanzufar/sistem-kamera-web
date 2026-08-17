import React from 'react';
import { 
  Volume2, VolumeX, Speaker, RefreshCw, Sliders, CheckCircle2, 
  RotateCcw, ShieldAlert, Trophy, Check, X 
} from 'lucide-react';
import soundManager from '../../utils/soundManager';

export default function AudioSettingsModal({
  isOpen,
  audioState,
  audioDevices,
  scanningAudioDevices,
  onFetchOrScanAudioDevices,
  onAudioDeviceChange,
  onClose
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-lg animate-fadeIn overflow-y-auto">
      <div className="w-full max-w-2xl lg:max-w-3xl my-auto bg-slate-900/98 border-2 border-sky-500/50 rounded-3xl p-5 sm:p-7 lg:p-8 shadow-2xl shadow-sky-950/60 space-y-5 sm:space-y-6 text-slate-100 max-h-[92vh] overflow-y-auto">
        
        {/* Header Modal */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3.5 sm:gap-4">
            <div className="w-11 h-11 sm:w-13 sm:h-13 rounded-2xl bg-sky-500/20 border-2 border-sky-400 flex items-center justify-center text-sky-400 shadow-lg shadow-sky-500/30 shrink-0">
              <Volume2 className="w-6 h-6 sm:w-7 sm:h-7" />
            </div>
            <div>
              <h3 className="text-lg sm:text-2xl font-black text-white leading-tight tracking-wide">
                Pengaturan Suara & Speaker USB
              </h3>
              <p className="text-xs sm:text-sm text-sky-300 font-semibold mt-0.5">
                Pilih perangkat speaker aktif, kelola volume suara, dan uji coba nada notifikasi
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Tutup Modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* SECTION 1: PILIH & CARI PERANGKAT SPEAKER (DROPDOWN COMPACT & CLEAR) */}
        <div className="space-y-3 bg-slate-950/80 p-4 sm:p-5 rounded-2xl border border-white/10 shadow-inner">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="audio-device-select" className="flex items-center gap-2 font-black text-xs sm:text-sm text-white uppercase tracking-wider">
              <Speaker className="w-4 h-4 text-sky-400" />
              <span>PILIH PERANGKAT SPEAKER / HEADSET:</span>
            </label>
            <button
              type="button"
              onClick={() => onFetchOrScanAudioDevices(true)}
              disabled={scanningAudioDevices}
              className="py-1.5 px-3.5 rounded-xl bg-sky-600/30 hover:bg-sky-600/50 text-sky-200 border border-sky-400/40 text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105 active:scale-95 disabled:opacity-50"
              title="Pindai ulang perangkat audio (Headset / USB Speaker)"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${scanningAudioDevices ? 'animate-spin' : ''}`} />
              <span>{scanningAudioDevices ? 'Memindai...' : '🔍 Pindai Ulang'}</span>
            </button>
          </div>

          {/* Dropdown Select Box */}
          <div className="relative">
            <select
              id="audio-device-select"
              value={audioState.selectedDeviceId || 'default'}
              onChange={onAudioDeviceChange}
              className="w-full py-3.5 px-4 pr-10 bg-slate-900 border-2 border-sky-500/40 focus:border-sky-400 rounded-2xl text-white font-extrabold text-xs sm:text-sm shadow-inner appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-sky-400/30 transition-all leading-normal"
            >
              {audioDevices.map((dev, idx) => (
                <option 
                  key={dev.id || idx} 
                  value={dev.id}
                  className="bg-slate-900 text-white font-bold py-2"
                >
                  {dev.is_headset ? '🎧 ' : dev.is_usb ? '🔊 [USB] ' : '🔈 '}
                  {dev.name}
                </option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center px-4 pointer-events-none text-sky-400">
              <Sliders className="w-4 h-4" />
            </div>
          </div>

          {/* Status Banner Output Terkoneksi */}
          <div className="flex flex-wrap items-center justify-between gap-1 text-xs pt-1 px-1 text-slate-300">
            <span className="flex items-center gap-1.5 font-bold text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Output Aktif: <strong className="text-white">{audioState.selectedDeviceName || 'Default Sistem'}</strong></span>
            </span>
            <span className="text-slate-500 text-[11px] font-medium hidden sm:inline">
              Pilih Headset atau Speaker lalu klik uji suara di bawah
            </span>
          </div>
        </div>

        {/* SECTION 2: MASTER ON/OFF & VOLUME CONTROLS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
          {/* Card Master On/Mute */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-white/10 flex flex-col justify-between gap-3 shadow-inner">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {audioState.isEnabled ? (
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
                    <Volume2 className="w-5 h-5" />
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-400/40 flex items-center justify-center text-rose-400">
                    <VolumeX className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <div className="text-xs font-black text-white uppercase tracking-wide">Status Suara</div>
                  <div className="text-xs sm:text-sm font-bold text-slate-300">
                    {audioState.isEnabled ? 'Aktif (Berbunyi)' : 'Senyap / Mute'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => soundManager.setEnabled(!audioState.isEnabled)}
                className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer shadow-lg hover:scale-105 active:scale-95 ${
                  audioState.isEnabled
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                    : 'bg-rose-700 hover:bg-rose-600 text-white shadow-rose-700/30'
                }`}
              >
                {audioState.isEnabled ? '🔊 ON (AKTIF)' : '🔇 MUTE'}
              </button>
            </div>
            <p className="text-[11px] text-slate-400 font-medium leading-relaxed">
              {audioState.isEnabled 
                ? 'Speaker akan mengeluarkan bunyi notifikasi otomatis saat part OK, balik part, atau terjadi NG.' 
                : 'Semua suara notifikasi dinonaktifkan sementara.'}
            </p>
          </div>

          {/* Card Master Volume */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-white/10 space-y-3 shadow-inner">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-white uppercase tracking-wide">Level Volume Speaker</span>
              <span className="font-mono text-sky-400 font-black text-base sm:text-lg bg-sky-950 px-2.5 py-0.5 rounded-lg border border-sky-500/30">
                {audioState.volume}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={audioState.volume}
              onChange={(e) => soundManager.setVolume(parseInt(e.target.value))}
              className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
            />
            <div className="flex items-center justify-between gap-1.5 pt-1">
              {[0, 25, 50, 75, 100].map((vol) => (
                <button
                  key={vol}
                  type="button"
                  onClick={() => soundManager.setVolume(vol)}
                  className={`flex-1 py-1 rounded-lg text-[11px] font-black transition-all cursor-pointer border ${
                    audioState.volume === vol 
                      ? 'bg-sky-500 text-slate-950 border-sky-400 shadow'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-white/10'
                  }`}
                >
                  {vol}%
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* SECTION 3: UJI COBA NADA NOTIFIKASI */}
        <div className="space-y-2.5">
          <div className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
            <span>UJI COBA NADA SUARA PADA SPEAKER TERPILIH:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            <button
              type="button"
              onClick={() => soundManager.testSound('ok')}
              className="py-3 px-3 rounded-2xl bg-emerald-950/80 hover:bg-emerald-900 border-2 border-emerald-500/50 text-emerald-200 font-black text-xs sm:text-sm transition-all shadow-lg hover:shadow-emerald-500/20 cursor-pointer flex flex-col items-center gap-1 hover:scale-105 active:scale-95 text-center"
            >
              <div className="flex items-center gap-1.5 font-black text-white">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>▶ 1. Part OK</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-300">Lolos Inspeksi</span>
            </button>

            <button
              type="button"
              onClick={() => soundManager.testSound('flip')}
              className="py-3 px-3 rounded-2xl bg-teal-950/80 hover:bg-teal-900 border-2 border-teal-500/50 text-teal-200 font-black text-xs sm:text-sm transition-all shadow-lg hover:shadow-teal-500/20 cursor-pointer flex flex-col items-center gap-1 hover:scale-105 active:scale-95 text-center"
            >
              <div className="flex items-center gap-1.5 font-black text-white">
                <RotateCcw className="w-4 h-4 text-teal-400" />
                <span>▶ 2. Balik Part</span>
              </div>
              <span className="text-[10px] font-bold text-teal-300">Balik Sisi Belakang</span>
            </button>

            <button
              type="button"
              onClick={() => soundManager.testSound('ng')}
              className="py-3 px-3 rounded-2xl bg-rose-950/80 hover:bg-rose-900 border-2 border-rose-500/50 text-rose-200 font-black text-xs sm:text-sm transition-all shadow-lg hover:shadow-rose-500/20 cursor-pointer flex flex-col items-center gap-1 hover:scale-105 active:scale-95 text-center"
            >
              <div className="flex items-center gap-1.5 font-black text-white">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>🚨 3. Alarm NG</span>
              </div>
              <span className="text-[10px] font-bold text-rose-300">Peringatan Cacat</span>
            </button>

            <button
              type="button"
              onClick={() => soundManager.testSound('finish')}
              className="py-3 px-3 rounded-2xl bg-indigo-950/80 hover:bg-indigo-900 border-2 border-indigo-500/50 text-indigo-200 font-black text-xs sm:text-sm transition-all shadow-lg hover:shadow-indigo-500/20 cursor-pointer flex flex-col items-center gap-1 hover:scale-105 active:scale-95 text-center"
            >
              <div className="flex items-center gap-1.5 font-black text-white">
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>🏁 4. Selesai Batch</span>
              </div>
              <span className="text-[10px] font-bold text-indigo-300">Target Tercapai</span>
            </button>
          </div>
        </div>

        {/* SECTION 4: FOOTER ACTION */}
        <div className="pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-3.5 px-6 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-black text-xs sm:text-base rounded-2xl shadow-xl shadow-sky-600/30 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5 stroke-[3]" />
            <span>Simpan & Terapkan Pengaturan Speaker</span>
          </button>
        </div>

      </div>
    </div>
  );
}
