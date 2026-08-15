/**
 * 🔊 SoundManager: Web Audio Synthesizer & Audio Notification Engine
 * Dirancang khusus untuk Kiosk Operator Industri & Manajemen Audio Admin.
 * Mendukung sintesis nada harmonik, sirene alarm kontinu, suara Bahasa Indonesia,
 * dan pemutaran file audio kustom tanpa lag / zero-latency.
 */

class SoundManager {
  constructor() {
    this.ctx = null;
    this.isEnabled = localStorage.getItem('inspection_audio_enabled') !== 'false';
    this.volume = parseFloat(localStorage.getItem('inspection_audio_volume') || '0.8');
    this.selectedDeviceId = localStorage.getItem('inspection_audio_device_id') || 'default';
    this.selectedDeviceName = localStorage.getItem('inspection_audio_device_name') || 'Default Speaker Output';
    
    // Config preset default
    this.config = {
      ok_sound_type: 'chime',
      ok_custom_url: null,
      flip_sound_type: 'beep',
      flip_custom_url: null,
      ng_sound_type: 'siren',
      ng_custom_url: null,
    };

    // Siren loop refs
    this.activeSirenOsc = null;
    this.activeSirenGain = null;
    this.activeSirenInterval = null;
    this.customAudioElem = null;

    // Listeners for UI state reactivity
    this.listeners = new Set();
  }

  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  notify() {
    this.listeners.forEach(cb => cb({
      isEnabled: this.isEnabled,
      volume: Math.round(this.volume * 100),
      selectedDeviceId: this.selectedDeviceId,
      selectedDeviceName: this.selectedDeviceName,
      config: { ...this.config }
    }));
  }

  initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
        if (this.selectedDeviceId && this.selectedDeviceId !== 'default' && this.ctx.setSinkId) {
          this.ctx.setSinkId(this.selectedDeviceId).catch(() => {});
        }
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  async setAudioOutputDevice(deviceId, deviceName = '') {
    this.selectedDeviceId = deviceId || 'default';
    if (deviceName) {
      this.selectedDeviceName = deviceName;
      localStorage.setItem('inspection_audio_device_name', deviceName);
    }
    localStorage.setItem('inspection_audio_device_id', this.selectedDeviceId);
    
    if (this.ctx && this.ctx.setSinkId) {
      try {
        await this.ctx.setSinkId(this.selectedDeviceId === 'default' ? '' : this.selectedDeviceId);
      } catch (e) {
        console.warn('Gagal setSinkId pada AudioContext:', e);
      }
    }
    if (this.customAudioElem && this.customAudioElem.setSinkId) {
      try {
        await this.customAudioElem.setSinkId(this.selectedDeviceId === 'default' ? '' : this.selectedDeviceId);
      } catch {}
    }
    this.notify();
  }

