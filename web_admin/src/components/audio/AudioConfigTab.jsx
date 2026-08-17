import React from 'react';
import { 
  Sliders, Volume2, VolumeX, Check, RotateCcw, ShieldAlert, Trophy, Sparkles 
} from 'lucide-react';
import soundManager from '../../utils/soundManager';
import AudioEventCard from './AudioEventCard';

export default function AudioConfigTab({
  isEnabled,
  setIsEnabled,
  volume,
  setVolume,
  okCustomUrl,
  flipCustomUrl,
  ngCustomUrl,
  finishCustomUrl,
  uploadingCategory,
  onTest,
  onGoToStudio,
  onFileUpload
}) {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Global Speaker & Volume Controller Card */}
      <div className="glass-card p-6 sm:p-7 border border-white/10 rounded-3xl shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 shadow-md">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">Status Master Audio & Volume</h2>
              <p className="text-xs text-slate-400">Pengaturan global output suara ke seluruh line workstation operator (Murni Suara AI & File Upload)</p>
            </div>
          </div>

          {/* Master Toggle Switch */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => {
                const next = !isEnabled;
                setIsEnabled(next);
                soundManager.setEnabled(next);
              }}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl font-extrabold text-xs sm:text-sm transition-all shadow-md cursor-pointer ${
                isEnabled
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                  : 'bg-rose-950/60 hover:bg-rose-900 border border-rose-500/40 text-rose-300'
              }`}
            >
              {isEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span>{isEnabled ? 'SUARA SPEAKER: AKTIF' : 'SUARA SPEAKER: MUTE'}</span>
            </button>
          </div>
        </div>

        {/* Volume Range Control */}
        <div className="space-y-3 bg-slate-950/60 p-5 rounded-2xl border border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-black text-slate-200">
              <Volume2 className="w-4 h-4 text-sky-400" />
              <span>Volume Speaker Default:</span>
            </div>
            <span className="font-mono text-base font-black text-sky-400 bg-sky-950/80 px-3 py-1 rounded-xl border border-sky-400/30">
              {volume}%
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={volume}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              setVolume(val);
              soundManager.setVolume(val);
            }}
            className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
          />
          <div className="flex justify-between text-xs font-bold text-slate-500">
            <span>0% (Hening)</span>
            <span>25% (Rendah)</span>
            <span>50% (Sedang)</span>
            <span>75% (Ideal)</span>
            <span>100% (Maksimal)</span>
          </div>
        </div>
      </div>

      {/* Grid 4 Kartu Suara Event: OK, Flip, NG, Finish */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {/* 1. KARTU SUARA PART OK */}
        <AudioEventCard
          category="ok"
          title="1. Suara Part OK"
          subtitle="Saat 1 part lolos inspeksi"
          icon={Check}
          color="emerald"
          url={okCustomUrl}
          defaultUrl="/uploads/audio/default_ok.mp3"
          uploading={uploadingCategory === 'ok'}
          onTest={onTest}
          onGoToStudio={onGoToStudio}
          onFileUpload={onFileUpload}
        />

        {/* 2. KARTU SUARA BALIK PART (FRONT OK) */}
        <AudioEventCard
          category="flip"
          title="2. Suara Balik Part"
          subtitle="Minta balik ke sisi belakang"
          icon={RotateCcw}
          color="teal"
          url={flipCustomUrl}
          defaultUrl="/uploads/audio/default_flip.mp3"
          uploading={uploadingCategory === 'flip'}
          onTest={onTest}
          onGoToStudio={onGoToStudio}
          onFileUpload={onFileUpload}
        />

        {/* 3. KARTU SUARA ALARM CACAT (NG) */}
        <AudioEventCard
          category="ng"
          title="3. Suara Alarm NG"
          subtitle="Saat cacat terdeteksi & reject"
          icon={ShieldAlert}
          color="rose"
          url={ngCustomUrl}
          defaultUrl="/uploads/audio/default_ng.mp3"
          uploading={uploadingCategory === 'ng'}
          onTest={onTest}
          onGoToStudio={onGoToStudio}
          onFileUpload={onFileUpload}
        />

        {/* 4. KARTU SUARA SELESAI BATCH (FINISH) */}
        <AudioEventCard
          category="finish"
          title="4. Selesai Batch"
          subtitle="Saat target QTY tuntas tercapai"
          icon={Trophy}
          color="indigo"
          url={finishCustomUrl}
          defaultUrl="/uploads/audio/default_finish.mp3"
          uploading={uploadingCategory === 'finish'}
          onTest={onTest}
          onGoToStudio={onGoToStudio}
          onFileUpload={onFileUpload}
        />
      </div>

      {/* Info Box AI Audio System */}
      <div className="p-4 sm:p-5 rounded-2xl bg-sky-950/40 border border-sky-500/30 flex items-start gap-3.5">
        <Sparkles className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 leading-relaxed">
          <strong className="text-sky-300 font-bold">Sistem Audio Murni AI & File Upload:</strong> Sistem kini menggunakan file audio MP3/WAV beresolusi tinggi hasil generasi AI Voice Studio atau file upload Anda. Suara bawaan sintetis telah dinonaktifkan sehingga seluruh instruksi dan nada terdengar natural dengan artikulasi bahasa Indonesia yang jelas.
        </div>
      </div>
    </div>
  );
}
