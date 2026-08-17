import React from 'react';
import { Lock, AlertTriangle, Trash2 } from 'lucide-react';

export default function UserDeleteModal({
  targetUser,
  adminPassword,
  setAdminPassword,
  deleting,
  onDelete,
  onClose
}) {
  if (!targetUser) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-md p-7 glass-card border-2 border-rose-500/40 rounded-3xl shadow-2xl space-y-5">
        <div className="flex items-center gap-3 pb-3 border-b border-white/10">
          <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0 shadow-lg">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white leading-tight">Konfirmasi Hapus User</h3>
            <p className="text-xs text-rose-300 font-medium">Otorisasi admin diperlukan</p>
          </div>
        </div>

        {/* Detail Target User */}
        <div className="p-3.5 bg-slate-950/80 rounded-2xl border border-white/10 space-y-1.5 text-xs text-slate-300">
          <div className="flex justify-between">
            <span className="text-slate-400 font-bold">Target User:</span>
            <span className="font-extrabold text-white">{targetUser.username}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 font-bold">Nama Lengkap:</span>
            <span className="font-bold text-slate-200">{targetUser.fullname || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 font-bold">NIK:</span>
            <span className="font-mono font-bold text-sky-300">{targetUser.nik || '-'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400 font-bold">Role:</span>
            <span className="font-extrabold uppercase text-amber-400">{targetUser.role}</span>
          </div>
        </div>

        <form onSubmit={onDelete} className="space-y-4">
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-300 mb-1.5">
              Password Admin Anda (Akun Login) *
            </label>
            <div className="relative">
              <input
                type="password"
                required
                autoFocus
                placeholder="Masukkan password admin Anda..."
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border-2 border-rose-500/40 rounded-xl text-white text-sm focus:outline-none focus:border-rose-400 transition-colors"
              />
              <Lock className="w-4 h-4 text-rose-400 absolute left-3.5 top-3" />
            </div>
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-amber-300 font-semibold">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>Aksi penghapusan akan dicatat permanen di Log Audit sistem.</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              disabled={deleting}
              onClick={onClose}
              className="px-5 py-2.5 text-xs font-extrabold text-slate-300 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 cursor-pointer disabled:opacity-50"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={deleting || !adminPassword}
              className="px-5 py-2.5 text-xs font-black text-white bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 rounded-xl shadow-lg shadow-rose-600/30 disabled:opacity-40 cursor-pointer flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{deleting ? 'Memverifikasi...' : 'Hapus User Permanen'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
