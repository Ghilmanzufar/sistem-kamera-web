import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Camera, CheckCircle2, XCircle, Play, History, LogOut, 
  AlertTriangle, RotateCcw, Send, Check, X, ShieldAlert, 
  Layers, User, Clock, Eye
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';

export default function OperatorInspection() {
  const navigate = useNavigate();

  // State Telemetry
  const [telemetry, setTelemetry] = useState({
    status: 'STANDBY',
    id_trans: '',
    p_no: '',
    qty_remaining: 0,
    target_qty: 0,
    qty_completed: 0,
    current_side: 'FRONT',
    inspection_mode: 'AI',
    pesan_ui: 'STANDBY',
    is_cam_active: true,
    reconnect_attempts: 0,
    operator: {
      name: localStorage.getItem('operator_name') || 'Operator',
      username: localStorage.getItem('username') || '',
      role: localStorage.getItem('user_role') || 'operator',
      login_time: Date.now() / 1000
    },
    popups: {
      part_ok: false,
      flip_part: false,
      ng_active: false,
      ng_image_url: '',
      details: {}
    }
  });

  // Modal States
  const [showPartOkModal, setShowPartOkModal] = useState(false);
  const [showFlipModal, setShowFlipModal] = useState(false);
  const [showNgModal, setShowNgModal] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);

  // Form NG Verification
  const [ngSupervisorUsername, setNgSupervisorUsername] = useState('');
  const [ngSupervisorPin, setNgSupervisorPin] = useState('');
  const [ngResolving, setNgResolving] = useState(false);
  const [ngError, setNgError] = useState('');

  // Demo SISON JSON Form
  const [demoJson, setDemoJson] = useState(() => {
    const timestamp = Math.floor(Date.now() / 1000);
    return JSON.stringify({
      id_trans: `DEMO-${timestamp}`,
      lot: `LOT-${Math.floor(1000 + Math.random() * 9000)}`,
      p_no: '74231-0K550-00',
      unique_no: `UNQ-${Math.floor(1000 + Math.random() * 9000)}`,
      p_name: 'Demo Part Component',
      qty: 1
    }, null, 2);
  });
  const [sendingDemo, setSendingDemo] = useState(false);

  // Web Audio Synth Siren reference
  const sirenOscillatorRef = useRef(null);
  const sirenGainRef = useRef(null);
  const audioCtxRef = useRef(null);

  // 1. Sinkronisasi Real-Time via SSE (Server-Sent Events) dengan Fallback Polling
  useEffect(() => {
    let eventSource = null;
    let fallbackInterval = null;

    try {
      eventSource = new EventSource('/api/operator/events');
      eventSource.onmessage = (e) => {
        try {
          const data = JSON.parse(e.data);
          setTelemetry(data);
        } catch (err) {
          console.error('Error parsing SSE event data', err);
        }
      };
      eventSource.onerror = () => {
        if (eventSource) eventSource.close();
        if (!fallbackInterval) {
          fallbackInterval = setInterval(async () => {
            try {
              const res = await api.get('/api/operator/state');
              if (res.data) setTelemetry(res.data);
            } catch {}
          }, 300);
        }
      };
    } catch {
      fallbackInterval = setInterval(async () => {
        try {
          const res = await api.get('/api/operator/state');
          if (res.data) setTelemetry(res.data);
        } catch {}
      }, 300);
    }

    return () => {
      if (eventSource) eventSource.close();
      if (fallbackInterval) clearInterval(fallbackInterval);
    };
  }, []);

  // Sinkronisasi Sesi Operator Aktif ke Backend secara Real-Time
  useEffect(() => {
    const syncOperatorSession = async () => {
      try {
        const username = localStorage.getItem('username') || 'op';
        const fullname = localStorage.getItem('operator_name') || username;
        const role = localStorage.getItem('user_role') || 'operator';
        await api.post('/api/operator/heartbeat', { username, fullname, role });
      } catch {}
    };
    syncOperatorSession();
    const heartbeatTimer = setInterval(syncOperatorSession, 4000);
    return () => clearInterval(heartbeatTimer);
  }, []);

  // 2. Tangani Perubahan Popups & NG Alarm
  useEffect(() => {
    if (telemetry.popups) {
      if (telemetry.popups.part_ok) {
        setShowPartOkModal(true);
      }
      if (telemetry.popups.flip_part) {
        setShowFlipModal(true);
      }
      if (telemetry.popups.ng_active || telemetry.status === 'NG') {
        setShowNgModal(true);
        startSirenAlert();
      } else {
        setShowNgModal(false);
        stopSirenAlert();
      }
    }
  }, [telemetry.popups, telemetry.status]);

  // Audio Sirene Synth Web Audio
  const startSirenAlert = () => {
    try {
      if (!audioCtxRef.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtxRef.current = new AudioContext();
      }
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      if (!sirenOscillatorRef.current) {
        const ctx = audioCtxRef.current;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        
        const now = ctx.currentTime;
        for (let i = 0; i < 60; i++) {
          osc.frequency.linearRampToValueAtTime(1200, now + i * 0.8 + 0.4);
          osc.frequency.linearRampToValueAtTime(800, now + i * 0.8 + 0.8);
        }

        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();

        sirenOscillatorRef.current = osc;
        sirenGainRef.current = gain;
      }
    } catch (e) {
      console.warn('AudioContext alert error:', e);
    }
  };

  const stopSirenAlert = () => {
    try {
      if (sirenOscillatorRef.current) {
        sirenOscillatorRef.current.stop();
        sirenOscillatorRef.current.disconnect();
        sirenOscillatorRef.current = null;
      }
    } catch {}
  };

  useEffect(() => {
    return () => {
      stopSirenAlert();
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Action Handlers
  const handleManualPass = async () => {
    try {
      await api.post('/api/operator/manual-pass');
      toast.success('Part Diverifikasi OK (Manual Pass)!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gagal trigger Pass Manual');
    }
  };

  const handleManualReject = async () => {
    try {
      await api.post('/api/operator/manual-reject');
      toast.error('Part Di-reject (Manual NG)!');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gagal trigger Reject Manual');
    }
  };

  const handleMockDetect = async () => {
    try {
      await api.post('/api/operator/mock-detect');
      toast('Mock Detect Triggered!', { icon: '📷' });
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gagal trigger Mock Detect');
    }
  };

  const handleClosePartOkModal = async () => {
    setShowPartOkModal(false);
    try {
      await api.post('/api/operator/clear-popup', { popup_type: 'part_ok' });
    } catch {}
  };

  const handleCloseFlipModal = async () => {
    setShowFlipModal(false);
    try {
      await api.post('/api/operator/clear-popup', { popup_type: 'flip_part' });
    } catch {}
  };

  const handleResolveNg = async (e) => {
    e.preventDefault();
    setNgError('');
    setNgResolving(true);

    try {
      const res = await api.post('/api/operator/resolve-ng', {
        username: ngSupervisorUsername,
        pin: ngSupervisorPin
      });
      if (res.data?.success) {
        stopSirenAlert();
        setShowNgModal(false);
        setNgSupervisorUsername('');
        setNgSupervisorPin('');
        toast.success('NG Abnormality Validated! Status kembali RUNNING.');
      }
    } catch (err) {
      setNgError(err.response?.data?.detail || 'Username/PIN Pengawas salah atau tidak valid!');
    } finally {
      setNgResolving(false);
    }
  };

  const handleSendDemoSison = async () => {
    setSendingDemo(true);
    try {
      let parsed;
      try {
        parsed = JSON.parse(demoJson);
      } catch {
        toast.error('Format JSON tidak valid!');
        setSendingDemo(false);
        return;
      }

      const res = await api.post('/api/operator/demo-start', parsed);
      if (res.data?.status === 'SUCCESS' || res.status === 200) {
        toast.success('Simulasi Transaksi SISON Berhasil Diterima!');
        setShowDemoModal(false);
      } else {
        toast.error('Gagal mengirim simulasi SISON: ' + JSON.stringify(res.data));
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gagal mengirim webhook SISON');
    } finally {
      setSendingDemo(false);
    }
  };

  const handleLogout = async () => {
    const myUname = localStorage.getItem('username') || '';
    try {
      await api.post('/api/operator/logout', { username: myUname });
    } catch {}
    localStorage.removeItem('operator_token');
    localStorage.removeItem('operator_name');
    localStorage.removeItem('user_role');
    localStorage.removeItem('username');
    localStorage.removeItem('admin_token');
    navigate('/login');
  };

  // Status Styling Logic
  const isRunning = telemetry.status === 'OK' || telemetry.status === 'RUNNING';
  const isManualMode = isRunning && (telemetry.inspection_mode === 'MANUAL');
  const isNg = telemetry.status === 'NG';
  const isCompleted = telemetry.status === 'COMPLETED';

  let statusBg = 'bg-slate-900 border-slate-700';
  let statusText = 'STANDBY';
  let statusTextColor = 'text-slate-300';

  if (isNg) {
    statusBg = 'bg-rose-950/80 border-rose-500 animate-pulse';
    statusText = 'NG TERDETEKSI';
    statusTextColor = 'text-rose-400 font-black';
  } else if (isCompleted) {
    statusBg = 'bg-sky-950/80 border-sky-500';
    statusText = 'SELESAI (OK)';
    statusTextColor = 'text-sky-400 font-bold';
  } else if (isRunning) {
    if (isManualMode) {
      statusBg = 'bg-amber-950/80 border-amber-500';
      statusText = 'MODE MANUAL (VISUAL)';
      statusTextColor = 'text-amber-400 font-bold';
    } else {
      statusBg = 'bg-emerald-950/80 border-emerald-500';
      statusText = telemetry.status === 'OK' ? 'INSPEKSI AI AKTIF' : 'PROSES (AI AUTO)';
      statusTextColor = 'text-emerald-400 font-bold';
    }
  }

  // Operator yang login di browser lokal ini (Edge / Opera / Chrome)
  const localOperatorName = localStorage.getItem('operator_name') || localStorage.getItem('username') || 'Operator';
  const opLoginDate = telemetry.operator?.login_time ? new Date(telemetry.operator.login_time * 1000) : new Date();
  const loginTimeStr = opLoginDate.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`h-screen max-h-screen w-screen overflow-hidden flex flex-col p-2.5 sm:p-3 gap-2 font-sans select-none app-bg-gradient box-border ${isNg ? 'ring-8 ring-rose-600 animate-pulse' : ''}`}>
      
      {/* 1. TOP HUD (HEADS-UP DISPLAY) HEADER */}
      <header className={`rounded-2xl p-3 sm:p-3.5 border-2 shadow-xl backdrop-blur-xl transition-all duration-300 shrink-0 ${statusBg}`}>
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3">
          
          {/* Part Number & QTY Target */}
          <div className="flex-1 text-center lg:text-left min-w-0">
            <div className="text-xs font-black tracking-widest text-amber-400 uppercase flex items-center justify-center lg:justify-start gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              <span>PART NUMBER</span>
            </div>
            <div className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-wide mt-0.5 truncate">
              {telemetry.p_no || 'MENUNGGU SISON...'}
            </div>
            {telemetry.p_no ? (
              <div className="text-xs font-bold text-emerald-400 mt-0.5">
                Target: {telemetry.target_qty} PCS | Selesai: {telemetry.qty_completed} PCS
              </div>
            ) : (
              <div className="text-[11px] text-slate-400 mt-0.5">Siap menerima trigger transaksi inspeksi</div>
            )}
          </div>

          {/* Center Status Banner */}
          <div className="flex-1 text-center px-3 py-1.5 rounded-xl bg-slate-900/60 border border-white/10 shadow-inner min-w-0">
            <div className="text-[10px] sm:text-[11px] font-bold text-slate-400 tracking-wider uppercase">
              STATUS KAMERA
            </div>
            <div className={`text-base sm:text-xl tracking-wide font-extrabold ${statusTextColor}`}>
              {statusText}
            </div>
            <div className="text-[11px] text-slate-300 font-medium truncate max-w-sm mx-auto">
              {telemetry.pesan_ui || '-'}
            </div>
            {telemetry.p_no && telemetry.status !== 'STANDBY' && (
              <div className="text-[11px] font-black text-emerald-400 mt-0.5">
                SISA QTY: {telemetry.qty_remaining}/{telemetry.target_qty} | SISI: {telemetry.current_side}
              </div>
            )}
          </div>

          {/* Right: Operator Badge & Actions (Riwayat Inspeksi + Keluar Shift di bawahnya) */}
          <div className="flex-1 flex flex-col items-center lg:items-end justify-center gap-2 min-w-0">
            {/* Operator Name & Time (Terkunci ke user lokal browser) */}
            <div className="flex items-center gap-2.5 bg-slate-900/90 px-4 py-2 rounded-xl border border-white/15 text-sky-300 text-sm sm:text-base font-extrabold shadow-md">
              <User className="w-4 h-4 text-sky-400" />
              <span className="truncate max-w-[150px]">{localOperatorName}</span>
              <span className="text-slate-600">|</span>
              <Clock className="w-4 h-4 text-slate-400" />
              <span>{loginTimeStr}</span>
            </div>

            {/* Sub-Actions: Riwayat Inspeksi & Keluar Shift (Ukuran Besar & Jelas) */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => navigate('/operator/history')}
                className="py-2 px-3.5 sm:px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 border border-blue-400/30 transition-all shadow-lg shadow-blue-600/30 cursor-pointer hover:scale-105 active:scale-95"
              >
                <History className="w-4 h-4 text-white" />
                <span>📋 RIWAYAT INSPEKSI</span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="py-2 px-3.5 sm:px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 border border-rose-400/30 transition-all cursor-pointer shadow-lg shadow-rose-600/30 hover:scale-105 active:scale-95"
              >
                <LogOut className="w-4 h-4 text-white" />
                <span>🚪 KELUAR</span>
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* 2. ACTION TOOLBAR (Ringkas & Efisien) */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-md shadow-md shrink-0">
        <div className="flex flex-wrap items-center gap-2">
          {/* Tombol PASS MANUAL (Hanya muncul di Mode Manual) */}
          {isManualMode && (
            <button
              type="button"
              onClick={handleManualPass}
              className="py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/30 transition-all cursor-pointer animate-bounce"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>✅ PASS MANUAL (OK)</span>
            </button>
          )}

          {/* Tombol REJECT MANUAL (Hanya muncul di Mode Manual) */}
          {isManualMode && (
            <button
              type="button"
              onClick={handleManualReject}
              className="py-1.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-rose-600/30 transition-all cursor-pointer"
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>❌ REJECT (NG)</span>
            </button>
          )}

          {/* Tombol Simulator Demo SISON */}
          <button
            type="button"
            onClick={() => setShowDemoModal(true)}
            className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center gap-1.5 border border-white/10 transition-all shadow-sm cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 text-indigo-400" />
            <span>🚀 DEMO SISON</span>
          </button>

          {/* Tombol Mock Detect */}
          <button
            type="button"
            onClick={handleMockDetect}
            className="py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs flex items-center gap-1.5 border border-white/10 transition-all shadow-sm cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5 text-amber-400" />
            <span>📷 MOCK DETECT</span>
          </button>
        </div>

        <div className="text-[11px] text-slate-400 font-medium hidden sm:block">
          Sistem Kamera Inspeksi AI Real-Time
        </div>
      </div>

      {/* 3. LIVE VIDEO CAMERA STREAM CONTAINER (FITS MONITOR PERFECTLY - NO SCROLL) */}
      <main className="flex-1 min-h-0 w-full relative flex items-center justify-center bg-black rounded-2xl border-2 border-slate-800 shadow-2xl overflow-hidden">
        {telemetry.is_cam_active ? (
          <img
            src="/api/video_feed"
            alt="Live Camera Inspection AI Stream"
            className="w-full h-full object-contain max-h-full max-w-full block"
          />
        ) : (
          <div className="text-center p-6">
            <Camera className="w-12 h-12 text-slate-600 mx-auto mb-3 animate-pulse" />
            <h2 className="text-xl font-black text-slate-300">KAMERA STANDBY (OFF)</h2>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              Kamera saat ini dimatikan dari pengaturan perangkat. Nyalakan saklar kamera untuk melihat live video stream.
            </p>
          </div>
        )}
      </main>

      {/* 4. MODAL POPUP: PART OK */}
      {showPartOkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg bg-slate-900 border-2 border-emerald-500/60 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-emerald-950/40 text-center">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mx-auto mb-3 text-emerald-400 shadow-lg">
              <Check className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-white">✅ PART BERHASIL TERDETEKSI!</h3>
            <p className="text-xs sm:text-sm text-emerald-300 font-bold mt-1">
              Semua label terdeteksi dan memenuhi standar confidence AI.
            </p>

            <div className="mt-4 p-4 rounded-2xl bg-slate-950/80 border border-white/10 text-left text-xs space-y-2">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-slate-400">Label Terdeteksi:</span>
                <span className="font-bold text-white">{telemetry.popups?.details?.label_terdeteksi || '-'}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-slate-400">Rata-rata Confidence:</span>
                <span className="font-bold text-emerald-400">{telemetry.popups?.details?.avg_confidence || '-'}</span>
              </div>
              <div>
                <span className="text-slate-400 block mb-1">Label yang ditemukan:</span>
                <pre className="text-xs text-emerald-400 font-mono bg-black/50 p-2 rounded-xl whitespace-pre-wrap">
                  {telemetry.popups?.details?.found_labels || '-'}
                </pre>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClosePartOkModal}
              className="mt-5 w-full py-3 px-6 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
            >
              Lanjutkan Inspeksi →
            </button>
          </div>
        </div>
      )}

      {/* 5. MODAL POPUP: BALIK PART (FLIP SIDE) */}
      {showFlipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg bg-slate-900 border-2 border-amber-500/60 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-amber-950/40 text-center">
            <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center mx-auto mb-3 text-amber-400 shadow-lg">
              <RotateCcw className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-black text-white">🔄 SISI DEPAN OK!</h3>
            <p className="text-xs sm:text-sm text-amber-300 font-bold mt-1">
              Balik Part ke <span className="underline font-black">SISI BELAKANG (REAR)</span>.
            </p>

            <div className="mt-4 p-4 rounded-2xl bg-slate-950/80 border border-white/10 text-left text-xs space-y-2">
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-slate-400">Label Sisi Depan:</span>
                <span className="font-bold text-white">{telemetry.popups?.details?.label_terdeteksi || '-'}</span>
              </div>
              <div className="flex justify-between border-b border-white/5 pb-2">
                <span className="text-slate-400">Confidence:</span>
                <span className="font-bold text-emerald-400">{telemetry.popups?.details?.avg_confidence || '-'}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCloseFlipModal}
              className="mt-5 w-full py-3 px-6 bg-amber-600 hover:bg-amber-500 text-white font-black rounded-xl shadow-lg shadow-amber-600/30 transition-all cursor-pointer"
            >
              Part Sudah Dibalik (Lanjutkan) →
            </button>
          </div>
        </div>
      )}

      {/* 6. MODAL POPUP: NG ABNORMALITY & VALIDASI PENGAWAS */}
      {showNgModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-rose-950/90 backdrop-blur-xl animate-fadeIn">
          <div className="w-full max-w-xl bg-slate-950 border-4 border-rose-500 rounded-3xl p-6 shadow-2xl shadow-rose-900/60">
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-2 bg-rose-500/20 border-2 border-rose-500 px-3.5 py-1 rounded-full text-rose-300 font-black text-xs uppercase tracking-wider animate-pulse mb-2">
                <ShieldAlert className="w-4 h-4" />
                <span>SIRENE & ALARM NG AKTIF!</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">⚠️ KOMPONEN CACAT (NG) TERDETEKSI! ⚠️</h2>
              <p className="text-xs text-rose-300 font-bold mt-1">
                Panggil Pengawas dan masukkan PIN Pengawas untuk mematikan sirene & resume sistem.
              </p>
            </div>

            {/* Foto Bukti Cacat Snapshot */}
            {telemetry.popups?.ng_image_url && (
              <div className="mb-4 rounded-xl overflow-hidden border-2 border-rose-500 bg-black max-h-52 flex items-center justify-center">
                <img
                  src={telemetry.popups.ng_image_url}
                  alt="Snapshot Cacat NG"
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            {ngError && (
              <div className="mb-3 p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/50 text-rose-300 text-xs font-bold text-center">
                {ngError}
              </div>
            )}

            {/* Form PIN Pengawas */}
            <form onSubmit={handleResolveNg} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-300 mb-1">
                    Username Pengawas / Admin
                  </label>
                  <input
                    type="text"
                    required
                    value={ngSupervisorUsername}
                    onChange={(e) => setNgSupervisorUsername(e.target.value)}
                    placeholder="Username Pengawas"
                    className="w-full px-3 py-2 bg-slate-900 border-2 border-white/20 rounded-xl text-white focus:outline-none focus:border-rose-400 text-xs font-sans"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-300 mb-1">
                    PIN Pengawas / Admin
                  </label>
                  <input
                    type="password"
                    required
                    value={ngSupervisorPin}
                    onChange={(e) => setNgSupervisorPin(e.target.value)}
                    placeholder="Masukkan PIN"
                    className="w-full px-3 py-2 bg-slate-900 border-2 border-white/20 rounded-xl text-white focus:outline-none focus:border-rose-400 text-xs font-sans"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={ngResolving}
                className="w-full py-3 px-5 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black rounded-xl shadow-lg shadow-rose-600/40 text-sm uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
              >
                {ngResolving ? 'Memvalidasi PIN...' : '🔔 VALIDASI PIN & MATIKAN SIRENE'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 7. MODAL POPUP: SIMULATOR DEMO SISON */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-lg bg-slate-900 border border-white/15 rounded-3xl p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-indigo-400" />
                <span>Simulator JSON Transaksi SISON</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowDemoModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-2">
              Edit payload JSON di bawah ini untuk mengirim trigger transaksi inspeksi baru:
            </p>

            <textarea
              rows={8}
              value={demoJson}
              onChange={(e) => setDemoJson(e.target.value)}
              className="w-full p-3 bg-slate-950 border border-white/15 rounded-xl font-mono text-xs text-emerald-300 focus:outline-none focus:border-indigo-400"
            />

            <div className="flex items-center justify-end gap-2.5 mt-3">
              <button
                type="button"
                onClick={() => setShowDemoModal(false)}
                className="py-2 px-3.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={sendingDemo}
                onClick={handleSendDemoSison}
                className="py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-md shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
              >
                {sendingDemo ? 'Mengirim...' : '🚀 Kirim Simulasi'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
