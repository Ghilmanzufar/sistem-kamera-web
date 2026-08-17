import React from 'react';
import { Play, FileAudio, Bot, Upload } from 'lucide-react';

export default function AudioEventCard({
  category,
  title,
  subtitle,
  icon: Icon,
  color = 'emerald',
  url,
  defaultUrl,
  uploading,
  onTest,
  onGoToStudio,
  onFileUpload
}) {
  const colorStyles = {
    emerald: {
      cardBorder: 'border-emerald-500/40',
      iconBoxBg: 'bg-emerald-500/20 border-emerald-400/30 text-emerald-400',
      subtitleText: 'text-emerald-300',
      btnTestBg: 'bg-emerald-600 hover:bg-emerald-500',
      infoBorder: 'border-emerald-500/30',
      infoText: 'text-emerald-300',
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
      uploadIconText: 'text-emerald-400',
    },
    teal: {
      cardBorder: 'border-teal-500/40',
      iconBoxBg: 'bg-teal-500/20 border-teal-400/30 text-teal-400',
      subtitleText: 'text-teal-300',
      btnTestBg: 'bg-teal-600 hover:bg-teal-500',
      infoBorder: 'border-teal-500/30',
      infoText: 'text-teal-300',
      badgeBg: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
      uploadIconText: 'text-teal-400',
    },
    rose: {
      cardBorder: 'border-rose-500/40',
      iconBoxBg: 'bg-rose-500/20 border-rose-500/40 text-rose-400 shadow-md',
      subtitleText: 'text-rose-300',
      btnTestBg: 'bg-rose-600 hover:bg-rose-500',
      infoBorder: 'border-rose-500/30',
      infoText: 'text-rose-300',
      badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
      uploadIconText: 'text-rose-400',
    },
    indigo: {
      cardBorder: 'border-indigo-500/40',
      iconBoxBg: 'bg-indigo-500/20 border-indigo-500/40 text-amber-400 shadow-md',
      subtitleText: 'text-indigo-300',
      btnTestBg: 'bg-indigo-600 hover:bg-indigo-500',
      infoBorder: 'border-indigo-500/30',
      infoText: 'text-indigo-300',
      badgeBg: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
      uploadIconText: 'text-amber-400',
    }
  }[color] || {
    cardBorder: 'border-slate-500/40',
    iconBoxBg: 'bg-slate-500/20 border-slate-400/30 text-slate-400',
    subtitleText: 'text-slate-300',
    btnTestBg: 'bg-slate-600 hover:bg-slate-500',
    infoBorder: 'border-slate-500/30',
    infoText: 'text-slate-300',
    badgeBg: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
    uploadIconText: 'text-slate-400',
  };

  return (
    <div className={`glass-card p-5 border-2 ${colorStyles.cardBorder} rounded-3xl shadow-xl space-y-4 flex flex-col justify-between`}>
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl border flex items-center justify-center ${colorStyles.iconBoxBg}`}>
              {Icon && <Icon className="w-4 h-4 stroke-[3]" />}
            </div>
            <div>
              <h3 className="text-sm font-black text-white">{title}</h3>
              <p className={`text-[10px] font-bold ${colorStyles.subtitleText}`}>{subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onTest(category, url)}
            className={`px-2.5 py-1.5 rounded-xl ${colorStyles.btnTestBg} text-white font-extrabold text-xs flex items-center gap-1 shadow cursor-pointer hover:scale-105`}
            title={category === 'ng' ? "Dengarkan File Alarm (4 Detik)" : "Dengarkan File Audio"}
          >
            <Play className="w-3 h-3" />
            <span>Test</span>
          </button>
        </div>

        {/* Status File Aktif */}
        <div className={`p-3 bg-slate-950/90 rounded-2xl border ${colorStyles.infoBorder} space-y-2 shadow-inner`}>
          <div className={`text-[11px] font-bold ${colorStyles.infoText} flex items-center justify-between`}>
            <span className="flex items-center gap-1.5">
              <FileAudio className="w-3.5 h-3.5" />
              <span>File Suara Aktif:</span>
            </span>
            <span className={`text-[9px] px-1.5 py-0.5 rounded border font-black ${colorStyles.badgeBg}`}>
              AI / AUDIO
            </span>
          </div>
          <div className="text-[11px] font-mono text-slate-200 truncate bg-slate-900 p-2 rounded-xl border border-white/10">
            {url || defaultUrl}
          </div>
        </div>

        {/* Tombol Opsi: AI Studio & Upload */}
        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={() => onGoToStudio(category)}
            className="w-full py-2 px-3 rounded-xl bg-sky-950/80 hover:bg-sky-900 border border-sky-400/50 text-sky-200 font-extrabold text-xs transition-all shadow flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02]"
          >
            <Bot className="w-3.5 h-3.5 text-sky-300" />
            <span>Buat Baru di AI Studio</span>
          </button>

          <label className="flex items-center justify-center gap-2 w-full py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-extrabold rounded-xl cursor-pointer transition-all border border-white/10 hover:scale-[1.02]">
            <Upload className={`w-3.5 h-3.5 ${colorStyles.uploadIconText}`} />
            <span>{uploading ? 'Mengunggah...' : 'Upload File Sendiri'}</span>
            <input
              type="file"
              accept="audio/*"
              onChange={(e) => onFileUpload(category, e)}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
