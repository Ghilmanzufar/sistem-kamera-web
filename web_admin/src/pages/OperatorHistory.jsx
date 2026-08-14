import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Video, RefreshCw, Power, X, User, Sun, Moon } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api/client';
import History from './History';
import { getStoredTheme, toggleTheme, applyTheme } from '../utils/theme';

export default function OperatorHistory() {
  const navigate = useNavigate();
  const operatorName = localStorage.getItem('operator_name') || localStorage.getItem('username') || 'Operator';

  // Theme State
  const [themeMode, setThemeMode] = useState(getStoredTheme());

  useEffect(() => {
    const current = getStoredTheme();
    applyTheme(current);
    setThemeMode(current);
  }, []);

  // Pengecekan Kedaluwarsa Sesi (8 Jam untuk Operator)
  useEffect(() => {
    const checkSessionExpiry = () => {
      const token = localStorage.getItem('operator_token') || localStorage.getItem('admin_token');
      if (!token) {
        navigate('/login');
        return;
      }
      try {
        const parts = token.split('.');
        if (parts.length === 2) {
          const payloadB64 = parts[0];
          const padding = '='.repeat((4 - (payloadB64.length % 4)) % 4);
          const base64 = payloadB64.replace(/-/g, '+').replace(/_/g, '/');
          const jsonPayload = JSON.parse(atob(base64 + padding));
          if (jsonPayload.exp && Date.now() / 1000 > jsonPayload.exp) {
            toast.error('Sesi kerja Anda telah kedaluwarsa (lebih dari 8 jam). Silakan login kembali.', { duration: 5000 });
            localStorage.removeItem('admin_token');
            localStorage.removeItem('operator_token');
            localStorage.removeItem('user_role');
            localStorage.removeItem('username');
            localStorage.removeItem('operator_name');
            navigate('/login');
          }
        }
      } catch {}
    };

    checkSessionExpiry();
    const sessionTimer = setInterval(checkSessionExpiry, 30000);
    return () => clearInterval(sessionTimer);
  }, [navigate]);

  const handleThemeToggle = () => {
    const next = toggleTheme();
    setThemeMode(next);
  };

  // Camera Management States for Operator
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraList, setCameraList] = useState([]);
  const [loadingCameras, setLoadingCameras] = useState(false);
  const [scanningCameras, setScanningCameras] = useState(false);
  const [switchingCameraId, setSwitchingCameraId] = useState(null);

  const fetchCameras = async (silent = false) => {
    if (!silent) setLoadingCameras(true);
    try {
      const res = await api.get('/api/admin/cameras');
      setCameraList(res.data || []);
    } catch (err) {
      if (!silent) toast.error(err.response?.data?.detail || 'Gagal mengambil daftar kamera');
    } finally {
      if (!silent) setLoadingCameras(false);
    }
  };

  const handleScanCameras = async () => {
    setScanningCameras(true);
    try {
      const res = await api.post('/api/admin/cameras/scan');
      setCameraList(res.data || []);
      toast.success(`Pindai selesai! Ditemukan ${res.data?.length || 0} kamera hardware.`);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gagal memindai perangkat kamera hardware');
    } finally {
      setScanningCameras(false);
    }
  };

  const handleToggleCamera = async (c) => {
    setSwitchingCameraId(c.id);
    try {
      const res = await api.put(`/api/admin/cameras/${c.id}/toggle`);
      if (res.data?.is_active) {
        toast.success(`Kamera "${c.name || 'Kamera'}" dinyalakan (ON / Aktif)!`, { icon: '🟢' });
      } else {
        toast(`Kamera "${c.name || 'Kamera'}" dimatikan (OFF / Standby).`, { icon: '⏸️' });
      }
      await fetchCameras(true);
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Gagal mengubah saklar kamera');
    } finally {
      setSwitchingCameraId(null);
    }
  };

  return (
    <div className="min-h-screen app-bg-gradient flex flex-col p-4 sm:p-6 font-sans">
      {/* Operator History Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-slate-900/90 p-4 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/operator')}
            className="group py-2.5 px-5 rounded-2xl bg-gradient-to-r from-blue-600/90 via-indigo-600/90 to-blue-700/90 hover:from-blue-500 hover:via-indigo-500 hover:to-blue-600 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2.5 border border-blue-400/30 shadow-lg shadow-blue-600/25 transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
          >
            <div className="w-6 h-6 rounded-lg bg-white/15 border border-white/20 flex items-center justify-center text-sky-200 group-hover:scale-110 group-hover:bg-white/25 transition-transform duration-200 shrink-0">
              <ArrowLeft className="w-3.5 h-3.5" />
            </div>
            <span>Kembali ke Layar Kamera</span>
          </button>

          <div>
            <h1 className="text-lg sm:text-xl font-black text-white">
              Riwayat Hasil Kerja: <span className="text-blue-400">{operatorName}</span>
            </h1>
            <p className="text-xs text-slate-400">Data hasil inspeksi AI yang tercatat atas nama akun Anda</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Tombol Ganti Tema Light / Dark Mode */}
          <button
            type="button"
            onClick={handleThemeToggle}
            className="group py-2.5 px-3.5 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 text-amber-400 hover:text-amber-300 border border-white/10 shadow-lg backdrop-blur-md transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0 active:scale-95 flex items-center gap-2"
            title={themeMode === 'light' ? 'Ganti ke Mode Gelap' : 'Ganti ke Mode Terang'}
          >
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform duration-200 shrink-0">
              {themeMode === 'light' ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
            </div>
            <span className="hidden sm:inline text-xs font-black text-slate-200">
              {themeMode === 'light' ? 'Mode Gelap' : 'Mode Terang'}
            </span>
          </button>

          {/* Tombol Pilih & Atur Kamera di Samping Nama Operator */}
          <button
            type="button"
            onClick={() => { setShowCameraModal(true); fetchCameras(); }}
            className="group py-2.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-600/90 via-teal-600/90 to-emerald-700/90 hover:from-emerald-500 hover:via-teal-500 hover:to-emerald-600 text-white font-extrabold text-xs sm:text-sm flex items-center gap-2.5 border border-emerald-400/30 shadow-lg shadow-emerald-600/25 transition-all cursor-pointer hover:-translate-y-0.5 active:translate-y-0 active:scale-95"
          >
            <div className="w-6 h-6 rounded-lg bg-white/15 border border-white/20 flex items-center justify-center text-emerald-200 group-hover:scale-110 group-hover:bg-white/25 transition-transform duration-200 shrink-0">
              <Video className="w-3.5 h-3.5" />
            </div>
            <span>Pilih Kamera</span>
          </button>

          {/* Badge Nama Operator */}
          <div className="flex items-center gap-2 bg-slate-950/80 px-3.5 py-1.5 rounded-2xl border border-white/10 text-xs sm:text-sm font-extrabold text-sky-300 shadow-inner backdrop-blur-md">
            <div className="w-6 h-6 rounded-lg bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400 shrink-0">
              <User className="w-3.5 h-3.5" />
            </div>
            <span className="text-white">{operatorName}</span>
          </div>
        </div>
      </div>

      {/* Embedded Existing History Component Locked to Logged-in Operator */}
      <div className="flex-1 bg-slate-900/40 p-4 sm:p-6 rounded-3xl border border-white/10 backdrop-blur-md shadow-2xl overflow-y-auto">
        <History operatorOnly={true} operatorName={operatorName} />
      </div>

      {/* MODAL POPUP: PEMILIHAN & SAKLAR KAMERA OPERATOR */}
      {showCameraModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
          <div className="w-full max-w-2xl bg-slate-900 border-2 border-emerald-500/50 rounded-3xl p-6 sm:p-8 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-white leading-tight">
                    Pengaturan & Pemilihan Kamera USB
                  </h3>
                  <p className="text-xs text-slate-400 font-bold">
                    Pilih kamera aktif untuk live stream & inspeksi AI di lini kerja
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCameraModal(false)}
                className="text-slate-400 hover:text-white cursor-pointer p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Toolbar Scan Ulang */}
            <div className="flex items-center justify-between gap-3 bg-slate-950 p-3 rounded-2xl border border-white/10 text-xs">
              <span className="text-slate-300 font-medium">
                💡 Baru mencolok kabel USB kamera baru?
              </span>
              <button
                type="button"
                onClick={handleScanCameras}
                disabled={scanningCameras}
                className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition-all disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${scanningCameras ? 'animate-spin' : ''}`} />
                <span>{scanningCameras ? 'Memindai...' : 'Deteksi Ulang Hardware'}</span>
              </button>
            </div>

            {/* Daftar Kamera */}
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {loadingCameras ? (
                <div className="text-center py-8 text-slate-400 text-xs font-bold animate-pulse">
                  Memuat daftar perangkat kamera...
                </div>
              ) : cameraList.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs font-bold bg-slate-950/60 rounded-2xl border border-white/5">
                  Tidak ada kamera terdeteksi. Pastikan kabel USB kamera terhubung.
                </div>
              ) : (
                cameraList.map((c) => {
                  const isSwitching = switchingCameraId === c.id;
                  const src = String(c?.source || '0');
                  const camName = c?.name || `USB Camera (Index ${src})`;

                  return (
                    <div
                      key={c.id || src}
                      className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        c.is_active
                          ? 'bg-emerald-950/40 border-emerald-500/50 shadow-md shadow-emerald-950/50'
                          : 'bg-slate-950/60 border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          c.is_active ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-400/40' : 'bg-slate-800 text-slate-500'
                        }`}>
                          <Video className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-white text-sm truncate">{camName}</span>
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-black/40 text-slate-300 border border-white/10 font-bold">
                              Port: {src}
                            </span>
                          </div>
                          <div className="text-xs mt-0.5">
                            {c.is_active ? (
                              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                                AKTIF DIGUNAKAN
                              </span>
                            ) : (
                              <span className="text-slate-500 font-bold">Standby (OFF)</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Tombol Saklar */}
                      <button
                        type="button"
                        disabled={isSwitching}
                        onClick={() => handleToggleCamera(c)}
                        className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 shadow transition-all cursor-pointer disabled:opacity-50 ${
                          c.is_active
                            ? 'bg-slate-800 hover:bg-slate-700 text-rose-300 border border-rose-500/30'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-600/30'
                        }`}
                      >
                        <Power className="w-3.5 h-3.5" />
                        <span>{isSwitching ? 'Memproses...' : c.is_active ? 'Matikan' : 'Aktifkan'}</span>
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Modal */}
            <div className="pt-2 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setShowCameraModal(false)}
                className="py-2.5 px-6 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
