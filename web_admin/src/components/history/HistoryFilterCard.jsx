import React from 'react';
import { Filter, Search, User, RotateCcw } from 'lucide-react';

export default function HistoryFilterCard({
  filterType,
  setFilterType,
  dateFilter,
  setDateFilter,
  monthFilter,
  setMonthFilter,
  partFilter,
  setPartFilter,
  opFilter,
  setOpFilter,
  statusFilter,
  setStatusFilter,
  operatorOnly,
  onSearchSubmit,
  onResetFilters
}) {
  return (
    <div className="glass-card p-6 sm:p-7 rounded-3xl border-2 border-white/10 space-y-5 shadow-2xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <Filter className="w-5 h-5 text-blue-400" />
          <h3 className="font-extrabold text-white text-base sm:text-lg">Filter Log Data</h3>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => { setFilterType('daily'); setMonthFilter(''); }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
              filterType === 'daily'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-black'
                : 'bg-black/20 text-slate-400 hover:text-white border border-white/10'
            }`}
          >
            Harian
          </button>
          <button
            type="button"
            onClick={() => { setFilterType('monthly'); setDateFilter(''); }}
            className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
              filterType === 'monthly'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-black'
                : 'bg-black/20 text-slate-400 hover:text-white border border-white/10'
            }`}
          >
            Bulanan
          </button>
        </div>
      </div>

      <form onSubmit={onSearchSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filterType === 'daily' ? (
          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-300 mb-1.5">Tanggal</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full bg-slate-900 border-2 border-white/10 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        ) : (
          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-300 mb-1.5">Bulan & Tahun</label>
            <input
              type="month"
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="w-full bg-slate-900 border-2 border-white/10 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        )}

        <div>
          <label className="block text-xs sm:text-sm font-bold text-slate-300 mb-1.5">Cari Part Number</label>
          <div className="relative">
            <input
              type="text"
              placeholder="Contoh: 74231..."
              value={partFilter}
              onChange={(e) => setPartFilter(e.target.value)}
              className="w-full bg-slate-900 border-2 border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors font-mono"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          </div>
        </div>

        {!operatorOnly && (
          <div>
            <label className="block text-xs sm:text-sm font-bold text-slate-300 mb-1.5">Operator</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Filter nama operator..."
                value={opFilter}
                onChange={(e) => setOpFilter(e.target.value)}
                className="w-full bg-slate-900 border-2 border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
              />
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs sm:text-sm font-bold text-slate-300 mb-1.5">Status Deteksi</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-slate-900 border-2 border-white/10 rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-white focus:outline-none focus:border-blue-500 transition-colors font-bold"
          >
            <option value="ALL">Semua Status</option>
            <option value="OK">OK Saja</option>
            <option value="NG">NG Saja</option>
          </select>
        </div>

        <div className="flex items-end gap-2">
          <button
            type="submit"
            className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg shadow-blue-600/30 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Search className="w-4 h-4" />
            <span>Terapkan Filter</span>
          </button>
          <button
            type="button"
            onClick={onResetFilters}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl border-2 border-white/10 transition-all cursor-pointer shadow-md"
            title="Reset Filter"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
