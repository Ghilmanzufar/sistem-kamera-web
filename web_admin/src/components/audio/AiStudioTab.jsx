import React from 'react';
import { 
  Sparkles, Flag, FileAudio, Mic, SlidersHorizontal, Sliders, 
  RefreshCw, Check, CheckCircle2, Download, Play, Pause, Zap, 
  RotateCcw, ShieldAlert, Trophy 
} from 'lucide-react';

export default function AiStudioTab({
  autoApplyTarget,
  setAutoApplyTarget,
  ttsCategory,
  setTtsCategory,
  ttsText,
  setTtsText,
  textWords,
  textChars,
  estimatedSeconds,
  ttsVoice,
  setTtsVoice,
  ttsVibe,
  setTtsVibe,
  ttsCatalog,
  customRateOffset,
  setCustomRateOffset,
  customPitchOffset,
  setCustomPitchOffset,
  speedMultiplier,
  generatingTts,
  onGenerateTts,
  generatedAudio,
  onDownloadMp3,
  onDownloadWav,
  previewAudioRef,
  isPlayingPreview,
  previewProgress,
  previewDuration,
  previewCurrentTime,
  previewPlaybackRate,
  onTogglePreviewPlay,
  onSetPlaybackRate,
  onApplyToNotification,
  setPreviewCurrentTime,
  setPreviewProgress,
  setPreviewDuration,
  setIsPlayingPreview
}) {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Card Studio Generator Utama */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border-2 border-sky-500/30 shadow-2xl space-y-6">
        {/* Header Studio */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-sky-500/20 border-2 border-sky-400 flex items-center justify-center text-sky-400 shadow-lg shadow-sky-500/30 shrink-0">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white">
                Generator Suara AI Khas Bahasa Indonesia
              </h2>
              <p className="text-xs text-sky-300 font-semibold">
                Menghasilkan intonasi alami manusiawi dengan logat Bahasa Indonesia, artikulasi presisi, kontrol tempo, dan langsung tersimpan ke sistem inspeksi
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="px-3 py-1.5 rounded-xl bg-slate-950 border border-white/10 text-xs font-mono text-slate-300 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>Neural Engine Ready</span>
            </span>
          </div>
        </div>

        {/* Target Penugasan Suara Otomatis */}
        <div className="p-4 rounded-2xl bg-sky-950/60 border border-sky-500/30 space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-black text-white uppercase tracking-wide flex items-center gap-2">
              <Flag className="w-4 h-4 text-sky-400" />
              <span>Tujuan Penggunaan Suara (Terapkan Otomatis):</span>
            </label>
            <span className="text-[11px] font-bold text-sky-300">
              {autoApplyTarget ? '⚡ Otomatis Langsung Tersimpan' : 'Hanya Buat Audio'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'ok', label: '✅ Part OK' },
              { id: 'flip', label: '🔄 Balik Part' },
              { id: 'ng', label: '🚨 Alarm Cacat NG' },
              { id: 'finish', label: '🏁 Selesai Batch' },
            ].map((target) => (
              <button
                key={target.id}
                type="button"
                onClick={() => {
                  setTtsCategory(target.id);
                  setAutoApplyTarget(true);
                }}
                className={`py-2.5 px-3 rounded-xl border-2 font-black text-xs transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  ttsCategory === target.id
                    ? 'bg-sky-500 text-slate-950 border-sky-300 shadow-lg scale-[1.02]'
                    : 'bg-slate-900/80 text-slate-300 border-white/10 hover:bg-slate-800'
                }`}
              >
                <span>{target.label}</span>
                {ttsCategory === target.id && <Check className="w-3.5 h-3.5 stroke-[3]" />}
              </button>
            ))}
          </div>
        </div>

        {/* Input Narasi Teks (Tanpa Batas Panjang) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <FileAudio className="w-3.5 h-3.5 text-sky-400" />
              <span>Input Narasi Teks Bahasa Indonesia:</span>
            </label>
            <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
              <span>{textWords} kata</span>
              <span>|</span>
              <span>{textChars} karakter</span>
              <span>|</span>
              <span className="text-sky-400 font-bold">⏱️ ~{estimatedSeconds}s</span>
            </div>
          </div>

          <textarea
            rows={4}
            value={ttsText}
            onChange={(e) => setTtsText(e.target.value)}
            placeholder="Tulis kalimat apa saja dalam Bahasa Indonesia... Contoh: Selamat, seluruh target part telah selesai diinspeksi."
            className="w-full p-4 bg-slate-950 border-2 border-white/15 rounded-2xl text-xs sm:text-sm font-medium text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 leading-relaxed shadow-inner"
          />
        </div>

        {/* Baris Parameter: Pilihan Model Suara & Vibe */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Pilihan Model Karakter Suara */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-white/10 space-y-3">
            <label className="text-xs font-black text-white uppercase tracking-wide flex items-center gap-2">
              <Mic className="w-4 h-4 text-sky-400" />
              <span>Pilih Model Suara AI:</span>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {ttsCatalog.voices.map((v) => (
                <label
                  key={v.id}
                  className={`p-3.5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                    ttsVoice === v.id
                      ? 'border-sky-400 bg-sky-950/80 shadow-md ring-2 ring-sky-400/30'
                      : 'border-white/10 bg-slate-900/60 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="tts_voice_option"
                        value={v.id}
                        checked={ttsVoice === v.id}
                        onChange={(e) => setTtsVoice(e.target.value)}
                        className="text-sky-500 focus:ring-0 cursor-pointer"
                      />
                      <span className="font-extrabold text-xs sm:text-sm text-white">
                        {v.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 border border-sky-400/30">
                      {v.gender === 'Female' ? 'Wanita' : 'Pria'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal pl-5">
                    {v.desc}
                  </p>
                </label>
              ))}
            </div>
          </div>

          {/* Pilihan Vibe & Gaya Pembawaan Suara */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/80 border border-white/10 space-y-3">
            <label className="text-xs font-black text-white uppercase tracking-wide flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
              <span>Pilih Karakter / Vibe Suara:</span>
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(ttsCatalog.vibes).map(([key, vibeObj]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTtsVibe(key)}
                  className={`p-2.5 rounded-xl border-2 text-left transition-all cursor-pointer ${
                    ttsVibe === key
                      ? 'border-indigo-400 bg-indigo-950/90 text-white shadow-md'
                      : 'border-white/10 bg-slate-900/60 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="font-black text-xs truncate text-white">{vibeObj.name}</div>
                  <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">{vibeObj.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Baris Kontrol Mandiri: KECEPATAN TEMPO & TINGGI NADA */}
        <div className="p-5 sm:p-6 rounded-2xl bg-slate-950/80 border border-sky-500/30 space-y-4 shadow-inner">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2 font-black text-xs sm:text-sm text-white uppercase tracking-wider">
              <Sliders className="w-4 h-4 text-sky-400" />
              <span>PENGATURAN KECEPATAN TEMPO SUARA AI:</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-bold">Tempo Saat Ini:</span>
              <span className="font-mono text-xs font-black px-2.5 py-1 rounded-lg bg-sky-950 border border-sky-500/40 text-sky-300">
                {customRateOffset > 0 ? `+${customRateOffset}%` : `${customRateOffset}%`} ({speedMultiplier.toFixed(2)}x)
              </span>
            </div>
          </div>

          {/* Tombol Preset Cepat Tempo */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {[
              { label: '🐢 0.75x Lambat', val: -25 },
              { label: '🎙️ 1.0x Normal', val: 0 },
              { label: '⚡ 1.15x Lincah', val: 15 },
              { label: '🚀 1.3x Cepat', val: 30 },
              { label: '🔥 1.5x Sangat Cepat', val: 50 }
            ].map((p) => (
              <button
                key={p.val}
                type="button"
                onClick={() => setCustomRateOffset(p.val)}
                className={`py-2 px-2.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer border ${
                  customRateOffset === p.val
                    ? 'bg-sky-500 text-slate-950 border-sky-400 shadow-md font-black scale-105'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-white/10'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Slider Pengatur Tempo Presisi */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400">
              <span>-50% (Sangat Lambat)</span>
              <span className="text-sky-300 font-extrabold">Geser Slider Untuk Fine-Tuning Tempo</span>
              <span>+50% (Sangat Cepat)</span>
            </div>
            <input
              type="range"
              min="-50"
              max="50"
              step="5"
              value={customRateOffset}
              onChange={(e) => setCustomRateOffset(parseInt(e.target.value))}
              className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
            />
          </div>

          {/* Slider Tinggi Nada (Pitch) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-white/5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
              <span>Tinggi / Rendah Nada Suara (Pitch):</span>
            </div>
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <input
                type="range"
                min="-20"
                max="20"
                step="2"
                value={customPitchOffset}
                onChange={(e) => setCustomPitchOffset(parseInt(e.target.value))}
                className="flex-1 h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
              />
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-900 border border-white/10 text-indigo-300 w-16 text-center">
                {customPitchOffset > 0 ? `+${customPitchOffset}Hz` : `${customPitchOffset}Hz`}
              </span>
            </div>
          </div>
        </div>

        {/* Tombol Utama: Generate Suara AI */}
        <div className="pt-2">
          <button
            type="button"
            disabled={generatingTts || !ttsText.trim()}
            onClick={onGenerateTts}
            className="w-full py-4 px-6 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-black text-sm sm:text-base rounded-2xl shadow-xl shadow-sky-600/30 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-3"
          >
            {generatingTts ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Memproses Sintesis AI Neural TTS & Menyimpan ke Sistem...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>
                  🎙️ Generate Suara AI & Simpan ke {
                    ttsCategory === 'finish' ? 'Selesai Batch' :
                    ttsCategory === 'ok' ? 'Part OK' :
                    ttsCategory === 'flip' ? 'Balik Part' :
                    ttsCategory === 'ng' ? 'Alarm NG' : 'Sistem'
                  }
                </span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* HASIL SUARA AI (LIVE PLAYER & ONE-CLICK ACTION CONTROLS) */}
      {generatedAudio && (
        <div className="glass-card p-6 sm:p-7 rounded-3xl border-2 border-emerald-500/40 shadow-2xl space-y-5 animate-fadeIn bg-slate-900/95">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-md">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white">
                  Audio AI Berhasil Dibuat & Aktif di Sistem
                </h3>
                <p className="text-xs text-emerald-300 font-semibold">
                  Model: {generatedAudio.voice} | Vibe: {generatedAudio.vibe} | Tempo: {generatedAudio.rate || '0%'} | {generatedAudio.analysis?.word_count || 0} Kata
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onDownloadMp3}
                className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs flex items-center gap-1.5 border border-white/10 transition-all cursor-pointer shadow hover:scale-105"
              >
                <Download className="w-3.5 h-3.5 text-sky-400" />
                <span>Download MP3</span>
              </button>

              <button
                type="button"
                onClick={onDownloadWav}
                className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs flex items-center gap-1.5 border border-white/10 transition-all cursor-pointer shadow hover:scale-105"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" />
                <span>Download WAV</span>
              </button>
            </div>
          </div>

          {/* Hidden HTML5 Audio Element untuk Player Preview */}
          <audio
            ref={previewAudioRef}
            src={generatedAudio.url}
            onTimeUpdate={(e) => {
              setPreviewCurrentTime(e.target.currentTime);
              setPreviewProgress((e.target.currentTime / (e.target.duration || 1)) * 100);
            }}
            onLoadedMetadata={(e) => setPreviewDuration(e.target.duration)}
            onEnded={() => {
              setIsPlayingPreview(false);
              setPreviewProgress(0);
            }}
          />

          {/* Live Audio Waveform & Player Controls */}
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-950/90 border border-white/10 space-y-3 shadow-inner">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={onTogglePreviewPlay}
                className="w-12 h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/30 transition-all cursor-pointer hover:scale-105 shrink-0"
              >
                {isPlayingPreview ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 fill-current ml-0.5" />}
              </button>

              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-300">
                  <span className="truncate max-w-[200px] text-emerald-300">{generatedAudio.filename}</span>
                  <span>
                    {Math.floor(previewCurrentTime)}s / {Math.floor(previewDuration || generatedAudio.analysis?.estimated_duration_sec || 0)}s
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden border border-white/10">
                  <div
                    className="bg-gradient-to-r from-emerald-500 via-teal-400 to-sky-400 h-full rounded-full transition-all duration-100 ease-out"
                    style={{ width: `${previewProgress}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Kecepatan Putar Player Preview Switcher */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10 text-xs">
              <span className="text-slate-400 font-bold flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-sky-400" />
                <span>Kecepatan Putar Preview:</span>
              </span>
              <div className="flex items-center gap-1.5">
                {[0.75, 1.0, 1.25, 1.5, 2.0].map((rate) => (
                  <button
                    key={rate}
                    type="button"
                    onClick={() => onSetPlaybackRate(rate)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all cursor-pointer border ${
                      previewPlaybackRate === rate
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow font-black'
                        : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-white/10'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Bar: Terapkan Langsung ke 4 Nada Notifikasi Inspeksi */}
          <div className="space-y-2 pt-1">
            <div className="text-xs font-black uppercase text-slate-300 tracking-wide flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Pasang Suara Ini Langsung ke Sistem Notifikasi Kiosk Operator:</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <button
                type="button"
                onClick={() => onApplyToNotification('ok')}
                className="py-3 px-4 rounded-2xl bg-emerald-950/80 hover:bg-emerald-900 border-2 border-emerald-500/50 text-emerald-200 font-black text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
              >
                <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                <span>Jadikan Suara Part OK</span>
              </button>

              <button
                type="button"
                onClick={() => onApplyToNotification('flip')}
                className="py-3 px-4 rounded-2xl bg-teal-950/80 hover:bg-teal-900 border-2 border-teal-500/50 text-teal-200 font-black text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
              >
                <RotateCcw className="w-4 h-4 text-teal-400" />
                <span>Jadikan Suara Balik Part</span>
              </button>

              <button
                type="button"
                onClick={() => onApplyToNotification('ng')}
                className="py-3 px-4 rounded-2xl bg-rose-950/80 hover:bg-rose-900 border-2 border-rose-500/50 text-rose-200 font-black text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
              >
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                <span>Jadikan Suara Alarm NG</span>
              </button>

              <button
                type="button"
                onClick={() => onApplyToNotification('finish')}
                className="py-3 px-4 rounded-2xl bg-indigo-950/80 hover:bg-indigo-900 border-2 border-indigo-500/50 text-indigo-200 font-black text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
              >
                <Trophy className="w-4 h-4 text-amber-400" />
                <span>Jadikan Suara Selesai Batch</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
