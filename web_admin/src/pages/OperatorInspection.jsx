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
    const heartbeatTimer = setInterval(syncOperatorSession, 15000);
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
      const res = await api.post('/api/operator/manual-pass');
      toast.success(res.data?.message || 'Part Diverifikasi OK (Manual Pass)!');
      const stateRes = await api.get('/api/operator/state');
      if (stateRes.data) setTelemetry(stateRes.data);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gagal trigger Pass Manual');
    }
  };

  const handleManualReject = async () => {
    try {
      const res = await api.post('/api/operator/manual-reject');
      toast.error(res.data?.message || 'Part Di-reject (Manual NG)!');
      const stateRes = await api.get('/api/operator/state');
      if (stateRes.data) setTelemetry(stateRes.data);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gagal trigger Reject Manual');
    }
  };

  const handleMockDetect = async () => {
    try {
      const res = await api.post('/api/operator/mock-detect');
      toast.success(res.data?.message || 'Mock Detect Berhasil!', { icon: '📷' });
      const stateRes = await api.get('/api/operator/state');
      if (stateRes.data) setTelemetry(stateRes.data);
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
        const stateRes = await api.get('/api/operator/state');
        if (stateRes.data) setTelemetry(stateRes.data);
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
      <header className={`rounded-2xl p-3 sm:p-4 border-2 shadow-xl backdrop-blur-xl transition-all duration-300 shrink-0 ${statusBg}`}>
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3 sm:gap-4">
          
          {/* Part Number & QTY Target */}
          <div className="flex-1 text-center lg:text-left min-w-0">
            <div className="text-xs sm:text-sm font-black tracking-widest text-amber-400 uppercase flex items-center justify-center lg:justify-start gap-1.5">
              <Layers className="w-4 h-4" />
              <span>PART NUMBER</span>
            </div>
            <div className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-wide mt-0.5 truncate">
              {telemetry.p_no || 'MENUNGGU SISON...'}
            </div>
            {telemetry.p_no ? (
              <div className="text-sm sm:text-base font-bold text-emerald-400 mt-0.5">
                Target: <span className="text-white font-extrabold">{telemetry.target_qty} PCS</span> | Selesai: <span className="text-white font-extrabold">{telemetry.qty_completed} PCS</span>
              </div>
            ) : (
              <div className="text-xs sm:text-sm text-slate-400 mt-0.5">Siap menerima trigger transaksi inspeksi</div>
            )}
          </div>

          {/* Center Status Banner (Besar & Kontras Tinggi) */}
          <div className="flex-1 text-center px-4 py-2 rounded-2xl bg-slate-900/80 border border-white/15 shadow-inner min-w-0">
            <div className="text-xs sm:text-sm font-black text-slate-400 tracking-wider uppercase">
              STATUS KAMERA
            </div>
            <div className={`text-xl sm:text-2xl lg:text-3xl tracking-wide font-black ${statusTextColor}`}>
              {statusText}
            </div>
            <div className="text-xs sm:text-sm text-slate-200 font-bold truncate max-w-md mx-auto mt-0.5">
              {telemetry.pesan_ui ? String(telemetry.pesan_ui).replace(/<[^>]+>/g, '') : '-'}
            </div>
            {telemetry.p_no && telemetry.status !== 'STANDBY' && (
              <div className="text-xs sm:text-sm font-black text-emerald-300 mt-1 bg-emerald-950/60 py-0.5 px-3 rounded-full inline-block border border-emerald-500/30">
                SISA QTY: {telemetry.qty_remaining}/{telemetry.target_qty} | SISI: {telemetry.current_side === 'F' ? 'FRONT (DEPAN)' : telemetry.current_side === 'R' ? 'REAR (BELAKANG)' : telemetry.current_side}
              </div>
            )}
          </div>

          {/* Right: Operator Badge & Actions (Riwayat Inspeksi + Keluar Shift) */}
          <div className="flex-1 flex flex-col items-center lg:items-end justify-center gap-2 min-w-0">
            {/* Operator Name & Time (Terkunci ke user lokal browser) */}
            <div className="flex items-center gap-2.5 bg-slate-900/90 px-4 py-2 rounded-xl border border-white/15 text-sky-300 text-sm sm:text-base font-extrabold shadow-md">
              <User className="w-5 h-5 text-sky-400" />
              <span className="truncate max-w-[150px]">{localOperatorName}</span>
              <span className="text-slate-600">|</span>
              <Clock className="w-5 h-5 text-slate-400" />
              <span>{loginTimeStr}</span>
            </div>

            {/* Sub-Actions: Riwayat Inspeksi & Keluar Shift (Ukuran Besar & Jelas) */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => navigate('/operator/history')}
                className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 border border-blue-400/30 transition-all shadow-lg shadow-blue-600/30 cursor-pointer hover:scale-105 active:scale-95"
              >
                <History className="w-4 h-4 text-white" />
                <span>📋 RIWAYAT INSPEKSI</span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2 border border-rose-400/30 transition-all cursor-pointer shadow-lg shadow-rose-600/30 hover:scale-105 active:scale-95"
              >
                <LogOut className="w-4 h-4 text-white" />
                <span>🚪 KELUAR</span>
              </button>
            </div>
          </div>

        </div>
      </header>

      {/* 2. ACTION TOOLBAR (Ukuran Nyaman untuk Touch & Klik) */}
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900/80 px-3.5 py-2 rounded-xl border border-white/10 backdrop-blur-md shadow-md shrink-0">
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Tombol PASS MANUAL (Hanya muncul di Mode Manual) */}
          {isManualMode && (
            <button
              type="button"
              onClick={handleManualPass}
              className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer animate-bounce"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>✅ PASS MANUAL (OK)</span>
            </button>
          )}

          {/* Tombol REJECT MANUAL (Hanya muncul di Mode Manual) */}
          {isManualMode && (
            <button
              type="button"
              onClick={handleManualReject}
              className="py-2 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
              <span>❌ REJECT (NG)</span>
            </button>
          )}

          {/* Tombol Simulator Demo SISON */}
          <button
            type="button"
            onClick={() => setShowDemoModal(true)}
            className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-extrabold text-xs sm:text-sm flex items-center gap-2 border border-white/15 transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95"
          >
            <Send className="w-4 h-4 text-indigo-400" />
            <span>🚀 DEMO SISON</span>
          </button>

          {/* Tombol Mock Detect */}
          <button
            type="button"
            onClick={handleMockDetect}
            className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-extrabold text-xs sm:text-sm flex items-center gap-2 border border-white/15 transition-all shadow-md cursor-pointer hover:scale-105 active:scale-95"
          >
            <Camera className="w-4 h-4 text-amber-400" />
            <span>📷 MOCK DETECT</span>
          </button>
        </div>

        <div className="text-xs text-slate-400 font-bold hidden sm:block">
          Sistem Kamera Inspeksi AI Real-Time
        </div>
      </div>

      {/* 3. LIVE VIDEO CAMERA STREAM CONTAINER */}
      <main className="flex-1 min-h-0 w-full relative flex items-center justify-center bg-black rounded-2xl border-2 border-slate-800 shadow-2xl overflow-hidden">
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
      </main>

      {/* 4. MODAL POPUP: PART OK (UKURAN BESAR & JELAS UNTUK OPERATOR) */}
      {showPartOkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-lg animate-fadeIn">
          <div className="w-full max-w-2xl bg-slate-900 border-4 border-emerald-500 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-emerald-950/60 text-center">
            <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 border-4 border-emerald-400 flex items-center justify-center mx-auto mb-4 text-emerald-400 shadow-xl shadow-emerald-500/30 animate-pulse">
              <Check className="w-12 h-12 stroke-[3]" />
            </div>
            
            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-wide">
              ✅ PART OK (DIVERIFIKASI)!
            </h3>
            <p className="text-base sm:text-lg text-emerald-300 font-extrabold mt-2">
              Semua label komponen terdeteksi lengkap & memenuhi standar AI Quality Control.
            </p>

            <div className="mt-6 p-5 sm:p-6 rounded-2xl bg-slate-950/90 border-2 border-white/10 text-left space-y-3.5 shadow-inner">
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <span className="text-slate-300 text-sm sm:text-base font-bold">Kelengkapan Label:</span>
                <span className="text-lg sm:text-xl font-black text-white">{telemetry.popups?.details?.label_terdeteksi || '100%'}</span>
              </div>
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <span className="text-slate-300 text-sm sm:text-base font-bold">Rata-rata Akurasi AI:</span>
                <span className="text-lg sm:text-xl font-black text-emerald-400">{telemetry.popups?.details?.avg_confidence || '95%'}</span>
              </div>
              <div>
                <span className="text-slate-300 text-sm sm:text-base font-bold block mb-2">Detail Komponen Terdeteksi:</span>
                <pre className="text-sm sm:text-base text-emerald-300 font-mono font-bold bg-black/70 p-3 sm:p-4 rounded-xl whitespace-pre-wrap border border-emerald-500/20 leading-relaxed">
                  {telemetry.popups?.details?.found_labels || '- INSPEKSI VISUAL : OK'}
                </pre>
              </div>
            </div>

            <button
              type="button"
              onClick={handleClosePartOkModal}
              className="mt-6 w-full py-4 sm:py-5 px-8 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-lg sm:text-2xl font-black rounded-2xl shadow-xl shadow-emerald-600/40 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              LANJUTKAN INSPEKSI →
            </button>
          </div>
        </div>
      )}

      {/* 5. MODAL POPUP: BALIK PART (UKURAN BESAR & WARNA TEGAS) */}
      {showFlipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-lg animate-fadeIn">
          <div className="w-full max-w-2xl bg-slate-900 border-4 border-amber-500 rounded-3xl p-6 sm:p-10 shadow-2xl shadow-amber-950/60 text-center">
            <div className="w-20 h-20 rounded-3xl bg-amber-500/20 border-4 border-amber-400 flex items-center justify-center mx-auto mb-4 text-amber-400 shadow-xl shadow-amber-500/30 animate-spin-slow">
              <RotateCcw className="w-12 h-12 stroke-[3]" />
            </div>
            
            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-wide">
              🔄 SISI DEPAN (FRONT) OK!
            </h3>
            <p className="text-lg sm:text-2xl text-amber-300 font-black mt-2">
              BALIK PART KE <span className="underline decoration-amber-400 decoration-4 text-white">SISI BELAKANG (REAR)</span>
            </p>

            <div className="mt-6 p-5 sm:p-6 rounded-2xl bg-slate-950/90 border-2 border-white/10 text-left space-y-3 shadow-inner">
              <div className="flex justify-between items-center border-b border-white/10 pb-3">
                <span className="text-slate-300 text-sm sm:text-base font-bold">Status Sisi Depan:</span>
                <span className="text-lg sm:text-xl font-black text-emerald-400">OK (Lengkap)</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300 text-sm sm:text-base font-bold">Target Selanjutnya:</span>
                <span className="text-lg sm:text-xl font-black text-amber-400">Inspeksi Sisi Belakang</span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCloseFlipModal}
              className="mt-6 w-full py-4 sm:py-5 px-8 bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-lg sm:text-2xl font-black rounded-2xl shadow-xl shadow-amber-600/40 transition-all cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
            >
              PART SUDAH DIBALIK (LANJUTKAN) →
            </button>
          </div>
        </div>
      )}

      {/* 6. MODAL POPUP: NG ABNORMALITY & VALIDASI PENGAWAS (UKURAN SANGAT BESAR & JELAS) */}
      {showNgModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-rose-950/95 backdrop-blur-xl animate-fadeIn">
          <div className="w-full max-w-2xl bg-slate-950 border-4 border-rose-500 rounded-3xl p-6 sm:p-8 shadow-2xl shadow-rose-900/80">
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-2 bg-rose-500/30 border-2 border-rose-400 px-5 py-1.5 rounded-full text-rose-200 font-black text-sm uppercase tracking-widest animate-pulse mb-3">
                <ShieldAlert className="w-5 h-5" />
                <span>SIRENE & ALARM NG AKTIF!</span>
              </div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-wide">
                ⚠️ CACAT / NG TERDETEKSI! ⚠️
              </h2>
              <p className="text-sm sm:text-base text-rose-300 font-bold mt-1.5">
                Panggil Pengawas / QC Leader untuk verifikasi dan input PIN validasi.
              </p>
            </div>

            {/* Foto Bukti Cacat Snapshot */}
            {telemetry.popups?.ng_image_url && (
              <div className="mb-5 rounded-2xl overflow-hidden border-3 border-rose-500 bg-black max-h-60 flex items-center justify-center shadow-lg">
                <img
                  src={telemetry.popups.ng_image_url}
                  alt="Snapshot Cacat NG"
                  className="w-full h-full object-contain"
                />
              </div>
            )}

            {ngError && (
              <div className="mb-4 p-3.5 rounded-xl bg-rose-500/30 border-2 border-rose-500 text-rose-200 text-sm sm:text-base font-black text-center">
                {ngError}
              </div>
            )}

            {/* Form PIN Pengawas */}
            <form onSubmit={handleResolveNg} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs sm:text-sm font-black uppercase text-slate-200 mb-1.5">
                    Username Pengawas / Admin
                  </label>
                  <input
                    type="text"
                    required
                    value={ngSupervisorUsername}
                    onChange={(e) => setNgSupervisorUsername(e.target.value)}
                    placeholder="Username Pengawas"
                    className="w-full px-4 py-3 bg-slate-900 border-2 border-white/20 rounded-xl text-white focus:outline-none focus:border-rose-400 text-base font-bold placeholder:text-slate-500"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-sm font-black uppercase text-slate-200 mb-1.5">
                    PIN Pengawas / Admin
                  </label>
                  <input
                    type="password"
                    required
                    value={ngSupervisorPin}
                    onChange={(e) => setNgSupervisorPin(e.target.value)}
                    placeholder="Masukkan PIN"
                    className="w-full px-4 py-3 bg-slate-900 border-2 border-white/20 rounded-xl text-white focus:outline-none focus:border-rose-400 text-base font-bold placeholder:text-slate-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={ngResolving}
                className="w-full py-4 px-6 bg-gradient-to-r from-rose-600 via-red-600 to-rose-700 hover:from-rose-500 hover:to-red-500 text-white font-black rounded-2xl shadow-xl shadow-rose-600/50 text-base sm:text-xl uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
              >
                {ngResolving ? 'Memvalidasi PIN...' : '🔔 VALIDASI PIN & MATIKAN SIRENE'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 7. MODAL POPUP: SIMULATOR DEMO SISON */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-xl bg-slate-900 border-2 border-indigo-500/60 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2.5">
                <Send className="w-5 h-5 text-indigo-400" />
                <span>Simulator JSON Transaksi SISON</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowDemoModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <p className="text-xs sm:text-sm text-slate-300 mb-3 font-medium">
              Edit payload JSON di bawah ini untuk mengirim trigger transaksi inspeksi baru:
            </p>

            <textarea
              rows={8}
              value={demoJson}
              onChange={(e) => setDemoJson(e.target.value)}
              className="w-full p-4 bg-slate-950 border-2 border-white/15 rounded-xl font-mono text-xs sm:text-sm text-emerald-300 focus:outline-none focus:border-indigo-400 leading-relaxed"
            />

            <div className="mt-5 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDemoModal(false)}
                className="py-3 px-5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSendDemoSison}
                disabled={sendingDemo}
                className="py-3 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{sendingDemo ? 'Mengirim...' : 'Kirim Simulasi SISON'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
