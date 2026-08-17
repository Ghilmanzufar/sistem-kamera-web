import React, { useState, useEffect, useRef } from 'react';
import { Save, Bot, Sliders } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';
import PageHeader from '../components/PageHeader';
import soundManager from '../utils/soundManager';
import { audioBufferToWav } from '../components/audio/audioWavUtils';
import AiStudioTab from '../components/audio/AiStudioTab';
import AudioConfigTab from '../components/audio/AudioConfigTab';

export default function AudioSettings() {
  const [activeTab, setActiveTab] = useState('studio'); // 'studio' | 'config'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingCategory, setUploadingCategory] = useState(null);

  // Form State 4 URL Suara Notifikasi (Hanya AI & Upload File)
  const [isEnabled, setIsEnabled] = useState(true);
  const [volume, setVolume] = useState(80);
  const [okCustomUrl, setOkCustomUrl] = useState('/uploads/audio/default_ok.mp3');
  const [flipCustomUrl, setFlipCustomUrl] = useState('/uploads/audio/default_flip.mp3');
  const [ngCustomUrl, setNgCustomUrl] = useState('/uploads/audio/default_ng.mp3');
  const [finishCustomUrl, setFinishCustomUrl] = useState('/uploads/audio/default_finish.mp3');

  // AI Voice Studio State
  const [ttsText, setTtsText] = useState(
    'Part berhasil diverifikasi O.K. Seluruh label lengkap, silakan lanjutkan ke part berikutnya.'
  );
  const [ttsVoice, setTtsVoice] = useState('id-ID-GadisNeural');
  const [ttsVibe, setTtsVibe] = useState('formal');
  const [ttsCategory, setTtsCategory] = useState('ok'); // 'ok' | 'flip' | 'ng' | 'finish' | 'general'
  const [autoApplyTarget, setAutoApplyTarget] = useState(true); // Otomatis simpan & terapkan saat generate
  const [customRateOffset, setCustomRateOffset] = useState(0); // -50 to +50 %
  const [customPitchOffset, setCustomPitchOffset] = useState(0); // -20 to +20 Hz
  const [generatingTts, setGeneratingTts] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState(null);

  // Audio Player State untuk Preview Hasil AI
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [previewProgress, setPreviewProgress] = useState(0);
  const [previewDuration, setPreviewDuration] = useState(0);
  const [previewCurrentTime, setPreviewCurrentTime] = useState(0);
  const [previewPlaybackRate, setPreviewPlaybackRate] = useState(1.0);
  const previewAudioRef = useRef(null);

  // TTS Catalog from Backend
  const [ttsCatalog, setTtsCatalog] = useState({
    voices: [
      { id: 'id-ID-GadisNeural', name: 'Gadis (Wanita Indonesia)', desc: 'Suara wanita alami, artikulasi hangat, jernih, dan ramah' },
      { id: 'id-ID-ArdiNeural', name: 'Ardi (Pria Indonesia)', desc: 'Suara pria berwibawa, tegas, mantap, dan terstruktur' }
    ],
    vibes: {
      formal: { name: '🏢 Formal Industri', desc: 'Artikulasi presisi & nada instruksi standar pabrik' },
      energetic: { name: '😊 Ramah & Enerjik', desc: 'Tempo lincah dan nada ramah memotivasi' },
      warning: { name: '🚨 Tegas & Waspada', desc: 'Intonasi tegas berwibawa, cocok untuk part NG' },
      calm: { name: '🧘 Tenang & Jelas', desc: 'Tempo rileks dan artikulasi panduan santai' },
      custom: { name: '⚙️ Kustom Manual', desc: 'Kecepatan dan tinggi nada diatur bebas' }
    },
    templates: [
      {
        title: '✅ Part OK & Lanjut',
        category: 'ok',
        vibe: 'formal',
        voice: 'id-ID-GadisNeural',
        text: 'Part berhasil diverifikasi O.K. Seluruh label lengkap, silakan lanjutkan ke part berikutnya.'
      },
      {
        title: '🔄 Instruksi Balik Part (Rear)',
        category: 'flip',
        vibe: 'calm',
        voice: 'id-ID-GadisNeural',
        text: 'Sisi depan selesai dengan status O.K. Silakan balik part ke sisi belakang untuk inspeksi kedua.'
      },
      {
        title: '🚨 Peringatan Cacat (NG Alert)',
        category: 'ng',
        vibe: 'warning',
        voice: 'id-ID-ArdiNeural',
        text: 'Peringatan! Terdeteksi ketidaksesuaian atau cacat pada komponen. Segera periksa fisik part di line produksi.'
      },
      {
        title: '🏁 Seluruh Batch Selesai',
        category: 'finish',
        vibe: 'energetic',
        voice: 'id-ID-GadisNeural',
        text: 'Selamat, seluruh target kuantitas part pada nomor transaksi ini telah selesai diinspeksi dengan status O.K. Sistem kembali ke mode siaga.'
      }
    ]
  });

  const fetchAudioConfig = async () => {
    setLoading(true);
    try {
      const [cfgRes, ttsRes] = await Promise.allSettled([
        api.get('/api/audio/config'),
        api.get('/api/admin/audio/tts/voices')
      ]);

      if (cfgRes.status === 'fulfilled' && cfgRes.value.data) {
        const data = cfgRes.value.data;
        setIsEnabled(data.is_enabled ?? true);
        setVolume(data.volume ?? 80);
        setOkCustomUrl(data.ok_custom_url || '/uploads/audio/default_ok.mp3');
        setFlipCustomUrl(data.flip_custom_url || '/uploads/audio/default_flip.mp3');
        setNgCustomUrl(data.ng_custom_url || '/uploads/audio/default_ng.mp3');
        setFinishCustomUrl(data.finish_custom_url || '/uploads/audio/default_finish.mp3');
        soundManager.syncConfig(data);
      }

      if (ttsRes.status === 'fulfilled' && ttsRes.value.data) {
        setTtsCatalog(ttsRes.value.data);
      }
    } catch {
      toast.error('Gagal memuat konfigurasi audio dari server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudioConfig();
    return () => {
      soundManager.stopNg();
      const currentAudio = previewAudioRef.current;
      if (currentAudio) {
        currentAudio.pause();
      }
    };
  }, []);

  // Text analysis metrics live
  const textWords = ttsText.trim() ? ttsText.trim().split(/\s+/).length : 0;
  const textChars = ttsText.length;
  const speedMultiplier = Math.max(0.4, 1 + (customRateOffset / 100));
  const estimatedSeconds = Math.max(0.5, Math.round((textWords / (2.5 * speedMultiplier)) * 10) / 10);

  // Switch to Studio for a specific event card
  const handleGoToStudioFor = (category) => {
    const matchedTemplate = ttsCatalog.templates?.find((t) => t.category === category);
    if (matchedTemplate) {
      setTtsText(matchedTemplate.text);
      setTtsCategory(matchedTemplate.category);
      if (matchedTemplate.voice) setTtsVoice(matchedTemplate.voice);
      if (matchedTemplate.vibe) setTtsVibe(matchedTemplate.vibe);
    } else {
      setTtsCategory(category);
    }
    setAutoApplyTarget(true);
    setActiveTab('studio');
    toast.success(`Membuka AI Studio untuk target: ${category.toUpperCase()}...`, { icon: '🎙️' });
  };

  // Generate TTS Handler
  const handleGenerateTts = async () => {
    if (!ttsText.trim()) {
      return toast.error('Silakan ketik teks narasi terlebih dahulu!');
    }

    setGeneratingTts(true);
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      setIsPlayingPreview(false);
    }

    try {
      const payload = {
        text: ttsText.trim(),
        voice: ttsVoice,
        vibe: ttsVibe,
        category: ttsCategory,
        rate_offset: parseInt(customRateOffset) || 0,
        pitch_offset: parseInt(customPitchOffset) || 0
      };

      const res = await api.post('/api/admin/audio/tts/generate', payload);
      if (res.data?.status === 'success') {
        const audioData = res.data;
        setGeneratedAudio(audioData);

        // Jika autoApplyTarget aktif dan targetnya adalah ok, flip, ng, atau finish:
        // LANGSUNG SIMPAN KE DATABASE & TERAPKAN
        if (autoApplyTarget && ['ok', 'flip', 'ng', 'finish'].includes(ttsCategory)) {
          const configPayload = {
            is_enabled: isEnabled,
            volume: parseInt(volume),
            ok_sound_type: 'custom',
            ok_custom_url: ttsCategory === 'ok' ? audioData.url : okCustomUrl,
            flip_sound_type: 'custom',
            flip_custom_url: ttsCategory === 'flip' ? audioData.url : flipCustomUrl,
            ng_sound_type: 'custom',
            ng_custom_url: ttsCategory === 'ng' ? audioData.url : ngCustomUrl,
            finish_sound_type: 'custom',
            finish_custom_url: ttsCategory === 'finish' ? audioData.url : finishCustomUrl
          };

          const saveRes = await api.put('/api/admin/audio/config', configPayload);
          soundManager.syncConfig(saveRes.data);

          if (ttsCategory === 'ok') setOkCustomUrl(audioData.url);
          else if (ttsCategory === 'flip') setFlipCustomUrl(audioData.url);
          else if (ttsCategory === 'ng') setNgCustomUrl(audioData.url);
          else if (ttsCategory === 'finish') setFinishCustomUrl(audioData.url);

          const categoryNames = {
            ok: 'Part OK',
            flip: 'Balik Part',
            ng: 'Alarm Cacat NG',
            finish: 'Selesai Batch'
          };
          toast.success(
            `Suara AI berhasil digenerate & LANGSUNG TERSIMPAN sebagai Suara ${categoryNames[ttsCategory]}!`,
            { icon: '🏁', duration: 4000 }
          );
        } else {
          toast.success('Audio AI Bahasa Indonesia berhasil digenerate!', { icon: '🎙️' });
        }
        
        // Auto play audio preview
        setTimeout(() => {
          if (previewAudioRef.current) {
            previewAudioRef.current.currentTime = 0;
            previewAudioRef.current.playbackRate = previewPlaybackRate;
            previewAudioRef.current.play().catch(() => {});
            setIsPlayingPreview(true);
          }
        }, 300);
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gagal menghasilkan audio AI');
    } finally {
      setGeneratingTts(false);
    }
  };

  const handleSetPlaybackRate = (rate) => {
    setPreviewPlaybackRate(rate);
    if (previewAudioRef.current) {
      previewAudioRef.current.playbackRate = rate;
    }
    toast.success(`Kecepatan putar preview: ${rate}x`, { id: 'rate-toast' });
  };

  // Toggle Play / Pause Audio Preview
  const handleTogglePreviewPlay = () => {
    if (!previewAudioRef.current) return;
    if (isPlayingPreview) {
      previewAudioRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      previewAudioRef.current.play().catch(() => {});
      setIsPlayingPreview(true);
    }
  };

  // Download Handlers (MP3 & WAV)
  const handleDownloadMp3 = () => {
    if (!generatedAudio?.url) return;
    const a = document.createElement('a');
    a.href = generatedAudio.url;
    a.download = generatedAudio.filename || `ai_voice_${Date.now()}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success('Mengunduh file MP3...');
  };

  const handleDownloadWav = async () => {
    if (!generatedAudio?.url) return;
    try {
      toast.loading('Mengonversi audio ke format WAV...', { id: 'wav-convert' });
      const response = await fetch(generatedAudio.url);
      const arrayBuffer = await response.arrayBuffer();
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const audioCtx = new AudioCtx();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
      const wavBlob = audioBufferToWav(audioBuffer);
      
      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement('a');
      a.href = url;
      const baseName = (generatedAudio.filename || 'ai_voice').replace(/\.[^/.]+$/, '');
      a.download = `${baseName}.wav`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('File WAV berhasil diunduh!', { id: 'wav-convert' });
    } catch (err) {
      toast.error('Gagal mengonversi ke format WAV: ' + err.message, { id: 'wav-convert' });
    }
  };

  // Terapkan hasil TTS langsung ke 1 dari 4 nada notifikasi inspeksi
  const handleApplyToNotification = async (targetCategory) => {
    if (!generatedAudio?.url) return;

    try {
      const payload = {
        is_enabled: isEnabled,
        volume: parseInt(volume),
        ok_sound_type: 'custom',
        ok_custom_url: targetCategory === 'ok' ? generatedAudio.url : okCustomUrl,
        flip_sound_type: 'custom',
        flip_custom_url: targetCategory === 'flip' ? generatedAudio.url : flipCustomUrl,
        ng_sound_type: 'custom',
        ng_custom_url: targetCategory === 'ng' ? generatedAudio.url : ngCustomUrl,
        finish_sound_type: 'custom',
        finish_custom_url: targetCategory === 'finish' ? generatedAudio.url : finishCustomUrl
      };

      const res = await api.put('/api/admin/audio/config', payload);
      soundManager.syncConfig(res.data);

      if (targetCategory === 'ok') {
        setOkCustomUrl(generatedAudio.url);
        toast.success('Suara AI berhasil dijadikan suara Part OK!', { icon: '✅' });
      } else if (targetCategory === 'flip') {
        setFlipCustomUrl(generatedAudio.url);
        toast.success('Suara AI berhasil dijadikan suara Balik Part!', { icon: '🔄' });
      } else if (targetCategory === 'ng') {
        setNgCustomUrl(generatedAudio.url);
        toast.success('Suara AI berhasil dijadikan suara Alarm NG!', { icon: '🚨' });
      } else if (targetCategory === 'finish') {
        setFinishCustomUrl(generatedAudio.url);
        toast.success('Suara AI berhasil dijadikan suara Selesai Batch!', { icon: '🏁' });
      }
    } catch {
      toast.error('Gagal menerapkan audio ke konfigurasi notifikasi');
    }
  };

  // Save manual configuration
  const handleSave = async (e) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        is_enabled: isEnabled,
        volume: parseInt(volume),
        ok_sound_type: 'custom',
        ok_custom_url: okCustomUrl,
        flip_sound_type: 'custom',
        flip_custom_url: flipCustomUrl,
        ng_sound_type: 'custom',
        ng_custom_url: ngCustomUrl,
        finish_sound_type: 'custom',
        finish_custom_url: finishCustomUrl
      };

      const res = await api.put('/api/admin/audio/config', payload);
      soundManager.syncConfig(res.data);
      toast.success('4 Pengaturan suara inspeksi berhasil disimpan & disinkronkan!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gagal menyimpan konfigurasi audio');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (category, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCategory(category);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('category', category);

    try {
      const res = await api.post('/api/admin/audio/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (category === 'ok') {
        setOkCustomUrl(res.data.url);
      } else if (category === 'flip') {
        setFlipCustomUrl(res.data.url);
      } else if (category === 'ng') {
        setNgCustomUrl(res.data.url);
      } else if (category === 'finish') {
        setFinishCustomUrl(res.data.url);
      }

      // Auto save after upload
      const payload = {
        is_enabled: isEnabled,
        volume: parseInt(volume),
        ok_sound_type: 'custom',
        ok_custom_url: category === 'ok' ? res.data.url : okCustomUrl,
        flip_sound_type: 'custom',
        flip_custom_url: category === 'flip' ? res.data.url : flipCustomUrl,
        ng_sound_type: 'custom',
        ng_custom_url: category === 'ng' ? res.data.url : ngCustomUrl,
        finish_sound_type: 'custom',
        finish_custom_url: category === 'finish' ? res.data.url : finishCustomUrl
      };
      const saveRes = await api.put('/api/admin/audio/config', payload);
      soundManager.syncConfig(saveRes.data);

      toast.success(`File audio '${file.name}' berhasil diunggah dan terpasang!`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gagal mengunggah file audio');
    } finally {
      setUploadingCategory(null);
      e.target.value = '';
    }
  };

  const handleTest = (category, customUrl) => {
    soundManager.testSound(category, customUrl);
  };

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Studio Audio AI &"
        highlightTitle="Kelola Suara Inspeksi"
        subtitle="Hasilkan narasi audio AI berkualitas tinggi khas Bahasa Indonesia atau pasang file audio kustom untuk 4 event inspeksi (OK, Balik Part, Alarm NG, Selesai Batch)"
        actionButton={
          activeTab === 'config' ? (
            <button
              type="button"
              disabled={saving || loading}
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer disabled:opacity-50 hover:scale-105 active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Menyimpan...' : 'Simpan 4 Suara'}</span>
            </button>
          ) : null
        }
      />

      {/* Tab Navigasi Utama */}
      <div className="flex items-center gap-3 bg-slate-900/90 p-2 rounded-2xl border border-white/10 shadow-lg backdrop-blur-md">
        <button
          type="button"
          onClick={() => setActiveTab('studio')}
          className={`flex-1 py-3 px-5 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
            activeTab === 'studio'
              ? 'bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 text-white shadow-lg shadow-sky-600/30 scale-[1.01]'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Bot className="w-4 h-4 text-sky-300" />
          <span>🎙️ AI Voice Studio (Text to Speech)</span>
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-sky-400/20 text-sky-200 border border-sky-400/30">
            Neural AI
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('config')}
          className={`flex-1 py-3 px-5 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
            activeTab === 'config'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30 scale-[1.01]'
              : 'text-slate-400 hover:text-white hover:bg-white/5'
          }`}
        >
          <Sliders className="w-4 h-4 text-blue-300" />
          <span>🎛️ Konfigurasi 4 Suara Inspeksi</span>
        </button>
      </div>

      {/* TAB 1: AI VOICE STUDIO */}
      {activeTab === 'studio' && (
        <AiStudioTab
          autoApplyTarget={autoApplyTarget}
          setAutoApplyTarget={setAutoApplyTarget}
          ttsCategory={ttsCategory}
          setTtsCategory={setTtsCategory}
          ttsText={ttsText}
          setTtsText={setTtsText}
          textWords={textWords}
          textChars={textChars}
          estimatedSeconds={estimatedSeconds}
          ttsVoice={ttsVoice}
          setTtsVoice={setTtsVoice}
          ttsVibe={ttsVibe}
          setTtsVibe={setTtsVibe}
          ttsCatalog={ttsCatalog}
          customRateOffset={customRateOffset}
          setCustomRateOffset={setCustomRateOffset}
          customPitchOffset={customPitchOffset}
          setCustomPitchOffset={setCustomPitchOffset}
          speedMultiplier={speedMultiplier}
          generatingTts={generatingTts}
          onGenerateTts={handleGenerateTts}
          generatedAudio={generatedAudio}
          onDownloadMp3={handleDownloadMp3}
          onDownloadWav={handleDownloadWav}
          previewAudioRef={previewAudioRef}
          isPlayingPreview={isPlayingPreview}
          previewProgress={previewProgress}
          previewDuration={previewDuration}
          previewCurrentTime={previewCurrentTime}
          previewPlaybackRate={previewPlaybackRate}
          onTogglePreviewPlay={handleTogglePreviewPlay}
          onSetPlaybackRate={handleSetPlaybackRate}
          onApplyToNotification={handleApplyToNotification}
          setPreviewCurrentTime={setPreviewCurrentTime}
          setPreviewProgress={setPreviewProgress}
          setPreviewDuration={setPreviewDuration}
          setIsPlayingPreview={setIsPlayingPreview}
        />
      )}

      {/* TAB 2: KONFIGURASI 4 SUARA INSPEKSI */}
      {activeTab === 'config' && (
        <AudioConfigTab
          isEnabled={isEnabled}
          setIsEnabled={setIsEnabled}
          volume={volume}
          setVolume={setVolume}
          okCustomUrl={okCustomUrl}
          flipCustomUrl={flipCustomUrl}
          ngCustomUrl={ngCustomUrl}
          finishCustomUrl={finishCustomUrl}
          uploadingCategory={uploadingCategory}
          onTest={handleTest}
          onGoToStudio={handleGoToStudioFor}
          onFileUpload={handleFileUpload}
        />
      )}
    </div>
  );
}
