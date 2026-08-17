import React from 'react';
import { Filter, Search, RotateCcw } from 'lucide-react';

export default function UserFilterCard({
  searchQuery,
  setSearchQuery,
  roleFilter,
  setRoleFilter,
  statusFilter,
  setStatusFilter,
  totalCount,
  filteredCount,
  onResetFilters
}) {
  return (
    <div className="glass-card p-5 border border-white/10 rounded-2xl shadow-xl space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <Filter className="w-4 h-4 text-blue-400" />
          <h3 className="font-extrabold text-white text-sm sm:text-base">Filter Pengguna</h3>
        </div>
        <span className="text-xs font-bold text-slate-400">
          Ditemukan: <strong className="text-white">{filteredCount}</strong> dari {totalCount} pengguna
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {/* Pencarian Username / Nama / NIK */}
        <div className="sm:col-span-2 lg:col-span-2 relative">
          <input
            type="text"
            placeholder="Cari username, nama lengkap, atau NIK..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-400 transition-colors"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
        </div>

        {/* Filter Role */}
        <div>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs sm:text-sm text-white font-bold focus:outline-none focus:border-blue-400 transition-colors"
          >
            <option value="ALL">Semua Role</option>
            <option value="pengawas">Pengawas</option>
            <option value="operator">Operator</option>
          </select>
        </div>

        {/* Filter Status & Reset */}
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 px-3.5 py-2.5 bg-slate-900 border border-white/10 rounded-xl text-xs sm:text-sm text-white font-bold focus:outline-none focus:border-blue-400 transition-colors"
          >
            <option value="ALL">Semua Status</option>
            <option value="ACTIVE">Aktif Saja</option>
            <option value="INACTIVE">Non-Aktif Saja</option>
          </select>

          <button
            type="button"
            onClick={onResetFilters}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-white/10 transition-all cursor-pointer shadow-md"
            title="Reset Filter"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
