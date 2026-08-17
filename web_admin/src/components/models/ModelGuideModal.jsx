import React from 'react';
import { BookOpen, Tag, ShieldAlert, AlertTriangle, Zap } from 'lucide-react';

export default function ModelGuideModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-3xl p-8 glass-card border border-white/15 rounded-3xl shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto scrollbar-thin text-slate-300 text-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">
                Standarisasi Labeling Model YOLO & Rule Inspeksi
              </h3>
              <p className="text-xs text-slate-400">
                Panduan teknis pembuatan dataset dan penamaan label untuk sistem AI Quality Control
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white font-bold"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="space-y-6">
          {/* Section 1: Overview */}
          <div className="p-4 rounded-2xl bg-black/30 border border-white/5 space-y-2">
            <h4 className="font-bold text-white text-base flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              Mengapa Standarisasi Label Wajib?
            </h4>
            <p className="text-xs leading-relaxed text-slate-300">
              Sistem inspeksi kamera beroperasi dalam mode <strong>Dual-Side Inspection (Sisi Depan / Front dan Sisi Belakang / Rear)</strong>. 
              Sistem otomatis memfilter aturan pengecekan komponen berdasarkan awalan (prefix) nama label di model YOLOv8 Anda. 
              Jika label tidak mengikuti standar, sistem tidak dapat menentukan apakah komponen tersebut harus diperiksa di sisi Front atau Rear.
            </p>
          </div>

          {/* Section 2: Prefix Rules Table with Real Case Study */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-white text-base flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-400" />
                1. Ketentuan Prefix Sisi (Studi Kasus Nyata: Part <span className="font-mono text-emerald-300">74231-0K550-00</span>)
              </h4>
              <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-300 font-mono font-bold text-xs border border-emerald-500/30">
                Standar Produksi
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Front Card */}
              <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between font-sans">
                  <span className="font-bold text-sky-300 text-sm">Sisi Depan / FRONT (F)</span>
                  <span className="px-2 py-0.5 rounded-lg bg-sky-500/20 text-sky-300 font-mono font-bold text-xs border border-sky-500/30">F-</span>
                </div>
                <p className="text-slate-300 font-sans text-xs leading-relaxed">
                  Komponen atau defect yang terlihat dari arah depan wajib diawali prefix <code className="text-sky-300 font-bold font-mono">F-</code>.
                </p>
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/5">
                    <span className="text-emerald-400 font-bold">✓ F-74231-0K550-00</span>
                    <span className="text-[10px] text-sky-300 bg-sky-500/20 px-1.5 py-0.5 rounded font-sans">Label Part (OK)</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/5">
                    <span className="text-emerald-400 font-bold">✓ F-HOLE</span>
                    <span className="text-[10px] text-sky-300 bg-sky-500/20 px-1.5 py-0.5 rounded font-sans">Lubang Depan (OK)</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/5">
                    <span className="text-rose-400 font-bold">⚠️ F-NG_SCRATCH</span>
                    <span className="text-[10px] text-rose-300 bg-rose-500/20 px-1.5 py-0.5 rounded font-sans">Goresan Depan (NG)</span>
                  </div>
                </div>
              </div>

              {/* Rear Card */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between font-sans">
                  <span className="font-bold text-amber-300 text-sm">Sisi Belakang / REAR (R)</span>
                  <span className="px-2 py-0.5 rounded-lg bg-amber-500/20 text-amber-300 font-mono font-bold text-xs border border-amber-500/30">R-</span>
                </div>
                <p className="text-slate-300 font-sans text-xs leading-relaxed">
                  Komponen atau defect yang terlihat dari arah belakang wajib diawali prefix <code className="text-amber-300 font-bold font-mono">R-</code>.
                </p>
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/5">
                    <span className="text-emerald-400 font-bold">✓ R-74231-0K550-00</span>
                    <span className="text-[10px] text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded font-sans">Body Belakang (OK)</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/5">
                    <span className="text-emerald-400 font-bold">✓ R-HOLE</span>
                    <span className="text-[10px] text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded font-sans">Lubang Baut (OK)</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/5">
                    <span className="text-emerald-400 font-bold">✓ R-KLIP-KUNING-01</span>
                    <span className="text-[10px] text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded font-sans">Klip 1 (OK)</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/5">
                    <span className="text-emerald-400 font-bold">✓ R-KLIP-KUNING-02</span>
                    <span className="text-[10px] text-amber-300 bg-amber-500/20 px-1.5 py-0.5 rounded font-sans">Klip 2 (OK)</span>
                  </div>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-black/40 border border-white/5">
                    <span className="text-rose-400 font-bold">⚠️ R-NG_KLIP_PATAH</span>
                    <span className="text-[10px] text-rose-300 bg-rose-500/20 px-1.5 py-0.5 rounded font-sans">Klip Rusak (NG)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Defect & NG Label Rules */}
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-rose-300 text-base flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                2. Standarisasi Label Kecacatan (Defect / NG)
              </h4>
              <span className="px-2.5 py-0.5 rounded-lg bg-rose-500/20 text-rose-300 font-mono font-bold text-xs border border-rose-500/30">
                Auto NG Trigger
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Engine AI mengenali kecacatan menggunakan pencocokan kata kunci (<em>token exact-match</em>). 
              Jika model Anda mendeteksi cacat fisik, gunakan salah satu kata kunci defect yang terdaftar: 
              <span className="font-mono text-amber-300 font-semibold"> ng, defect, cacat, reject, broken, patah, scratch, dent, missing, crack</span>.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-1.5 font-mono">
                <span className="text-sky-300 font-bold font-sans block">Defect Sisi Depan (Front):</span>
                <div className="text-emerald-400">✓ F-NG</div>
                <div className="text-emerald-400">✓ F-NG_SCRATCH</div>
                <div className="text-emerald-400">✓ F-DEFECT_KONEKTOR</div>
                <div className="text-emerald-400">✓ F-CRACK</div>
              </div>
              <div className="p-3 bg-black/40 rounded-xl border border-white/5 space-y-1.5 font-mono">
                <span className="text-amber-300 font-bold font-sans block">Defect Sisi Belakang (Rear):</span>
                <div className="text-emerald-400">✓ R-NG</div>
                <div className="text-emerald-400">✓ R-NG_KLIP_PATAH</div>
                <div className="text-emerald-400">✓ R-DEFECT_PAD</div>
                <div className="text-emerald-400">✓ R-SCRATCH</div>
              </div>
            </div>

            <div className="text-[11.5px] text-slate-300 bg-rose-950/30 p-2.5 rounded-xl border border-rose-500/20 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>
                <strong>Catatan Logika:</strong> Begitu AI mendeteksi 1 saja bounding box label defect (NG), sistem <strong>langsung memutus timer OK</strong>, membunyikan alarm suara NG, dan mencatat event cacat ke database / offline buffer.
              </span>
            </div>
          </div>

          {/* Section 4: Do's and Don'ts Table */}
          <div className="space-y-3">
            <h4 className="font-bold text-white text-base">3. Contoh Benar vs Contoh Salah</h4>
            <div className="overflow-x-auto rounded-2xl border border-white/10">
              <table className="w-full text-left text-xs">
                <thead className="bg-white/5 text-slate-400 uppercase font-mono text-[11px] border-b border-white/10">
                  <tr>
                    <th className="p-3">Kategori</th>
                    <th className="p-3 text-emerald-400 font-bold">Format Benar (Sesuai Standar)</th>
                    <th className="p-3 text-rose-400 font-bold">Format Salah (Jangan Dipakai)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono text-slate-300">
                  <tr className="hover:bg-white/5">
                    <td className="p-3 font-sans font-semibold text-white">Komponen Normal (OK)</td>
                    <td className="p-3 text-emerald-400"><code>F-74231-0K550-00</code>, <code>R-HOLE</code></td>
                    <td className="p-3 text-rose-400"><code>74231-0K550-00</code>, <code>HOLE</code> (Tanpa prefix)</td>
                  </tr>
                  <tr className="hover:bg-white/5">
                    <td className="p-3 font-sans font-semibold text-white">Kecacatan / Defect (NG)</td>
                    <td className="p-3 text-emerald-400"><code>F-NG_SCRATCH</code>, <code>R-NG_KLIP_PATAH</code></td>
                    <td className="p-3 text-rose-400"><code>SCRATCH</code>, <code>NG_BAUT</code> (Tanpa F-/R-)</td>
                  </tr>
                  <tr className="hover:bg-white/5">
                    <td className="p-3 font-sans font-semibold text-white">Pemisah Kata</td>
                    <td className="p-3 text-emerald-400"><code>R-KLIP-KUNING-01</code> atau <code>R-KLIP_KUNING_01</code></td>
                    <td className="p-3 text-rose-400"><code>R-KLIP KUNING 01</code> (Mengandung spasi)</td>
                  </tr>
                  <tr className="hover:bg-white/5">
                    <td className="p-3 font-sans font-semibold text-white">Karakter Simbol</td>
                    <td className="p-3 text-emerald-400"><code>F-PIN_1</code>, <code>R-COVER_2</code></td>
                    <td className="p-3 text-rose-400"><code>F-PIN#1</code>, <code>R-COVER@2</code> (Simbol dilarang)</td>
                  </tr>
                  <tr className="hover:bg-white/5">
                    <td className="p-3 font-sans font-semibold text-white">Nama File Model</td>
                    <td className="p-3 text-emerald-400"><code>74231-0K550-00.pt</code></td>
                    <td className="p-3 text-rose-400"><code>model_final_v2.pt</code> (Tidak sesuai Part No)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 5: Auto-Generation Rule Workflow */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/40 to-slate-900/60 border border-blue-500/20 space-y-2">
            <h4 className="font-bold text-white text-sm flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              4. Alur Otomatisasi Saat Model Diupload
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Ketika Anda mengunggah file model <code className="text-white">.pt</code>, server akan langsung mengekstrak seluruh class name pada model tersebut. 
              Sistem secara otomatis mendeteksi sisi Front/Rear dari prefix label dan menyimpannya ke tabel <strong>PartRule</strong> di database tanpa perlu input manual satu per satu.
            </p>
          </div>
        </div>

        <div className="pt-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-sm font-semibold text-slate-200 bg-white/10 hover:bg-white/15 border border-white/10 rounded-xl transition-all"
          >
            Saya Mengerti
          </button>
        </div>
      </div>
    </div>
  );
}
