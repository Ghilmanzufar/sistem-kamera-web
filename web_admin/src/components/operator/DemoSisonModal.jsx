import React from 'react';
import { Send, X } from 'lucide-react';

export default function DemoSisonModal({
  isOpen,
  demoJson,
  setDemoJson,
  onSetPresetQty,
  sendingDemo,
  onSendDemo,
  onClose
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-xl bg-slate-900 border-2 border-indigo-500/60 rounded-3xl p-6 sm:p-8 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
          <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2.5">
            <Send className="w-5 h-5 text-indigo-400" />
            <span>Simulator Transaksi SISON (Demo Multi-Sisi)</span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white cursor-pointer p-1 rounded-lg hover:bg-slate-800"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Quick Preset Buttons */}
        <div className="mb-3">
          <label className="block text-xs font-bold text-slate-300 mb-1.5 uppercase">
            Pilih Target QTY Cepat:
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 5, 10].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => onSetPresetQty(num)}
                className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-indigo-600 border border-white/15 text-white font-black text-xs sm:text-sm transition-all cursor-pointer hover:scale-105 active:scale-95"
              >
                {num} PCS
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-slate-300 mb-2 font-medium">
          Payload JSON Transaksi SISON:
        </p>

        <textarea
          rows={7}
          value={demoJson}
          onChange={(e) => setDemoJson(e.target.value)}
          className="w-full p-3.5 bg-slate-950 border-2 border-white/15 rounded-xl font-mono text-xs text-emerald-300 focus:outline-none focus:border-indigo-400 leading-relaxed"
        />

        <div className="mt-4 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-sm cursor-pointer"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onSendDemo}
            disabled={sendingDemo}
            className="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-sm flex items-center gap-2 shadow-lg shadow-indigo-600/30 cursor-pointer disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{sendingDemo ? 'Mengirim...' : '🚀 Kirim Simulasi SISON'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
