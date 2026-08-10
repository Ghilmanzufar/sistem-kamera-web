import React from 'react';

export default function StatusBadge({ status }) {
  let badgeStyle = "bg-slate-500/20 text-slate-300 border-slate-500/30";
  let text = status;

  if (typeof status === 'number') {
    if (status === 1) {
      badgeStyle = "bg-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-emerald-950/20";
      text = "Selesai (OK)";
    } else if (status === 2) {
      badgeStyle = "bg-amber-500/20 text-amber-400 border-amber-500/40 animate-pulse";
      text = "RUNNING";
    } else {
      badgeStyle = "bg-rose-500/20 text-rose-400 border-rose-500/40";
      text = "NG / Gagal";
    }
  } else if (typeof status === 'string') {
    const s = status.toUpperCase();
    if (s.includes('OK') || s === 'SELESAI' || s === 'ACTIVE' || s === 'LOGIN') {
      badgeStyle = "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
    } else if (s.includes('RUNNING') || s === 'PENDING' || s.includes('MANUAL')) {
      badgeStyle = "bg-amber-500/20 text-amber-400 border-amber-500/40";
    } else if (s.includes('NG') || s === 'FAILED' || s === 'LOGOUT' || s === 'DELETE' || s.includes('ALARM')) {
      badgeStyle = "bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse";
    } else {
      badgeStyle = "bg-blue-500/20 text-blue-400 border-blue-500/40";
    }
  }

  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-xl text-xs sm:text-sm font-black tracking-wide border-2 shadow-sm ${badgeStyle}`}>
      <span className="w-2 h-2 rounded-full bg-current"></span>
      <span>{text}</span>
    </span>
  );
}
