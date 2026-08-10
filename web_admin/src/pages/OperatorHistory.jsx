import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera } from 'lucide-react';
import History from './History';

export default function OperatorHistory() {
  const navigate = useNavigate();
  const operatorName = localStorage.getItem('operator_name') || localStorage.getItem('username') || 'Operator';

  return (
    <div className="min-h-screen app-bg-gradient flex flex-col p-4 sm:p-6 font-sans">
      {/* Operator History Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6 bg-slate-900/90 p-4 rounded-3xl border border-white/10 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate('/operator')}
            className="py-3 px-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm flex items-center gap-2.5 shadow-xl shadow-blue-600/30 transition-all cursor-pointer hover:scale-105 active:scale-95"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>◀️ KEMBALI KE LAYAR KAMERA</span>
          </button>

          <div>
            <h1 className="text-lg sm:text-xl font-black text-white">
              Riwayat Hasil Kerja: <span className="text-blue-400">{operatorName}</span>
            </h1>
            <p className="text-xs text-slate-400">Data hasil inspeksi AI yang tercatat atas nama akun Anda</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-950/80 px-4 py-2.5 rounded-2xl border border-white/10 text-xs sm:text-sm font-bold text-sky-300">
          <Camera className="w-4 h-4 text-sky-400" />
          <span>👤 {operatorName}</span>
        </div>
      </div>

      {/* Embedded Existing History Component Locked to Logged-in Operator */}
      <div className="flex-1 bg-slate-900/40 p-4 sm:p-6 rounded-3xl border border-white/10 backdrop-blur-md shadow-2xl overflow-y-auto">
        <History operatorOnly={true} operatorName={operatorName} />
      </div>
    </div>
  );
}
