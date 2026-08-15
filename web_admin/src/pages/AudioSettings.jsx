import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, VolumeX, Music, Bell, ShieldAlert, Upload, 
  Play, Pause, Square, Save, RefreshCw, Check, Radio, FileAudio, 
  HelpCircle, Mic, Sparkles, Sliders, Download, Layers, Bot, 
  Zap, Copy, RotateCcw, SlidersHorizontal, ArrowRight, CheckCircle2,
  Trophy, Award, Flag
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';
import PageHeader from '../components/PageHeader';
import soundManager from '../utils/soundManager';

// Helper murni untuk mengubah AudioBuffer ke format .wav (PCM 16-bit)
function audioBufferToWav(buffer) {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));
  const channels = [];
  let sample = 0;
  let offset = 0;
  let pos = 0;

  function setUint16(data) {
    out.setUint16(pos, data, true);
    pos += 2;
  }
  function setUint32(data) {
    out.setUint32(pos, data, true);
    pos += 4;
  }

  // RIFF chunk descriptor
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"

  // FMT sub-chunk
  setUint32(0x20746d66); // "fmt "
  setUint32(16); // subchunk1size (16 for PCM)
  setUint16(1); // audioFormat (1 for PCM)
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan); // byte rate
  setUint16(numOfChan * 2); // block align
  setUint16(16); // bits per sample

  // data sub-chunk
  setUint32(0x61746164); // "data"
  setUint32(length - pos - 4); // subchunk2size

  for (let i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (offset < buffer.length) {
    for (let i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      out.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([out.buffer], { type: 'audio/wav' });
}

export default function AudioSettings() {
  const [activeTab, setActiveTab] = useState('studio'); // 'studio' | 'config'
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingCategory, setUploadingCategory] = useState(null);

  // Form State 4 Konfigurasi Nada Inspeksi: OK, Flip, NG, Finish
  const [isEnabled, setIsEnabled] = useState(true);
  const [volume, setVolume] = useState(80);
  const [okSoundType, setOkSoundType] = useState('chime');
  const [okCustomUrl, setOkCustomUrl] = useState('');
  const [flipSoundType, setFlipSoundType] = useState('beep');
  const [flipCustomUrl, setFlipCustomUrl] = useState('');
  const [ngSoundType, setNgSoundType] = useState('siren');
  const [ngCustomUrl, setNgCustomUrl] = useState('');
  const [finishSoundType, setFinishSoundType] = useState('fanfare');
  const [finishCustomUrl, setFinishCustomUrl] = useState('');

  // AI Voice Studio State
  const [ttsText, setTtsText] = useState(
    'Part berhasil diverifikasi O.K. Seluruh label lengkap, silakan lanjutkan ke part berikutnya.'
  );
  const [ttsVoice, setTtsVoice] = useState('id-ID-GadisNeural');
  const [ttsVibe, setTtsVibe] = useState('formal');
  const [ttsCategory, setTtsCategory] = useState('ok'); // 'ok' | 'flip' | 'ng' | 'finish' | 'general'
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

  // Presets Data 4 Nada
  const [presets, setPresets] = useState({
    ok_presets: [
      { id: 'chime', name: 'Harmonic Chime (Default)', desc: 'Nada mayor 4-kord lembut & elegan' },
      { id: 'bell', name: 'Success Bell', desc: 'Lonceng cerah tanda part sukses' },
      { id: 'marimba', name: 'Marimba Melody', desc: 'Melodi perkusi cepat & jelas' },
      { id: 'voice_id', name: 'Suara Bahasa Indonesia', desc: "Ucapan: 'Part O.K., Silakan Lanjut'" },
      { id: 'custom', name: 'File Audio Kustom', desc: 'Gunakan file audio upload / generate AI' }
    ],
    flip_presets: [
      { id: 'beep', name: 'Dual Beep (Default)', desc: 'Nada notifikasi dua ketukan' },
      { id: 'ding', name: 'Bright Ding', desc: 'Nada pemberitahuan balik sisi part' },
      { id: 'voice_id', name: 'Suara Bahasa Indonesia', desc: "Ucapan: 'Silakan balik part ke sisi belakang'" },
      { id: 'custom', name: 'File Audio Kustom', desc: 'Gunakan file audio upload / generate AI' }
    ],
    ng_presets: [
      { id: 'siren', name: 'Factory Siren (Default)', desc: 'Sirene darurat industri kontinu' },
      { id: 'buzzer', name: 'Industrial Buzzer', desc: 'Buzzer frekuensi tinggi peringatan cacat' },
      { id: 'alarm', name: 'High Alert Pulse', desc: 'Alarm denyut cepat berulang' },
      { id: 'voice_id', name: 'Suara Bahasa Indonesia', desc: "Ucapan: 'Peringatan, cacat terdeteksi!'" },
      { id: 'custom', name: 'File Audio Kustom', desc: 'Gunakan file audio upload / generate AI' }
    ],
    finish_presets: [
      { id: 'fanfare', name: 'Harmonic Fanfare (Default)', desc: 'Melodi akor kemenangan selesai 1 nomor transaksi/batch' },
      { id: 'arpeggio', name: 'Success Arpeggio', desc: 'Rangkaian nada naik 6-akor cerah bertingkat' },
      { id: 'voice_id', name: 'Suara Bahasa Indonesia', desc: "Ucapan: 'Selamat, seluruh target part telah selesai diinspeksi'" },
      { id: 'custom', name: 'File Audio Kustom', desc: 'Gunakan file audio upload / generate AI' }
    ]
  });

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
        setOkSoundType(data.ok_sound_type || 'chime');
        setOkCustomUrl(data.ok_custom_url || '');
        setFlipSoundType(data.flip_sound_type || 'beep');
        setFlipCustomUrl(data.flip_custom_url || '');
        setNgSoundType(data.ng_sound_type || 'siren');
        setNgCustomUrl(data.ng_custom_url || '');
        setFinishSoundType(data.finish_sound_type || 'fanfare');
        setFinishCustomUrl(data.finish_custom_url || '');
        soundManager.syncConfig(data);
      }

      if (ttsRes.status === 'fulfilled' && ttsRes.value.data) {
        setTtsCatalog(ttsRes.value.data);
      }
    } catch (err) {
      toast.error('Gagal memuat konfigurasi audio dari server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudioConfig();
    return () => {
      soundManager.stopNg();
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
      }
    };
  }, []);

  // Text analysis metrics live yang otomatis merespons slider kecepatan tempo
  const textWords = ttsText.trim() ? ttsText.trim().split(/\s+/).length : 0;
  const textChars = ttsText.length;
  const speedMultiplier = Math.max(0.4, 1 + (customRateOffset / 100));
  const estimatedSeconds = Math.max(0.5, Math.round((textWords / (2.5 * speedMultiplier)) * 10) / 10);

  // Handle Template Selection
  const handleSelectTemplate = (template) => {
    setTtsText(template.text);
    setTtsCategory(template.category || 'general');
    if (template.voice) setTtsVoice(template.voice);
    if (template.vibe) setTtsVibe(template.vibe);
    toast.success(`Template '${template.title}' dimuat!`, { icon: '📝' });
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
        setGeneratedAudio(res.data);
        toast.success('Audio AI Bahasa Indonesia berhasil digenerate!', { icon: '🎙️' });
        
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
        ok_sound_type: targetCategory === 'ok' ? 'custom' : okSoundType,
        ok_custom_url: targetCategory === 'ok' ? generatedAudio.url : (okCustomUrl || null),
        flip_sound_type: targetCategory === 'flip' ? 'custom' : flipSoundType,
        flip_custom_url: targetCategory === 'flip' ? generatedAudio.url : (flipCustomUrl || null),
        ng_sound_type: targetCategory === 'ng' ? 'custom' : ngSoundType,
        ng_custom_url: targetCategory === 'ng' ? generatedAudio.url : (ngCustomUrl || null),
        finish_sound_type: targetCategory === 'finish' ? 'custom' : finishSoundType,
        finish_custom_url: targetCategory === 'finish' ? generatedAudio.url : (finishCustomUrl || null)
      };

      const res = await api.put('/api/admin/audio/config', payload);
      soundManager.syncConfig(res.data);

      if (targetCategory === 'ok') {
        setOkSoundType('custom');
        setOkCustomUrl(generatedAudio.url);
        toast.success('Suara AI berhasil dijadikan nada Part OK!', { icon: '✅' });
      } else if (targetCategory === 'flip') {
        setFlipSoundType('custom');
        setFlipCustomUrl(generatedAudio.url);
        toast.success('Suara AI berhasil dijadikan nada Balik Part!', { icon: '🔄' });
      } else if (targetCategory === 'ng') {
        setNgSoundType('custom');
        setNgCustomUrl(generatedAudio.url);
        toast.success('Suara AI berhasil dijadikan nada Alarm NG!', { icon: '🚨' });
      } else if (targetCategory === 'finish') {
        setFinishSoundType('custom');
        setFinishCustomUrl(generatedAudio.url);
        toast.success('Suara AI berhasil dijadikan nada Selesai Batch!', { icon: '🏁' });
      }
    } catch (err) {
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
        ok_sound_type: okSoundType,
        ok_custom_url: okCustomUrl || null,
        flip_sound_type: flipSoundType,
        flip_custom_url: flipCustomUrl || null,
        ng_sound_type: ngSoundType,
        ng_custom_url: ngCustomUrl || null,
        finish_sound_type: finishSoundType,
        finish_custom_url: finishCustomUrl || null
      };

      const res = await api.put('/api/admin/audio/config', payload);
      soundManager.syncConfig(res.data);
      toast.success('4 Pengaturan nada audio berhasil disimpan & disinkronkan!');
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
        setOkSoundType('custom');
        setOkCustomUrl(res.data.url);
      } else if (category === 'flip') {
        setFlipSoundType('custom');
        setFlipCustomUrl(res.data.url);
      } else if (category === 'ng') {
        setNgSoundType('custom');
        setNgCustomUrl(res.data.url);
      } else if (category === 'finish') {
        setFinishSoundType('custom');
        setFinishCustomUrl(res.data.url);
      }
      toast.success(`File audio '${file.name}' berhasil diunggah!`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gagal mengunggah file audio');
    } finally {
      setUploadingCategory(null);
      e.target.value = '';
    }
  };

  const handleTest = (category, type, customUrl) => {
    soundManager.testSound(category, type, customUrl);
  };

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title="Audio Studio &"
        highlightTitle="Pengaturan Suara"
        subtitle="Hasilkan narasi audio AI khas Bahasa Indonesia atau kelola 4 nada notifikasi inspeksi operator (OK, Balik Part, Alarm NG, Selesai Batch)"
        actionButton={
          activeTab === 'config' ? (
            <button
              type="button"
              disabled={saving || loading}
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer disabled:opacity-50 hover:scale-105 active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Menyimpan...' : 'Simpan 4 Nada'}</span>
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
          <span>🎛️ Konfigurasi 4 Nada Inspeksi</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: AI VOICE STUDIO (GENERATIVE TEXT TO SPEECH BAHASA INDONESIA)       */}
      {/* ========================================================================= */}
      {activeTab === 'studio' && (
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
                    Menghasilkan intonasi alami manusiawi dengan logat Bahasa Indonesia, artikulasi presisi, kontrol tempo, dan tanpa batasan panjang teks
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

            {/* Template Cepat Narasi */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Pilih Template Narasi Cepat (Klik untuk Mengisi):</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {ttsCatalog.templates.map((tpl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectTemplate(tpl)}
                    className="p-3 rounded-2xl bg-slate-950/70 hover:bg-slate-800/90 border border-white/10 hover:border-sky-400/40 text-left transition-all cursor-pointer group hover:scale-[1.01] active:scale-[0.99]"
                  >
                    <div className="font-extrabold text-xs text-white group-hover:text-sky-300 transition-colors flex items-center justify-between">
                      <span>{tpl.title}</span>
                      <ArrowRight className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-sky-400" />
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 font-medium">
                      "{tpl.text}"
                    </p>
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
                placeholder="Tulis kalimat apa saja dalam Bahasa Indonesia... Contoh: Part 74231 OK, silakan letakkan komponen berikutnya pada line inspeksi."
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

            {/* Baris Kontrol Mandiri: KECEPATAN TEMPO (SPEECH RATE) & TINGGI NADA (PITCH) */}
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
                onClick={handleGenerateTts}
                className="w-full py-4 px-6 bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white font-black text-sm sm:text-base rounded-2xl shadow-xl shadow-sky-600/30 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-3"
              >
                {generatingTts ? (
                  <>
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Memproses Sintesis AI Neural TTS...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    <span>🎙️ Generate Suara AI (Khas Bahasa Indonesia)</span>
                  </>
                )}
              </button>
            </div>

          </div>

          {/* ================================================================= */}
          {/* HASIL SUARA AI (LIVE PLAYER & ONE-CLICK ACTION CONTROLS)          */}
          {/* ================================================================= */}
          {generatedAudio && (
            <div className="glass-card p-6 sm:p-7 rounded-3xl border-2 border-emerald-500/40 shadow-2xl space-y-5 animate-fadeIn bg-slate-900/95">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shadow-md">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-black text-white">
                      Audio AI Berhasil Dibuat
                    </h3>
                    <p className="text-xs text-emerald-300 font-semibold">
                      Model: {generatedAudio.voice} | Vibe: {generatedAudio.vibe} | Tempo: {generatedAudio.rate || '0%'} | {generatedAudio.analysis?.word_count || 0} Kata
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadMp3}
                    className="py-2 px-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs flex items-center gap-1.5 border border-white/10 transition-all cursor-pointer shadow hover:scale-105"
                  >
                    <Download className="w-3.5 h-3.5 text-sky-400" />
                    <span>Download MP3</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadWav}
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
                    onClick={handleTogglePreviewPlay}
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
                        onClick={() => handleSetPlaybackRate(rate)}
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
                    onClick={() => handleApplyToNotification('ok')}
                    className="py-3 px-4 rounded-2xl bg-emerald-950/80 hover:bg-emerald-900 border-2 border-emerald-500/50 text-emerald-200 font-black text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
                  >
                    <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                    <span>Jadikan Nada Part OK</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyToNotification('flip')}
                    className="py-3 px-4 rounded-2xl bg-teal-950/80 hover:bg-teal-900 border-2 border-teal-500/50 text-teal-200 font-black text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
                  >
                    <RotateCcw className="w-4 h-4 text-teal-400" />
                    <span>Jadikan Nada Balik Part</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyToNotification('ng')}
                    className="py-3 px-4 rounded-2xl bg-rose-950/80 hover:bg-rose-900 border-2 border-rose-500/50 text-rose-200 font-black text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
                  >
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    <span>Jadikan Nada Alarm NG</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleApplyToNotification('finish')}
                    className="py-3 px-4 rounded-2xl bg-indigo-950/80 hover:bg-indigo-900 border-2 border-indigo-500/50 text-indigo-200 font-black text-xs transition-all shadow-md cursor-pointer flex items-center justify-center gap-2 hover:scale-105 active:scale-95"
                  >
                    <Trophy className="w-4 h-4 text-amber-400" />
                    <span>Jadikan Nada Selesai Batch</span>
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: KONFIGURASI 4 NADA & SPEAKER KIOSK OPERATOR                        */}
      {/* ========================================================================= */}
      {activeTab === 'config' && (
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
                  <p className="text-xs text-slate-400">Pengaturan global output suara ke seluruh line workstation operator (4 Event Suara Aktif)</p>
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

          {/* Grid 4 Kartu Konfigurasi Nada Event: OK, Flip, NG, Finish */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            
            {/* 1. KARTU SUARA PART OK */}
            <div className="glass-card p-5 border-2 border-emerald-500/30 rounded-3xl shadow-xl space-y-4 flex flex-col justify-between">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                      <Check className="w-4 h-4 stroke-[3]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white">1. Suara Part OK</h3>
                      <p className="text-[10px] text-emerald-300 font-bold">Saat 1 part lolos inspeksi</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTest('ok', okSoundType, okCustomUrl)}
                    className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-1 shadow cursor-pointer"
                    title="Dengarkan Contoh Suara"
                  >
                    <Play className="w-3 h-3" />
                    <span>Test</span>
                  </button>
                </div>

                {/* Pilihan Preset OK */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider">
                    Pilih Preset Nada:
                  </label>
                  <div className="space-y-1.5">
                    {presets.ok_presets.map((preset) => (
                      <label
                        key={preset.id}
                        className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                          okSoundType === preset.id
                            ? 'bg-emerald-950/70 border-emerald-500 text-white shadow-sm'
                            : 'bg-slate-900/60 border-white/5 text-slate-300 hover:bg-white/5'
                        }`}
                      >
                        <input
                          type="radio"
                          name="ok_sound_preset"
                          value={preset.id}
                          checked={okSoundType === preset.id}
                          onChange={(e) => setOkSoundType(e.target.value)}
                          className="mt-0.5 text-emerald-600 focus:ring-0 cursor-pointer"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-black text-white">{preset.name}</div>
                          <div className="text-[10px] text-slate-400 line-clamp-1">{preset.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Custom URL Display */}
                {okSoundType === 'custom' && (
                  <div className="p-2.5 bg-slate-950/80 rounded-xl border border-dashed border-emerald-500/40 space-y-1.5">
                    <div className="text-[11px] font-bold text-emerald-300 flex items-center gap-1">
                      <FileAudio className="w-3 h-3" />
                      <span>File Terpasang:</span>
                    </div>
                    {okCustomUrl ? (
                      <div className="text-[10px] font-mono text-slate-200 truncate bg-slate-900 px-2 py-1 rounded border border-white/10">
                        {okCustomUrl}
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-500 italic">Belum ada file audio kustom</div>
                    )}
                    <label className="flex items-center justify-center gap-1.5 w-full py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-extrabold rounded-lg cursor-pointer transition-all shadow">
                      <Upload className="w-3 h-3" />
                      <span>{uploadingCategory === 'ok' ? 'Mengunggah...' : 'Upload File Audio'}</span>
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={(e) => handleFileUpload('ok', e)}
                        disabled={uploadingCategory === 'ok'}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* 2. KARTU SUARA BALIK PART (FRONT OK) */}
            <div className="glass-card p-5 border-2 border-teal-500/30 rounded-3xl shadow-xl space-y-4 flex flex-col justify-between">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-400">
                      <Bell className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white">2. Suara Balik Part</h3>
                      <p className="text-[10px] text-teal-300 font-bold">Minta balik ke sisi belakang</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTest('flip', flipSoundType, flipCustomUrl)}
                    className="px-2.5 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs flex items-center gap-1 shadow cursor-pointer"
                    title="Dengarkan Contoh Suara"
                  >
                    <Play className="w-3 h-3" />
                    <span>Test</span>
                  </button>
                </div>

                {/* Pilihan Preset Flip */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider">
                    Pilih Preset Nada:
                  </label>
                  <div className="space-y-1.5">
                    {presets.flip_presets.map((preset) => (
                      <label
                        key={preset.id}
                        className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                          flipSoundType === preset.id
                            ? 'bg-teal-950/70 border-teal-500 text-white shadow-sm'
                            : 'bg-slate-900/60 border-white/5 text-slate-300 hover:bg-white/5'
                        }`}
                      >
                        <input
                          type="radio"
                          name="flip_sound_preset"
                          value={preset.id}
                          checked={flipSoundType === preset.id}
                          onChange={(e) => setFlipSoundType(e.target.value)}
                          className="mt-0.5 text-teal-600 focus:ring-0 cursor-pointer"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-black text-white">{preset.name}</div>
                          <div className="text-[10px] text-slate-400 line-clamp-1">{preset.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Custom URL Display */}
                {flipSoundType === 'custom' && (
                  <div className="p-2.5 bg-slate-950/80 rounded-xl border border-dashed border-teal-500/40 space-y-1.5">
                    <div className="text-[11px] font-bold text-teal-300 flex items-center gap-1">
                      <FileAudio className="w-3 h-3" />
                      <span>File Terpasang:</span>
                    </div>
                    {flipCustomUrl ? (
                      <div className="text-[10px] font-mono text-slate-200 truncate bg-slate-900 px-2 py-1 rounded border border-white/10">
                        {flipCustomUrl}
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-500 italic">Belum ada file audio kustom</div>
                    )}
                    <label className="flex items-center justify-center gap-1.5 w-full py-1.5 bg-teal-700 hover:bg-teal-600 text-white text-xs font-extrabold rounded-lg cursor-pointer transition-all shadow">
                      <Upload className="w-3 h-3" />
                      <span>{uploadingCategory === 'flip' ? 'Mengunggah...' : 'Upload File Audio'}</span>
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={(e) => handleFileUpload('flip', e)}
                        disabled={uploadingCategory === 'flip'}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* 3. KARTU SUARA ALARM CACAT (NG) */}
            <div className="glass-card p-5 border-2 border-rose-500/40 rounded-3xl shadow-xl space-y-4 flex flex-col justify-between">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-md">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white">3. Suara Alarm NG</h3>
                      <p className="text-[10px] text-rose-300 font-bold">Saat cacat terdeteksi & reject</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTest('ng', ngSoundType, ngCustomUrl)}
                    className="px-2.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs flex items-center gap-1 shadow cursor-pointer"
                    title="Dengarkan Contoh Suara Alarm (3 detik)"
                  >
                    <Play className="w-3 h-3" />
                    <span>Test</span>
                  </button>
                </div>

                {/* Pilihan Preset NG */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider">
                    Pilih Jenis Alarm:
                  </label>
                  <div className="space-y-1.5">
                    {presets.ng_presets.map((preset) => (
                      <label
                        key={preset.id}
                        className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                          ngSoundType === preset.id
                            ? 'bg-rose-950/80 border-rose-500 text-white shadow-sm'
                            : 'bg-slate-900/60 border-white/5 text-slate-300 hover:bg-white/5'
                        }`}
                      >
                        <input
                          type="radio"
                          name="ng_sound_preset"
                          value={preset.id}
                          checked={ngSoundType === preset.id}
                          onChange={(e) => setNgSoundType(e.target.value)}
                          className="mt-0.5 text-rose-600 focus:ring-0 cursor-pointer"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-black text-white">{preset.name}</div>
                          <div className="text-[10px] text-slate-400 line-clamp-1">{preset.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Custom URL Display */}
                {ngSoundType === 'custom' && (
                  <div className="p-2.5 bg-slate-950/80 rounded-xl border border-dashed border-rose-500/40 space-y-1.5">
                    <div className="text-[11px] font-bold text-rose-300 flex items-center gap-1">
                      <FileAudio className="w-3 h-3" />
                      <span>File Terpasang:</span>
                    </div>
                    {ngCustomUrl ? (
                      <div className="text-[10px] font-mono text-slate-200 truncate bg-slate-900 px-2 py-1 rounded border border-white/10">
                        {ngCustomUrl}
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-500 italic">Belum ada file audio kustom</div>
                    )}
                    <label className="flex items-center justify-center gap-1.5 w-full py-1.5 bg-rose-700 hover:bg-rose-600 text-white text-xs font-extrabold rounded-lg cursor-pointer transition-all shadow">
                      <Upload className="w-3 h-3" />
                      <span>{uploadingCategory === 'ng' ? 'Mengunggah...' : 'Upload File Audio'}</span>
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={(e) => handleFileUpload('ng', e)}
                        disabled={uploadingCategory === 'ng'}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>

            {/* 4. KARTU SUARA SELESAI BATCH / TARGET TERCAPAI (FINISH) */}
            <div className="glass-card p-5 border-2 border-indigo-500/40 rounded-3xl shadow-xl space-y-4 flex flex-col justify-between">
              <div className="space-y-3.5">
                <div className="flex items-center justify-between border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-amber-400 shadow-md">
                      <Trophy className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-white">4. Selesai Batch</h3>
                      <p className="text-[10px] text-indigo-300 font-bold">Saat target QTY tuntas tercapai</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTest('finish', finishSoundType, finishCustomUrl)}
                    className="px-2.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs flex items-center gap-1 shadow cursor-pointer"
                    title="Dengarkan Contoh Suara Selesai Batch"
                  >
                    <Play className="w-3 h-3" />
                    <span>Test</span>
                  </button>
                </div>

                {/* Pilihan Preset Finish */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-extrabold text-slate-300 uppercase tracking-wider">
                    Pilih Preset Nada:
                  </label>
                  <div className="space-y-1.5">
                    {presets.finish_presets.map((preset) => (
                      <label
                        key={preset.id}
                        className={`flex items-start gap-2.5 p-2.5 rounded-xl border transition-all cursor-pointer ${
                          finishSoundType === preset.id
                            ? 'bg-indigo-950/80 border-indigo-500 text-white shadow-sm'
                            : 'bg-slate-900/60 border-white/5 text-slate-300 hover:bg-white/5'
                        }`}
                      >
                        <input
                          type="radio"
                          name="finish_sound_preset"
                          value={preset.id}
                          checked={finishSoundType === preset.id}
                          onChange={(e) => setFinishSoundType(e.target.value)}
                          className="mt-0.5 text-indigo-600 focus:ring-0 cursor-pointer"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-black text-white">{preset.name}</div>
                          <div className="text-[10px] text-slate-400 line-clamp-1">{preset.desc}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Custom URL Display */}
                {finishSoundType === 'custom' && (
                  <div className="p-2.5 bg-slate-950/80 rounded-xl border border-dashed border-indigo-500/40 space-y-1.5">
                    <div className="text-[11px] font-bold text-indigo-300 flex items-center gap-1">
                      <FileAudio className="w-3 h-3" />
                      <span>File Terpasang:</span>
                    </div>
                    {finishCustomUrl ? (
                      <div className="text-[10px] font-mono text-slate-200 truncate bg-slate-900 px-2 py-1 rounded border border-white/10">
                        {finishCustomUrl}
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-500 italic">Belum ada file audio kustom</div>
                    )}
                    <label className="flex items-center justify-center gap-1.5 w-full py-1.5 bg-indigo-700 hover:bg-indigo-600 text-white text-xs font-extrabold rounded-lg cursor-pointer transition-all shadow">
                      <Upload className="w-3 h-3" />
                      <span>{uploadingCategory === 'finish' ? 'Mengunggah...' : 'Upload File Audio'}</span>
                      <input
                        type="file"
                        accept="audio/*"
                        onChange={(e) => handleFileUpload('finish', e)}
                        disabled={uploadingCategory === 'finish'}
                        className="hidden"
                      />
                    </label>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Info Hardware Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-sky-950/40 border border-sky-500/30 flex items-start gap-3.5">
            <Sparkles className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-300 leading-relaxed">
              <strong className="text-sky-300 font-bold">Koneksi Hardware Speaker USB:</strong> Sistem suara notifikasi otomatis diarahkan ke speaker USB atau perangkat audio default Windows. Pastikan speaker tercolok dan volume pada kontrol fisik speaker dalam keadaan menyala.
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
