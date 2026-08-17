import React from 'react';

export default function UserFormModal({
  show,
  editingUser,
  username,
  setUsername,
  nik,
  setNik,
  password,
  setPassword,
  role,
  setRole,
  fullname,
  setFullname,
  isActive,
  setIsActive,
  submitting,
  onSubmit,
  onClose
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-xl p-8 glass-card border border-white/15 rounded-3xl shadow-2xl space-y-6">
        <h3 className="text-2xl font-bold text-white mb-6">
          {editingUser ? `Edit User: ${editingUser.username}` : 'Tambah User Baru'}
        </h3>

        <form onSubmit={onSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Contoh: op_budi"
                className="w-full px-4 py-2.5 bg-black/30 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                NIK (Nomor Induk Karyawan)
              </label>
              <input
                type="text"
                value={nik}
                onChange={(e) => setNik(e.target.value)}
                placeholder="Contoh: 2026-0812"
                className="w-full px-4 py-2.5 bg-black/30 border border-white/10 rounded-xl text-white text-sm font-mono focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Nama Lengkap
            </label>
            <input
              type="text"
              value={fullname}
              onChange={(e) => setFullname(e.target.value)}
              placeholder="Contoh: Budi Santoso"
              className="w-full px-4 py-2.5 bg-black/30 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              PIN / Password {editingUser && '(Biarkan kosong jika tidak diubah)'}
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-black/30 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Role Sistem
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-blue-500"
            >
              <option value="pengawas">Pengawas (Akses Penuh)</option>
              <option value="operator">Operator (History Inspeksi Only)</option>
            </select>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="isActiveCheck"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-5 h-5 rounded bg-black/30 border-white/10 text-blue-600 focus:ring-0 cursor-pointer"
            />
            <label htmlFor="isActiveCheck" className="text-sm font-semibold text-slate-300 cursor-pointer">
              Status Akun Aktif
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-slate-300 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl shadow-lg shadow-blue-600/30 disabled:opacity-50 cursor-pointer"
            >
              {submitting ? 'Memproses...' : 'Simpan User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
