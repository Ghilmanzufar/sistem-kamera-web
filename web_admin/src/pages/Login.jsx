import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Camera, Lock, User as UserIcon, AlertCircle, HelpCircle, Clock, ArrowRight } from 'lucide-react';
import api from '../api/client';

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [shift, setShift] = useState('Shift 1');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('admin_token') || localStorage.getItem('operator_token');
    const role = localStorage.getItem('user_role');
    if (token) {
      if (role === 'operator') {
        navigate('/operator');
      } else if (role === 'pengawas' || role === 'admin') {
        navigate('/dashboard');
      }
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await api.post('/api/login', {
        username,
        password,
        shift
      });

      if (res.data && res.data.token) {
        const role = res.data.role;
        localStorage.setItem('admin_token', res.data.token);
        localStorage.setItem('operator_token', res.data.token);
        localStorage.setItem('user_role', role);
        localStorage.setItem('username', res.data.username);
        localStorage.setItem('operator_name', res.data.fullname || res.data.username);
        localStorage.setItem('operator_shift', res.data.shift || shift);

        // Otomatis arahkan sesuai role
        if (role === 'operator') {
          navigate('/operator');
        } else {
          navigate('/dashboard');
        }
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
      <div className="w-full max-w-lg p-6 sm:p-10 glass-card border border-white/15 rounded-3xl shadow-2xl backdrop-blur-xl">
        <div className="text-center mb-7">
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
            Quality Control & Defect Detection System
          </p>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-500/15 border-2 border-rose-500/30 text-rose-300 text-sm font-medium flex items-center gap-3 shadow-lg shadow-rose-950/20">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Pilihan Shift Kerja */}
          <div>
            <label className="block text-xs font-bold tracking-wider uppercase text-slate-300 mb-2">
              Pilih Shift Kerja
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['Shift 1', 'Shift 2', 'Shift 3'].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setShift(s)}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    shift === s
                      ? 'bg-blue-500/20 border-blue-400 text-blue-300 shadow-md shadow-blue-500/10'
                      : 'bg-slate-900/60 border-white/10 text-slate-400 hover:border-white/30'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs font-bold tracking-wider uppercase text-slate-300 mb-2">
              Username / NPK
            </label>
            <div className="relative flex items-center">
              <UserIcon className="w-5 h-5 absolute left-4 text-slate-400" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Masukkan username / NPK"
                className="w-full pl-12 pr-4 py-3.5 bg-slate-900/90 border-2 border-white/15 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 transition-all text-sm font-sans"
              />
            </div>
          </div>

          {/* Password / PIN */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold tracking-wider uppercase text-slate-300">
                PIN / Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan PIN / Password"
                className="w-full pl-12 pr-4 py-3.5 bg-slate-900/90 border-2 border-white/15 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-400/30 transition-all text-sm font-sans"
              />
            </div>
          </div>

          {/* Tombol Login */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold rounded-2xl shadow-xl shadow-blue-600/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base cursor-pointer flex items-center justify-center gap-2 mt-2"
          >
            <span>{loading ? 'Memverifikasi...' : 'MASUK KE SISTEM'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-white/10 text-center">
          <p className="text-xs text-slate-400">
            Sistem secara otomatis mendeteksi role akun Anda (Operator ➡️ Layar Inspeksi | Pengawas/Admin ➡️ Dashboard).
          </p>
        </div>
      </div>
    </div>
  );
}
