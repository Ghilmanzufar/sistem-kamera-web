import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Camera, ShieldCheck, Lock, User as UserIcon, AlertCircle, HelpCircle, Clock } from 'lucide-react';
import api from '../api/client';

export default function Login() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('operator'); // 'operator' | 'admin'
  
  // Form Operator
  const [opUsername, setOpUsername] = useState('');
  const [opPin, setOpPin] = useState('');
  const [opShift, setOpShift] = useState('Shift 1');

  // Form Admin
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const opToken = localStorage.getItem('operator_token');
    const adminToken = localStorage.getItem('admin_token');
    const role = localStorage.getItem('user_role');

    if (opToken) {
      navigate('/operator');
    } else if (adminToken) {
      navigate(role === 'operator' ? '/operator/history' : '/dashboard');
    }
  }, [navigate]);

  const handleOperatorLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/api/operator/login', {
        username: opUsername,
        pin: opPin,
        shift: opShift
      });

      if (res.data && res.data.token) {
        localStorage.setItem('operator_token', res.data.token);
        localStorage.setItem('admin_token', res.data.token); // Also used by client interceptor for api calls
        localStorage.setItem('operator_name', res.data.fullname);
        localStorage.setItem('operator_shift', res.data.shift);
        localStorage.setItem('user_role', res.data.role);
        localStorage.setItem('username', res.data.username);
        navigate('/operator');
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Gagal terhubung ke server backend');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/api/admin-login', {
        username: adminUsername,
        password: adminPassword
      });

      if (res.data && res.data.token) {
        localStorage.setItem('admin_token', res.data.token);
        localStorage.setItem('user_role', res.data.role);
        localStorage.setItem('username', res.data.username);
        navigate(res.data.role === 'operator' ? '/operator/history' : '/dashboard');
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Gagal terhubung ke server backend');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen app-bg-gradient flex items-center justify-center p-4 sm:p-6 font-sans">
      <div className="w-full max-w-xl p-6 sm:p-10 glass-card border border-white/15 rounded-3xl shadow-2xl backdrop-blur-xl">
        <div className="text-center mb-6">
          <img
            src="/LOGO_SUGITY.png"
            onError={(e) => { e.target.style.display = 'none'; }}
            alt="Logo Sugity"
            className="h-16 w-auto mx-auto mb-3 object-contain drop-shadow-md"
          />
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-wide">
            Sistem <span className="text-blue-400">Kamera Inspeksi AI</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 font-medium">
            Quality Control & Automatic Defect Detection
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-slate-900/80 p-1.5 rounded-2xl border border-white/10 mb-6">
          <button
            type="button"
            onClick={() => { setActiveTab('operator'); setError(''); }}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'operator'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>Operator Line</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('admin'); setError(''); }}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'admin'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Admin / Pengawas</span>
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/15 border-2 border-rose-500/30 text-rose-300 text-sm font-medium flex items-center gap-3 shadow-lg shadow-rose-950/20">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* TAB 1: OPERATOR LOGIN */}
        {activeTab === 'operator' && (
          <form onSubmit={handleOperatorLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold tracking-wider uppercase text-slate-300 mb-2">
                Pilih Shift Kerja
              </label>
              <div className="grid grid-cols-3 gap-2">
                {['Shift 1', 'Shift 2', 'Shift 3'].map((shift) => (
                  <button
                    key={shift}
                    type="button"
                    onClick={() => setOpShift(shift)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      opShift === shift
                        ? 'bg-blue-500/20 border-blue-400 text-blue-300'
                        : 'bg-slate-900/60 border-white/10 text-slate-400 hover:border-white/30'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    {shift}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold tracking-wider uppercase text-slate-300 mb-2">
                Username / NPK Operator
              </label>
              <div className="relative flex items-center">
                <UserIcon className="w-5 h-5 absolute left-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={opUsername}
                  onChange={(e) => setOpUsername(e.target.value)}
                  placeholder="Contoh: op01"
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-900/90 border-2 border-white/15 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 transition-all text-sm font-sans"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold tracking-wider uppercase text-slate-300 mb-2">
                PIN / Password
              </label>
              <div className="relative flex items-center">
                <Lock className="w-5 h-5 absolute left-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={opPin}
                  onChange={(e) => setOpPin(e.target.value)}
                  placeholder="Masukkan PIN"
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-900/90 border-2 border-white/15 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 transition-all text-sm font-sans"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold rounded-2xl shadow-xl shadow-blue-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base cursor-pointer flex items-center justify-center gap-2"
            >
              <Camera className="w-5 h-5" />
              {loading ? 'Menghubungkan...' : 'Mulai Layar Kamera Inspeksi →'}
            </button>
          </form>
        )}

        {/* TAB 2: ADMIN LOGIN */}
        {activeTab === 'admin' && (
          <form onSubmit={handleAdminLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold tracking-wider uppercase text-slate-300 mb-2">
                Username Admin
              </label>
              <div className="relative flex items-center">
                <UserIcon className="w-5 h-5 absolute left-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  placeholder="Username akun admin"
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-900/90 border-2 border-white/15 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30 transition-all text-sm font-sans"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold tracking-wider uppercase text-slate-300">
                  Password Admin
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
                >
                  <HelpCircle className="w-3.5 h-3.5" />
                  Lupa Password?
                </Link>
              </div>
              <div className="relative flex items-center">
                <Lock className="w-5 h-5 absolute left-4 text-slate-400" />
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Password akun admin"
                  className="w-full pl-12 pr-4 py-3.5 bg-slate-900/90 border-2 border-white/15 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/30 transition-all text-sm font-sans"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold rounded-2xl shadow-xl shadow-indigo-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base cursor-pointer flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-5 h-5" />
              {loading ? 'Memproses...' : 'Masuk Dashboard Admin →'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
