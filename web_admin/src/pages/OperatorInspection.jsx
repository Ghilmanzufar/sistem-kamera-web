import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Camera, CheckCircle2, XCircle, Play, History, LogOut, 
  AlertTriangle, RotateCcw, Send, Check, X, ShieldAlert, 
  Layers, User, Clock, Eye, GripHorizontal
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';

// Komponen Popup Melayang yang Dapat Digeser (Draggable Floating Popup - Compact Zero-Scroll)
function DraggableFloatingCard({ title, icon: Icon, badge, color = 'emerald', onClose, children }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0 });

  const handleMouseDown = (e) => {
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('textarea')) return;
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y,
    };
  };

  const handleTouchStart = (e) => {
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('textarea')) return;
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragRef.current = {
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        initialX: position.x,
        initialY: position.y,
      };
    }
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      setPosition({
        x: dragRef.current.initialX + dx,
        y: dragRef.current.initialY + dy,
      });
    };

    const handleTouchMove = (e) => {
      if (!isDragging || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - dragRef.current.startX;
      const dy = e.touches[0].clientY - dragRef.current.startY;
      setPosition({
        x: dragRef.current.initialX + dx,
        y: dragRef.current.initialY + dy,
      });
    };

    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging]);

  const colorStyles = {
    emerald: {
      border: 'border-emerald-500',
      glow: 'shadow-emerald-950/80',
      headerBg: 'bg-emerald-950/95 border-emerald-500/40 text-emerald-300',
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
    },
    amber: {
      border: 'border-amber-500',
      glow: 'shadow-amber-950/80',
      headerBg: 'bg-amber-950/95 border-amber-500/40 text-amber-300',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
    },
    rose: {
      border: 'border-rose-500',
      glow: 'shadow-rose-950/80',
      headerBg: 'bg-rose-950/95 border-rose-500/40 text-rose-300',
      badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-400/40',
    }
  }[color] || {
    border: 'border-slate-700',
    glow: 'shadow-black/80',
    headerBg: 'bg-slate-900 border-slate-700 text-slate-200',
    badgeBg: 'bg-slate-800 text-slate-300 border-slate-600',
  };

  return (
    <div
      style={{
        transform: `translate(calc(-50% + ${position.x}px), ${position.y}px)`,
      }}
      className={`fixed z-40 top-14 left-1/2 w-[94vw] max-w-xl sm:max-w-2xl bg-slate-950/95 backdrop-blur-xl rounded-2xl border-3 ${colorStyles.border} shadow-2xl ${colorStyles.glow} select-none animate-fadeIn`}
    >
      {/* Draggable Header Handle */}
      <div
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className={`px-4 py-2.5 rounded-t-[14px] border-b flex items-center justify-between cursor-grab active:cursor-grabbing ${colorStyles.headerBg}`}
      >
        <div className="flex items-center gap-2.5 font-black text-xs sm:text-sm uppercase tracking-wider">
          {Icon && <Icon className="w-4 h-4 shrink-0" />}
          <span className="truncate">{title}</span>
          {badge && (
            <span className={`text-[11px] px-2.5 py-0.5 rounded-full border font-black ${colorStyles.badgeBg} shrink-0`}>
              {badge}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <span className="text-[10px] sm:text-xs font-bold text-slate-300 bg-black/50 px-2.5 py-1 rounded-lg flex items-center gap-1 border border-white/10">
            <GripHorizontal className="w-3.5 h-3.5 text-emerald-400" /> <span>✥ Geser</span>
          </span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Popup Body (Spacious & Readable) */}
      <div className="p-5 sm:p-6 overflow-hidden">
        {children}
      </div>
    </div>
  );
}

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
    },
    live_metrics: {}
  });

  // Modal States
  const [showPartOkModal, setShowPartOkModal] = useState(false);
  const [showFlipModal, setShowFlipModal] = useState(false);
  const [showNgModal, setShowNgModal] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);

  // State NG Confirmation
  const [ngResolving, setNgResolving] = useState(false);

  // Demo SISON JSON Form (Default: 2 PCS Multi-Sisi Front & Rear)
  const [demoJson, setDemoJson] = useState(() => {
    const timestamp = Math.floor(Date.now() / 1000);
    return JSON.stringify({
      id_trans: `DEMO-${timestamp}`,
      lot: `LOT-${Math.floor(1000 + Math.random() * 9000)}`,
      p_no: '74231-0K550-00',
      unique_no: `UNQ-${Math.floor(1000 + Math.random() * 9000)}`,
      p_name: 'Demo Part Multi-Sisi',
      qty: 2
    }, null, 2);
  });
  const [sendingDemo, setSendingDemo] = useState(false);

  // Quick helper to change demo QTY
  const setDemoQtyPreset = (qtyNum) => {
    try {
      const parsed = JSON.parse(demoJson);
      parsed.qty = qtyNum;
      parsed.id_trans = `DEMO-${Math.floor(Date.now() / 1000)}`;
      setDemoJson(JSON.stringify(parsed, null, 2));
    } catch {}
  };

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
      if (telemetry.popups.part_ok && telemetry.qty_remaining > 0 && telemetry.status !== 'COMPLETED' && telemetry.status !== 'STANDBY') {
        setShowPartOkModal(true);
      } else {
        setShowPartOkModal(false);
      }
      if (telemetry.popups.flip_part && telemetry.status !== 'STANDBY') {
        setShowFlipModal(true);
      } else {
        setShowFlipModal(false);
      }
      if (telemetry.popups.ng_active || telemetry.status === 'NG') {
        setShowNgModal(true);
        startSirenAlert();
      } else {
        setShowNgModal(false);
        stopSirenAlert();
      }
    }
  }, [telemetry.popups, telemetry.status, telemetry.qty_remaining]);

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

  const handleResolveNg = async (actionType = 'CONFIRM_NG') => {
    setNgResolving(true);
    try {
      const res = await api.post('/api/operator/resolve-ng', { action: actionType });
      if (res.data?.success) {
        stopSirenAlert();
        setShowNgModal(false);
        if (actionType === 'CONFIRM_NG') {
          toast.error('Part Cacat (NG) Telah Dikonfirmasi!');
        } else {
          toast.success('Alarm NG Dibatalkan (Bukan NG/Abaikan).');
        }
        const stateRes = await api.get('/api/operator/state');
        if (stateRes.data) setTelemetry(stateRes.data);
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gagal merespons alarm NG');
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
      statusText = 'DETECT PART';
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
            {telemetry.status !== 'STANDBY' && telemetry.status !== 'IDLE' && (
              <div className="text-xs sm:text-sm text-slate-200 font-bold truncate max-w-lg mx-auto mt-0.5">
                {telemetry.live_metrics?.total_count > 0 ? (
                  <span>
                    Inspeksi: Labels{' '}
                    <span className={telemetry.live_metrics.labels_complete ? 'text-emerald-400 font-black' : 'text-rose-400 font-black'}>
                      {telemetry.live_metrics.detected_count}/{telemetry.live_metrics.total_count}
                    </span>
                    {' '}(Min {telemetry.live_metrics.min_coverage || 100}%) | AvgConf:{' '}
                    <span className={telemetry.live_metrics.avg_conf_ok ? 'text-emerald-400 font-black' : 'text-rose-400 font-black'}>
                      {telemetry.live_metrics.current_avg_conf}%/{telemetry.live_metrics.target_avg_conf}%
                    </span>
                  </span>
                ) : (
                  <span>{telemetry.pesan_ui ? String(telemetry.pesan_ui).replace(/<[^>]+>/g, '') : '-'}</span>
                )}
              </div>
            )}
            {telemetry.p_no && telemetry.status !== 'STANDBY' && (
              <div className="text-xs sm:text-sm font-black text-emerald-300 mt-1 bg-emerald-950/60 py-0.5 px-3 rounded-full inline-block border border-emerald-500/30">
                SISI: {telemetry.current_side === 'F' ? 'FRONT (DEPAN)' : telemetry.current_side === 'R' ? 'REAR (BELAKANG)' : telemetry.current_side}
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

      {/* 4. DRAGGABLE FLOATING POPUP: PART OK (Hanya Muncul Antar-Part) */}
      {showPartOkModal && telemetry.qty_remaining > 0 && (
        <DraggableFloatingCard
          title={`PART #${telemetry.qty_completed || 1} SELESAI`}
          badge={`SISA ${telemetry.qty_remaining} PCS`}
          color="emerald"
          icon={Check}
          onClose={handleClosePartOkModal}
        >
          <div className="space-y-4 text-left">
            {/* Judul Rata Kiri */}
            <div className="flex items-center gap-3.5 pb-0.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-md shrink-0 animate-pulse">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg sm:text-xl font-black text-white leading-tight">
                  Part berhasil terdeteksi!
                </h3>
                <p className="text-xs sm:text-sm text-emerald-300 font-bold mt-0.5 truncate">
                  Sisi Depan & Belakang OK. Sisa: {telemetry.qty_remaining} PCS.
                </p>
              </div>
            </div>

            {/* 1. Metrik Kelengkapan Label & Rata-rata Akurasi (Di atas) */}
            <div className="grid grid-cols-2 gap-3 bg-slate-900/90 p-3 sm:p-3.5 rounded-2xl border border-white/15 text-xs shadow-inner">
              <div className="px-1">
                <span className="text-slate-400 block text-xs uppercase font-extrabold tracking-wide mb-0.5">Label Terdeteksi:</span>
                <span className="font-black text-white text-sm sm:text-base">{telemetry.popups?.details?.label_terdeteksi || '3/3'}</span>
              </div>
              <div className="border-l border-white/15 pl-3.5">
                <span className="text-slate-400 block text-xs uppercase font-extrabold tracking-wide mb-0.5">Rata-rata Akurasi:</span>
                <span className="font-black text-emerald-400 text-sm sm:text-base">{telemetry.popups?.details?.avg_confidence || '95%'}</span>
              </div>
            </div>

            {/* 2. Nama Label (Di bawah rata-rata akurasi, berjejer ke bawah & tinggi dinamis tanpa scroll) */}
            <div>
              <span className="text-xs uppercase font-extrabold text-slate-300 block mb-2 tracking-wide">
                Nama Label Terverifikasi:
              </span>
              <div className="flex flex-col gap-2 p-2.5 sm:p-3 bg-slate-900/90 rounded-2xl border border-white/15 shadow-inner">
                {telemetry.popups?.details?.found_labels ? (
                  telemetry.popups.details.found_labels.split('\n').filter(Boolean).map((lbl, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between px-3 py-2 sm:py-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-xs sm:text-sm font-mono font-bold text-emerald-200 shadow-sm"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="truncate">{lbl.replace(/^-\s*/, '').split(':')[0]?.trim() || lbl.replace(/^-\s*/, '')}</span>
                      </div>
                      {lbl.includes(':') && (
                        <span className="text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-md font-black text-xs sm:text-sm shrink-0 border border-emerald-500/30">
                          {lbl.split(':')[1]?.trim()}
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 font-bold p-1">{telemetry.popups?.details?.label_terdeteksi || 'Semua label lengkap'}</span>
                )}
              </div>
            </div>

            {/* Tombol Lanjutkan */}
            <button
              type="button"
              onClick={handleClosePartOkModal}
              className="w-full py-3 sm:py-3.5 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm sm:text-base font-black rounded-xl shadow-lg shadow-emerald-600/40 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] text-center mt-1"
            >
              ✅ LANJUTKAN KE PART BERIKUTNYA ({(telemetry.qty_completed || 0) + 1}/{telemetry.target_qty}) →
            </button>
          </div>
        </DraggableFloatingCard>
      )}

      {/* 5. DRAGGABLE FLOATING POPUP: SISI DEPAN OK */}
      {showFlipModal && (
        <DraggableFloatingCard
          title={`PART #${(telemetry.qty_completed || 0) + 1} - SISI DEPAN (FRONT) OK`}
          badge="BALIK KE REAR"
          color="emerald"
          icon={Check}
          onClose={handleCloseFlipModal}
        >
          <div className="space-y-4 text-left">
            {/* Judul Rata Kiri */}
            <div className="flex items-center gap-3.5 pb-0.5">
              <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center text-emerald-400 shadow-md shrink-0 animate-pulse">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <div className="min-w-0">
                <h3 className="text-lg sm:text-xl font-black text-white leading-tight">
                  Part berhasil terdeteksi!
                </h3>
                <p className="text-xs sm:text-sm text-emerald-300 font-bold mt-0.5 truncate">
                  Silakan balik part ke <span className="underline decoration-emerald-400 decoration-2 font-black">SISI BELAKANG (REAR)</span>.
                </p>
              </div>
            </div>

            {/* 1. Metrik Kelengkapan Label & Rata-rata Akurasi (Di atas) */}
            <div className="grid grid-cols-2 gap-3 bg-slate-900/90 p-3 sm:p-3.5 rounded-2xl border border-white/15 text-xs shadow-inner">
              <div className="px-1">
                <span className="text-slate-400 block text-xs uppercase font-extrabold tracking-wide mb-0.5">Label Terdeteksi:</span>
                <span className="font-black text-white text-sm sm:text-base">{telemetry.popups?.details?.label_terdeteksi || '3/3'}</span>
              </div>
              <div className="border-l border-white/15 pl-3.5">
                <span className="text-slate-400 block text-xs uppercase font-extrabold tracking-wide mb-0.5">Rata-rata Akurasi:</span>
                <span className="font-black text-emerald-400 text-sm sm:text-base">{telemetry.popups?.details?.avg_confidence || '96%'}</span>
              </div>
            </div>

            {/* 2. Nama Label (Di bawah rata-rata akurasi, berjejer ke bawah & tinggi dinamis tanpa scroll) */}
            <div>
              <span className="text-xs uppercase font-extrabold text-slate-300 block mb-2 tracking-wide">
                Nama Label Terverifikasi:
              </span>
              <div className="flex flex-col gap-2 p-2.5 sm:p-3 bg-slate-900/90 rounded-2xl border border-white/15 shadow-inner">
                {telemetry.popups?.details?.found_labels ? (
                  telemetry.popups.details.found_labels.split('\n').filter(Boolean).map((lbl, idx) => (
                    <div 
                      key={idx} 
                      className="flex items-center justify-between px-3 py-2 sm:py-2.5 rounded-xl bg-emerald-950/80 border border-emerald-500/40 text-xs sm:text-sm font-mono font-bold text-emerald-200 shadow-sm"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span className="truncate">{lbl.replace(/^-\s*/, '').split(':')[0]?.trim() || lbl.replace(/^-\s*/, '')}</span>
                      </div>
                      {lbl.includes(':') && (
                        <span className="text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-md font-black text-xs sm:text-sm shrink-0 border border-emerald-500/30">
                          {lbl.split(':')[1]?.trim()}
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 font-bold p-1">{telemetry.popups?.details?.label_terdeteksi || 'Semua label lengkap'}</span>
                )}
              </div>
            </div>

            {/* Tombol Lanjutkan */}
            <button
              type="button"
              onClick={handleCloseFlipModal}
              className="w-full py-3 sm:py-3.5 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-sm sm:text-base font-black rounded-xl shadow-lg shadow-emerald-600/40 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99] text-center mt-1"
            >
              LANJUTKAN KE SISI BELAKANG →
            </button>
          </div>
        </DraggableFloatingCard>
      )}

      {/* 6. DRAGGABLE FLOATING POPUP: NG ABNORMALITY & KONFIRMASI */}
      {showNgModal && (
        <DraggableFloatingCard
          title="ALARM CACAT (NG) AKTIF"
          badge="KONFIRMASI CACAT"
          color="rose"
          icon={ShieldAlert}
          onClose={() => handleResolveNg('DISMISS')}
        >
          <div className="space-y-3">
            <div className="text-center">
              <div className="inline-flex items-center gap-1.5 bg-rose-500/30 border border-rose-400 px-3 py-0.5 rounded-full text-rose-200 font-black text-xs uppercase tracking-wider animate-pulse mb-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>SIRENE & ALARM NG AKTIF!</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black text-white">
                ⚠️ CACAT / NG TERDETEKSI! ⚠️
              </h2>
              <p className="text-xs text-rose-300 font-medium mt-0.5">
                Periksa bukti foto cacat di bawah, lalu tentukan konfirmasi.
              </p>
            </div>

            {/* Foto Bukti Cacat Snapshot */}
            {telemetry.popups?.ng_image_url ? (
              <div className="rounded-xl overflow-hidden border-2 border-rose-500 bg-black max-h-56 flex items-center justify-center shadow-lg relative group">
                <img
                  src={telemetry.popups.ng_image_url}
                  alt="Snapshot Cacat NG"
                  className="w-full h-full object-contain max-h-56"
                />
                <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-[10px] text-rose-300 font-mono border border-rose-500/50">
                  BUKTI SNAPSHOT AI
                </span>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-900 border border-rose-500/40 text-center text-xs text-rose-300">
                Memproses snapshot foto cacat...
              </div>
            )}

            {/* Tombol Konfirmasi NG / False Alarm */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                disabled={ngResolving}
                onClick={() => handleResolveNg('DISMISS')}
                className="w-full py-2.5 px-3 bg-slate-800 hover:bg-slate-700 border border-white/20 text-slate-200 font-bold rounded-xl shadow text-xs uppercase tracking-wide transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <span>❌ BUKAN NG (ABAIKAN)</span>
              </button>

              <button
                type="button"
                disabled={ngResolving}
                onClick={() => handleResolveNg('CONFIRM_NG')}
                className="w-full py-2.5 px-3 bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black rounded-xl shadow-lg shadow-rose-600/50 text-xs uppercase tracking-wide transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <span>🚨 YA, KONFIRMASI NG</span>
              </button>
            </div>
          </div>
        </DraggableFloatingCard>
      )}

      {/* 7. MODAL POPUP: SIMULATOR DEMO SISON DENGAN PRESET QTY */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-xl bg-slate-900 border-2 border-indigo-500/60 rounded-3xl p-6 sm:p-8 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
              <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2.5">
                <Send className="w-5 h-5 text-indigo-400" />
                <span>Simulator Transaksi SISON (Demo Multi-Sisi)</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowDemoModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Quick Preset Buttons */}
            <div className="mb-3">
              <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase">
                Pilih Target QTY Cepat:
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 5, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setDemoQtyPreset(num)}
                    className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-indigo-600 border border-white/15 text-white font-black text-xs sm:text-sm transition-all cursor-pointer hover:scale-105 active:scale-95"
                  >
                    {num} PCS
                  </button>
                ))}
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-2 font-medium">
              Payload JSON Transaksi SISON:
            </p>

            <textarea
              rows={7}
              value={demoJson}
              onChange={(e) => setDemoJson(e.target.value)}
              className="w-full p-3.5 bg-slate-950 border-2 border-white/15 rounded-xl font-mono text-xs text-emerald-300 focus:outline-none focus:border-indigo-400 leading-relaxed"
            />

            <div className="mt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowDemoModal(false)}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSendDemoSison}
                disabled={sendingDemo}
                className="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                <span>{sendingDemo ? 'Mengirim...' : '🚀 Kirim Simulasi SISON'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
