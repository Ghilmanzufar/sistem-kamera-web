import React, { useState, useEffect } from 'react';
import { 
  Volume2, VolumeX, Music, Bell, ShieldAlert, Upload, 
  Play, Square, Save, RefreshCw, Check, Radio, FileAudio, 
  HelpCircle, Mic, Sparkles, Sliders
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';
import PageHeader from '../components/PageHeader';
import soundManager from '../utils/soundManager';

export default function AudioSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingCategory, setUploadingCategory] = useState(null);

  // Form State
  const [isEnabled, setIsEnabled] = useState(true);
  const [volume, setVolume] = useState(80);
  const [okSoundType, setOkSoundType] = useState('chime');
  const [okCustomUrl, setOkCustomUrl] = useState('');
  const [flipSoundType, setFlipSoundType] = useState('beep');
  const [flipCustomUrl, setFlipCustomUrl] = useState('');
  const [ngSoundType, setNgSoundType] = useState('siren');
  const [ngCustomUrl, setNgCustomUrl] = useState('');

  // Presets Data
  const [presets, setPresets] = useState({
    ok_presets: [
      { id: 'chime', name: 'Harmonic Chime (Default)', desc: 'Nada mayor 4-kord lembut & elegan' },
      { id: 'bell', name: 'Success Bell', desc: 'Lonceng cerah tanda part sukses' },
      { id: 'marimba', name: 'Marimba Melody', desc: 'Melodi perkusi cepat & jelas' },
      { id: 'voice_id', name: 'Suara Bahasa Indonesia', desc: "Ucapan: 'Part O.K., Silakan Lanjut'" },
      { id: 'custom', name: 'File Audio Kustom', desc: 'Gunakan file audio upload Anda' }
    ],
    flip_presets: [
      { id: 'beep', name: 'Dual Beep (Default)', desc: 'Nada notifikasi dua ketukan' },
      { id: 'ding', name: 'Bright Ding', desc: 'Nada pemberitahuan balik sisi part' },
      { id: 'voice_id', name: 'Suara Bahasa Indonesia', desc: "Ucapan: 'Silakan balik part ke sisi belakang'" },
      { id: 'custom', name: 'File Audio Kustom', desc: 'Gunakan file audio upload Anda' }
    ],
    ng_presets: [
      { id: 'siren', name: 'Factory Siren (Default)', desc: 'Sirene darurat industri kontinu' },
      { id: 'buzzer', name: 'Industrial Buzzer', desc: 'Buzzer frekuensi tinggi peringatan cacat' },
      { id: 'alarm', name: 'High Alert Pulse', desc: 'Alarm denyut cepat berulang' },
      { id: 'voice_id', name: 'Suara Bahasa Indonesia', desc: "Ucapan: 'Peringatan, cacat terdeteksi!'" },
      { id: 'custom', name: 'File Audio Kustom', desc: 'Gunakan file audio upload Anda' }
    ]
  });

  const fetchAudioConfig = async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/audio/config');
      if (res.data) {
        setIsEnabled(res.data.is_enabled ?? true);
        setVolume(res.data.volume ?? 80);
        setOkSoundType(res.data.ok_sound_type || 'chime');
        setOkCustomUrl(res.data.ok_custom_url || '');
        setFlipSoundType(res.data.flip_sound_type || 'beep');
        setFlipCustomUrl(res.data.flip_custom_url || '');
        setNgSoundType(res.data.ng_sound_type || 'siren');
        setNgCustomUrl(res.data.ng_custom_url || '');
        soundManager.syncConfig(res.data);
      }
    } catch (err) {
      toast.error('Gagal memuat konfigurasi audio dari server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudioConfig();
    return () => soundManager.stopNg();
  }, []);

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
        ng_custom_url: ngCustomUrl || null
      };

      const res = await api.put('/api/admin/audio/config', payload);
      soundManager.syncConfig(res.data);
      toast.success('Pengaturan audio berhasil disimpan & disinkronkan!');
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
        title="Manajemen"
        highlightTitle="Audio & Suara"
        subtitle="Atur nada notifikasi inspeksi (Part OK, Balik Part, Alarm NG) untuk speaker USB operator"
        actionButton={
          <button
            type="button"
            disabled={saving || loading}
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer disabled:opacity-50 hover:scale-105 active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Menyimpan...' : 'Simpan Pengaturan'}</span>
          </button>
        }
      />

      {/* Global Speaker & Volume Controller Card */}
      <div className="glass-card p-6 sm:p-7 border border-white/10 rounded-3xl shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 shadow-md">
              <Sliders className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white">Status Master Audio & Volume</h2>
              <p className="text-xs text-slate-400">Pengaturan global output suara ke seluruh line workstation operator</p>
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

      {/* Grid 3 Kartu Konfigurasi Nada Event: OK, Flip, NG */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 1. KARTU SUARA PART OK */}
        <div className="glass-card p-6 border-2 border-emerald-500/30 rounded-3xl shadow-xl space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
                  <Check className="w-5 h-5 stroke-[3]" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white">Suara Part OK</h3>
                  <p className="text-[11px] text-emerald-300 font-bold">Saat semua part lolos inspeksi</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleTest('ok', okSoundType, okCustomUrl)}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 cursor-pointer"
                title="Dengarkan Contoh Suara"
              >
                <Play className="w-3 h-3" />
                <span>Test</span>
              </button>
            </div>

            {/* Pilihan Preset OK */}
            <div className="space-y-2">
              <label className="block text-xs font-extrabold text-slate-300 uppercase tracking-wider">
                Pilih Preset Nada:
              </label>
              <div className="space-y-2">
                {presets.ok_presets.map((preset) => (
                  <label
                    key={preset.id}
                    className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                      okSoundType === preset.id
                        ? 'bg-emerald-950/70 border-emerald-500 text-white shadow-md'
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
                      <div className="text-[11px] text-slate-400">{preset.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Upload File Kustom jika Memilih Custom */}
            {okSoundType === 'custom' && (
              <div className="p-3 bg-slate-950/80 rounded-2xl border border-dashed border-emerald-500/40 space-y-2">
                <div className="text-xs font-bold text-emerald-300 flex items-center gap-1.5">
                  <FileAudio className="w-3.5 h-3.5" />
                  <span>File Audio Kustom (.mp3/.wav):</span>
                </div>
                {okCustomUrl && (
                  <div className="text-[11px] font-mono text-slate-300 truncate bg-slate-900 px-2.5 py-1 rounded-lg border border-white/10">
                    {okCustomUrl}
                  </div>
                )}
                <label className="flex items-center justify-center gap-2 w-full py-2 bg-emerald-700/80 hover:bg-emerald-600 text-white text-xs font-extrabold rounded-xl cursor-pointer transition-all shadow">
                  <Upload className="w-3.5 h-3.5" />
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
        <div className="glass-card p-6 border-2 border-teal-500/30 rounded-3xl shadow-xl space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-400">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white">Suara Balik Part</h3>
                  <p className="text-[11px] text-teal-300 font-bold">Saat sisi depan OK & minta balik ke rear</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleTest('flip', flipSoundType, flipCustomUrl)}
                className="px-3 py-1.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-teal-600/20 cursor-pointer"
                title="Dengarkan Contoh Suara"
              >
                <Play className="w-3 h-3" />
                <span>Test</span>
              </button>
            </div>

            {/* Pilihan Preset Flip */}
            <div className="space-y-2">
              <label className="block text-xs font-extrabold text-slate-300 uppercase tracking-wider">
                Pilih Preset Nada:
              </label>
              <div className="space-y-2">
                {presets.flip_presets.map((preset) => (
                  <label
                    key={preset.id}
                    className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                      flipSoundType === preset.id
                        ? 'bg-teal-950/70 border-teal-500 text-white shadow-md'
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
                      <div className="text-[11px] text-slate-400">{preset.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Upload File Kustom jika Memilih Custom */}
            {flipSoundType === 'custom' && (
              <div className="p-3 bg-slate-950/80 rounded-2xl border border-dashed border-teal-500/40 space-y-2">
                <div className="text-xs font-bold text-teal-300 flex items-center gap-1.5">
                  <FileAudio className="w-3.5 h-3.5" />
                  <span>File Audio Kustom (.mp3/.wav):</span>
                </div>
                {flipCustomUrl && (
                  <div className="text-[11px] font-mono text-slate-300 truncate bg-slate-900 px-2.5 py-1 rounded-lg border border-white/10">
                    {flipCustomUrl}
                  </div>
                )}
                <label className="flex items-center justify-center gap-2 w-full py-2 bg-teal-700/80 hover:bg-teal-600 text-white text-xs font-extrabold rounded-xl cursor-pointer transition-all shadow">
                  <Upload className="w-3.5 h-3.5" />
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
        <div className="glass-card p-6 border-2 border-rose-500/40 rounded-3xl shadow-xl space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-md">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-white">Suara Alarm Cacat (NG)</h3>
                  <p className="text-[11px] text-rose-300 font-bold">Saat cacat terdeteksi & popup NG aktif</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleTest('ng', ngSoundType, ngCustomUrl)}
                className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md shadow-rose-600/30 cursor-pointer"
                title="Dengarkan Contoh Suara Alarm (3 detik)"
              >
                <Play className="w-3 h-3" />
                <span>Test</span>
              </button>
            </div>

            {/* Pilihan Preset NG */}
            <div className="space-y-2">
              <label className="block text-xs font-extrabold text-slate-300 uppercase tracking-wider">
                Pilih Jenis Alarm:
              </label>
              <div className="space-y-2">
                {presets.ng_presets.map((preset) => (
                  <label
                    key={preset.id}
                    className={`flex items-start gap-3 p-3 rounded-2xl border transition-all cursor-pointer ${
                      ngSoundType === preset.id
                        ? 'bg-rose-950/80 border-rose-500 text-white shadow-md'
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
                      <div className="text-[11px] text-slate-400">{preset.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Upload File Kustom jika Memilih Custom */}
            {ngSoundType === 'custom' && (
              <div className="p-3 bg-slate-950/80 rounded-2xl border border-dashed border-rose-500/40 space-y-2">
                <div className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                  <FileAudio className="w-3.5 h-3.5" />
                  <span>File Audio Kustom (.mp3/.wav):</span>
                </div>
                {ngCustomUrl && (
                  <div className="text-[11px] font-mono text-slate-300 truncate bg-slate-900 px-2.5 py-1 rounded-lg border border-white/10">
                    {ngCustomUrl}
                  </div>
                )}
                <label className="flex items-center justify-center gap-2 w-full py-2 bg-rose-700/80 hover:bg-rose-600 text-white text-xs font-extrabold rounded-xl cursor-pointer transition-all shadow">
                  <Upload className="w-3.5 h-3.5" />
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

      </div>

      {/* Info Hardware Box */}
      <div className="p-4 sm:p-5 rounded-2xl bg-sky-950/40 border border-sky-500/30 flex items-start gap-3.5">
        <Sparkles className="w-5 h-5 text-sky-400 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 leading-relaxed">
          <strong className="text-sky-300 font-bold">Koneksi Hardware Speaker USB:</strong> Sistem suara notifikasi otomatis diarahkan ke speaker USB atau perangkat audio default Windows. Pastikan speaker tercolok dan volume pada kontrol fisik speaker dalam keadaan menyala.
        </div>
      </div>
    </div>
  );
}
