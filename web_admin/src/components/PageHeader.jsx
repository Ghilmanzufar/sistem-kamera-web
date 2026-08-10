import React from 'react';

export default function PageHeader({ title, highlightTitle, subtitle, actionButton }) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-6 border-b-2 border-white/10 gap-4">
      <div>
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white flex items-center gap-2">
          <span>{title}</span> {highlightTitle && <span className="text-blue-400">{highlightTitle}</span>}
        </h1>
        {subtitle && <p className="text-slate-400 text-sm sm:text-base font-medium mt-1.5">{subtitle}</p>}
      </div>
      {actionButton && <div className="shrink-0">{actionButton}</div>}
    </div>
  );
}
