import React from 'react';

export default function StatCard({ title, value, icon: Icon, color = "blue", onClick, active = false }) {
  const colorStyles = {
    blue: "bg-slate-900/80 border-slate-700/60 text-blue-400 hover:border-blue-500/50",
    green: "bg-slate-900/80 border-slate-700/60 text-emerald-400 hover:border-emerald-500/50",
    emerald: "bg-slate-900/80 border-slate-700/60 text-emerald-400 hover:border-emerald-500/50",
    rose: "bg-slate-900/80 border-slate-700/60 text-rose-400 hover:border-rose-500/50",
    indigo: "bg-slate-900/80 border-slate-700/60 text-indigo-400 hover:border-indigo-500/50",
    amber: "bg-slate-900/80 border-slate-700/60 text-amber-400 hover:border-amber-500/50",
  };

  const isClickable = Boolean(onClick);

  return (
    <div 
      onClick={onClick}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onKeyDown={isClickable ? (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      } : undefined}
      className={`p-4 sm:p-5 rounded-xl border transition-all ${
        colorStyles[color] || colorStyles.blue
      } ${
        isClickable
          ? 'cursor-pointer hover:bg-slate-850 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950'
          : ''
      } ${
        active ? 'ring-2 ring-blue-500 border-blue-500' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1 truncate">{title}</p>
          <h3 className="text-2xl sm:text-3xl font-bold text-white tracking-tight font-mono">{value}</h3>
        </div>
        {Icon && (
          <div className="p-2.5 rounded-lg bg-black/25 border border-white/10 shrink-0">
            <Icon className="w-5 h-5 text-current" />
          </div>
        )}
      </div>
    </div>
  );
}
