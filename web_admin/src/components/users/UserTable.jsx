import React from 'react';
import { UserCheck, Shield, Edit, Trash2 } from 'lucide-react';
import DataTable from '../DataTable';

export default function UserTable({
  headers,
  loading,
  users,
  onEdit,
  onDelete
}) {
  return (
    <div className="glass-card p-6 border border-white/10 rounded-2xl">
      <DataTable headers={headers} isLoading={loading} emptyMessage="Tidak ada data user yang sesuai dengan filter.">
        {users.map((u) => (
          <tr key={u.id} className="hover:bg-white/5 transition-colors">
            <td className="p-4 text-xs font-mono text-slate-400 text-center">#{u.id}</td>
            <td className="p-4 text-xs font-mono font-bold text-sky-300 text-center">
              {u.nik ? (
                <span className="px-2.5 py-1 rounded-lg bg-sky-950/60 border border-sky-400/30">
                  {u.nik}
                </span>
              ) : (
                <span className="text-slate-500">-</span>
              )}
            </td>
            <td className="p-4 font-bold text-white text-center">
              <div className="flex items-center justify-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-400 shrink-0" />
                <span>{u.username}</span>
              </div>
            </td>
            <td className="p-4 text-slate-200 text-sm text-center">{u.fullname || '-'}</td>
            <td className="p-4 text-center">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border ${
                u.role === 'pengawas'
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
              }`}>
                <Shield className="w-3 h-3" />
                {u.role}
              </span>
            </td>
            <td className="p-4 text-center">
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                u.is_active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
              }`}>
                {u.is_active ? 'Aktif' : 'Non-Aktif'}
              </span>
            </td>
            <td className="p-4 text-center">
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => onEdit(u)}
                  className="p-2 text-xs font-semibold text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-xl hover:bg-blue-500 hover:text-white transition-all cursor-pointer"
                  title="Edit User"
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDelete(u)}
                  className="p-2 text-xs font-semibold text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl hover:bg-rose-500 hover:text-white transition-all cursor-pointer"
                  title="Hapus User"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </DataTable>
    </div>
  );
}