  async getBrowserAudioDevices() {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        return [];
      }
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioOutputs = devices.filter(d => d.kind === 'audiooutput');
      return audioOutputs.map((d, idx) => ({
        id: d.deviceId || String(idx),
        name: d.label || (idx === 0 ? 'Default Audio Output / Speaker' : `Speaker ${idx + 1}`),
        is_usb: (d.label || '').toLowerCase().includes('usb'),
        type: 'output'
      }));
    } catch {
      return [];
    }
  }

  setEnabled(enabled) {
    this.isEnabled = !!enabled;
    localStorage.setItem('inspection_audio_enabled', this.isEnabled ? 'true' : 'false');
    if (!this.isEnabled) {
      this.stopNg();
    }
    this.notify();
  }

  setVolume(volPercent) {
    const clamped = Math.max(0, Math.min(100, volPercent));
    this.volume = clamped / 100;
    localStorage.setItem('inspection_audio_volume', this.volume.toString());
    if (this.activeSirenGain && this.ctx) {
      this.activeSirenGain.gain.setValueAtTime(this.volume * 0.4, this.ctx.currentTime);
    }
    this.notify();
  }

  syncConfig(newConfig) {
    if (!newConfig) return;
    this.config = {
      ...this.config,
      ...newConfig
    };
    if (newConfig.is_enabled !== undefined) {
      this.isEnabled = !!newConfig.is_enabled;
    }
    if (newConfig.volume !== undefined) {
      this.volume = Math.max(0, Math.min(100, newConfig.volume)) / 100;
    }
    this.notify();
  }

  // --- 1. SINTESIS SUARA PART OK (CHIME / BELL / MARIMBA) ---
  playOk() {
    if (!this.isEnabled || this.volume <= 0) return;
    const type = this.config.ok_sound_type || 'chime';
    const customUrl = this.config.ok_custom_url;
    this.triggerOkPreset(type, customUrl);
  }

  triggerOkPreset(type, customUrl = null) {
    if (type === 'custom' && customUrl) {
      this.playCustomFile(customUrl, () => this.synthesizeChime());
      return;
    }

    if (type === 'voice_id') {
      this.speak("Part O.K., Silakan Lanjut.");
      return;
    }

    if (type === 'bell') {
      this.synthesizeBell();
      return;
    }

    if (type === 'marimba') {
      this.synthesizeMarimba();
      return;
    }

    // Default: Harmonic Chime
    this.synthesizeChime();
  }

  synthesizeChime() {
    const ctx = this.initContext();
    if (!ctx) return;

    // Arpeggio nada mayor cerah: C5 (523Hz), E5 (659Hz), G5 (784Hz), C6 (1046Hz)
    const notes = [523.25, 659.25, 783.99, 1046.50];
    const now = ctx.currentTime;

    notes.forEach((freq, idx) => {
      const startTime = now + idx * 0.08;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      // Attack & Exponential Decay lembut
      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.exponentialRampToValueAtTime(this.volume * 0.28, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.65);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.7);
    });
  }

  synthesizeBell() {
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const fundamental = 880; // A5
    const harmonics = [1, 2.01, 3.02, 4.2];
    const weights = [1, 0.4, 0.2, 0.1];

    harmonics.forEach((ratio, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(fundamental * ratio, now);

      gain.gain.setValueAtTime(this.volume * 0.25 * weights[idx], now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.9);
    });
  }

  synthesizeMarimba() {
    const ctx = this.initContext();
    if (!ctx) return;

    const notes = [783.99, 987.77, 1174.66]; // G5, B5, D6
    const now = ctx.currentTime;

    notes.forEach((freq, idx) => {
      const startTime = now + idx * 0.07;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(this.volume * 0.3, startTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.4);
    });
  }

  // --- 2. SINTESIS SUARA BALIK PART / FRONT OK (BEEP / DING) ---
  playFlip() {
    if (!this.isEnabled || this.volume <= 0) return;
    const type = this.config.flip_sound_type || 'beep';
    const customUrl = this.config.flip_custom_url;
    this.triggerFlipPreset(type, customUrl);
  }

  triggerFlipPreset(type, customUrl = null) {
    if (type === 'custom' && customUrl) {
      this.playCustomFile(customUrl, () => this.synthesizeDualBeep());
      return;
    }

    if (type === 'voice_id') {
      this.speak("Silakan balik part ke sisi belakang.");
      return;
    }

    if (type === 'ding') {
      this.synthesizeDing();
      return;
    }

    // Default: Dual Beep
    this.synthesizeDualBeep();
  }

  synthesizeDualBeep() {
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Beep 1 (659Hz) lalu Beep 2 (880Hz)
    const tones = [
      { freq: 659.25, start: 0, dur: 0.12 },
      { freq: 880.00, start: 0.15, dur: 0.20 }
    ];

    tones.forEach(t => {
      const startTime = now + t.start;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(t.freq, startTime);

      gain.gain.setValueAtTime(0.001, startTime);
      gain.gain.linearRampToValueAtTime(this.volume * 0.3, startTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + t.dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + t.dur + 0.05);
    });
  }

  synthesizeDing() {
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1046.50, now); // High C6 Ding

    gain.gain.setValueAtTime(this.volume * 0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.65);
  }

  // --- 3. SINTESIS SUARA CACAT NG (SIRENE / BUZZER / ALARM) ---
  startNg() {
    if (!this.isEnabled || this.volume <= 0) return;
    const type = this.config.ng_sound_type || 'siren';
    const customUrl = this.config.ng_custom_url;
    this.triggerNgPreset(type, customUrl);
  }

  triggerNgPreset(type, customUrl = null) {
    this.stopNg(); // Bersihkan sirene lama jika ada

    if (type === 'custom' && customUrl) {
      this.playCustomLoop(customUrl, () => this.startSirenLoop());
      return;
    }

    if (type === 'voice_id') {
      this.speak("Peringatan, cacat terdeteksi. Silakan periksa part.");
      return;
    }

    if (type === 'buzzer') {
      this.startBuzzerLoop();
      return;
    }

    if (type === 'alarm') {
      this.startAlarmPulseLoop();
      return;
    }

    // Default: Continuous Factory Siren
    this.startSirenLoop();
  }

  startSirenLoop() {
    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(800, ctx.currentTime);

      // Sweeping frequency modulation 800Hz - 1200Hz
      const now = ctx.currentTime;
      for (let i = 0; i < 90; i++) {
        osc.frequency.linearRampToValueAtTime(1200, now + i * 0.8 + 0.4);
        osc.frequency.linearRampToValueAtTime(800, now + i * 0.8 + 0.8);
      }

      gain.gain.setValueAtTime(this.volume * 0.35, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      this.activeSirenOsc = osc;
      this.activeSirenGain = gain;
    } catch (e) {
      console.warn('Start siren error:', e);
    }
  }

  startBuzzerLoop() {
    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(440, ctx.currentTime); // 440Hz harsh buzzer

      // Denyut putus-putus
      const now = ctx.currentTime;
      for (let i = 0; i < 120; i++) {
        gain.gain.setValueAtTime(this.volume * 0.35, now + i * 0.2);
        gain.gain.setValueAtTime(0.0001, now + i * 0.2 + 0.12);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      this.activeSirenOsc = osc;
      this.activeSirenGain = gain;
    } catch (e) {
      console.warn('Start buzzer error:', e);
    }
  }

  startAlarmPulseLoop() {
    try {
      const ctx = this.initContext();
      if (!ctx) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      
      // Dual tone alternating (900Hz / 1300Hz)
      const now = ctx.currentTime;
      for (let i = 0; i < 120; i++) {
        osc.frequency.setValueAtTime(900, now + i * 0.3);
        osc.frequency.setValueAtTime(1300, now + i * 0.3 + 0.15);
        gain.gain.setValueAtTime(this.volume * 0.38, now + i * 0.3);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      this.activeSirenOsc = osc;
      this.activeSirenGain = gain;
    } catch (e) {
      console.warn('Start alarm pulse error:', e);
    }
  }

  stopNg() {
    try {
      if (this.activeSirenOsc) {
        this.activeSirenOsc.stop();
        this.activeSirenOsc.disconnect();
        this.activeSirenOsc = null;
      }
      if (this.activeSirenGain) {
        this.activeSirenGain.disconnect();
        this.activeSirenGain = null;
      }
      if (this.customAudioElem) {
        this.customAudioElem.pause();
        this.customAudioElem.currentTime = 0;
        this.customAudioElem = null;
      }
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    } catch {}
  }

  // --- 4. PEMUTAR FILE KUSTOM & VOICE SYNTH ---
  playCustomFile(url, fallbackFn) {
    try {
      const audio = new Audio(url);
      audio.volume = this.volume;
      audio.play().catch(() => {
        if (fallbackFn) fallbackFn();
      });
    } catch {
      if (fallbackFn) fallbackFn();
    }
  }

  playCustomLoop(url, fallbackFn) {
    try {
      const audio = new Audio(url);
      audio.volume = this.volume;
      audio.loop = true;
      audio.play().catch(() => {
        if (fallbackFn) fallbackFn();
      });
      this.customAudioElem = audio;
    } catch {
      if (fallbackFn) fallbackFn();
    }
  }

  speak(text) {
    try {
      if (!window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'id-ID';
      utterance.rate = 1.05;
      utterance.pitch = 1.1;
      utterance.volume = this.volume;
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis error:', e);
    }
  }

  // --- 5. METHOD TEST UNTUK MODAL SETTING ---
  testSound(category, presetId, customUrl = null) {
    this.stopNg();
    if (category === 'ok') {
      this.triggerOkPreset(presetId, customUrl);
    } else if (category === 'flip') {
      this.triggerFlipPreset(presetId, customUrl);
    } else if (category === 'ng') {
      this.triggerNgPreset(presetId, customUrl);
      // Auto stop test NG setelah 3 detik
      setTimeout(() => {
        this.stopNg();
      }, 3000);
    }
  }
}

export const soundManager = new SoundManager();
export default soundManager;
