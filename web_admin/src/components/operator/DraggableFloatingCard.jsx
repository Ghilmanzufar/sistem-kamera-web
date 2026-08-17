import React, { useState, useEffect, useRef } from 'react';
import { GripHorizontal, X } from 'lucide-react';

export default function DraggableFloatingCard({ title, icon: Icon, badge, color = 'emerald', onClose, children }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, initialX: 0, initialY: 0 });

  // Selalu reset posisi ke titik tengah (0,0) saat popup muncul/berganti
  useEffect(() => {
    setPosition({ x: 0, y: 0 });
  }, [title]);

  const handleMouseDown = (e) => {
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('textarea')) return;
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y,
    };
  };

  const handleTouchStart = (e) => {
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('textarea')) return;
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragRef.current = {
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        initialX: position.x,
        initialY: position.y,
      };
    }
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      setPosition({
        x: dragRef.current.initialX + dx,
        y: dragRef.current.initialY + dy,
      });
    };

    const handleTouchMove = (e) => {
      if (!isDragging || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - dragRef.current.startX;
      const dy = e.touches[0].clientY - dragRef.current.startY;
      setPosition({
        x: dragRef.current.initialX + dx,
        y: dragRef.current.initialY + dy,
      });
    };

    const handleMouseUp = () => setIsDragging(false);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove, { passive: false });
      window.addEventListener('touchend', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging]);

  const colorStyles = {
    emerald: {
      border: 'border-emerald-500',
      glow: 'shadow-emerald-950/80',
      headerBg: 'bg-emerald-950/95 border-emerald-500/40 text-emerald-300',
      badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40',
    },
    amber: {
      border: 'border-amber-500',
      glow: 'shadow-amber-950/80',
      headerBg: 'bg-amber-950/95 border-amber-500/40 text-amber-300',
      badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-400/40',
    },
    rose: {
      border: 'border-rose-500',
      glow: 'shadow-rose-950/80',
      headerBg: 'bg-rose-950/95 border-rose-500/40 text-rose-300',
      badgeBg: 'bg-rose-500/20 text-rose-300 border-rose-400/40',
    }
  }[color] || {
    border: 'border-slate-700',
    glow: 'shadow-black/80',
    headerBg: 'bg-slate-900 border-slate-700 text-slate-200',
    badgeBg: 'bg-slate-800 text-slate-300 border-slate-600',
  };

  return (
    <div
      style={{
        transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
      }}
      className={`absolute z-40 top-1/2 left-1/2 w-[94%] max-w-lg sm:max-w-xl bg-slate-950/95 backdrop-blur-xl rounded-2xl border-3 ${colorStyles.border} shadow-2xl ${colorStyles.glow} select-none animate-fadeIn`}
    >
      {/* Draggable Header Handle */}
      <div
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className={`px-4 py-2.5 rounded-t-[14px] border-b flex items-center justify-between cursor-grab active:cursor-grabbing ${colorStyles.headerBg}`}
      >
        <div className="flex items-center gap-2.5 font-black text-xs sm:text-sm uppercase tracking-wider">
          {Icon && <Icon className="w-4 h-4 shrink-0" />}
          <span className="truncate">{title}</span>
          {badge && (
            <span className={`text-[11px] px-2.5 py-0.5 rounded-full border font-black ${colorStyles.badgeBg} shrink-0`}>
              {badge}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <span className="text-[10px] sm:text-xs font-bold text-slate-300 bg-black/50 px-2.5 py-1 rounded-lg flex items-center gap-1 border border-white/10">
            <GripHorizontal className="w-3.5 h-3.5 text-emerald-400" /> <span>✥ Geser</span>
          </span>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-md hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Popup Body (Form-Fitting Zero Scroll) */}
      <div className="p-4 sm:p-5">
        {children}
      </div>
    </div>
  );
}
