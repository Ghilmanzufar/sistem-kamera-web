import React from 'react';

export default function StatCard({ title, value, icon: Icon, color = "blue", onClick }) {
  const colorStyles = {
    blue: "from-blue-500/20 to-indigo-500/5 text-blue-400 border-blue-500/30",
    green: "from-emerald-500/20 to-teal-500/5 text-emerald-400 border-emerald-500/30",
    emerald: "from-emerald-500/20 to-teal-500/5 text-emerald-400 border-emerald-500/30",
    rose: "from-rose-500/20 to-red-500/5 text-rose-400 border-rose-500/30",
    indigo: "from-indigo-500/20 to-purple-500/5 text-indigo-400 border-indigo-500/30",
    amber: "from-amber-500/20 to-yellow-500/5 text-amber-400 border-amber-500/30",
  };

  return (
    <div 
      onClick={onClick}
      className={`p-6 rounded-3xl border-2 bg-gradient-to-br ${colorStyles[color] || colorStyles.blue} backdrop-blur-md shadow-xl transition-all ${
        onClick ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : ''
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs sm:text-sm uppercase tracking-wider font-extrabold text-slate-400 mb-1.5 truncate">{title}</p>
          <h3 className="text-3xl sm:text-4xl font-black text-white tracking-tight">{value}</h3>
        </div>
        {Icon && (
          <div className="p-3.5 rounded-2xl bg-white/10 border border-white/15 shadow-md shrink-0">
            <Icon className="w-7 h-7" />
          </div>
        )}
      </div>
    </div>
  );
}
